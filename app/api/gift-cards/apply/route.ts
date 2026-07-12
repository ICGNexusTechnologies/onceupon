import { NextResponse } from "next/server";
import { after } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import GiftCard from "@/models/GiftCard";
import Book from "@/models/Book";
import Order from "@/models/Order";
import { getStripe, PRICES } from "@/lib/stripe";
import { runArtJob } from "@/lib/artJob";
import { nextOrderNumber } from "@/lib/orderNumber";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import {
  giftCardCoversPurchase,
  giftCardRemainder,
  giftCardReservationExpiresAt,
} from "@/lib/giftCardRedemption";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Throttle code guessing: 10 attempts per 10 minutes per account (and per IP).
  if (
    !(await rateLimit(`gcapply:${session.userId}`, 10, 600)).ok ||
    !(await rateLimit(`gcapply-ip:${clientIp(req)}`, 20, 600)).ok
  ) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  const { bookId, format, giftCardCode } = await req.json();
  if (!mongoose.isValidObjectId(bookId)) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const price = PRICES[format];
  if (!price) return NextResponse.json({ error: "Unknown format." }, { status: 400 });
  if (!giftCardCode) return NextResponse.json({ error: "No gift card code provided." }, { status: 400 });

  await dbConnect();

  const book = await Book.findOne({ _id: bookId, userId: session.userId });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.status !== "preview") return NextResponse.json({ error: "This book is already purchased." }, { status: 400 });

  const normalizedCode = giftCardCode.toUpperCase().trim();
  const now = new Date();
  const claimableGiftFilter = {
    code: normalizedCode,
    $or: [
      { status: "active" },
      { status: "reserved", redemptionExpiresAt: { $lte: now } },
    ],
  };
  const gift = await GiftCard.findOne(claimableGiftFilter);
  if (!gift) {
    return NextResponse.json({ error: "Invalid or inactive gift card." }, { status: 400 });
  }

  const remainder = giftCardRemainder(price.amountCents, gift.amountCents);

  if (giftCardCoversPurchase(price.amountCents, gift.amountCents)) {
    // Gift card covers the full amount — no Stripe needed.
    // Atomic claim: the status filter makes concurrent requests race safely —
    // exactly one wins; the rest see null and get rejected.
    const claimed = await GiftCard.findOneAndUpdate(
      claimableGiftFilter,
      {
        $set: {
          status: "redeemed",
          redeemedByUserId: session.userId,
          redeemedBookId: bookId,
          redeemedAt: now,
        },
        $unset: {
          redemptionStripeSessionId: "",
          redemptionExpiresAt: "",
        },
      },
      { new: true }
    );
    if (!claimed) {
      return NextResponse.json({ error: "This gift card has already been used." }, { status: 400 });
    }
    await Book.findByIdAndUpdate(bookId, { status: "paid", format });
    await Order.create({
      bookId: book._id,
      userId: session.userId,
      orderNumber: await nextOrderNumber(),
      format,
      amountCents: 0,
      status: "paid",
    });
    after(async () => {
      try { await runArtJob(bookId); } catch (err) { console.error("art job failed", err); }
    });
    return NextResponse.json({ free: true });
  }

  const reservationExpiresAt = giftCardReservationExpiresAt(now);
  const reserved = await GiftCard.findOneAndUpdate(
    claimableGiftFilter,
    {
      $set: {
        status: "reserved",
        redeemedByUserId: session.userId,
        redeemedBookId: bookId,
        redeemedAt: now,
        redemptionExpiresAt: reservationExpiresAt,
      },
      $unset: { redemptionStripeSessionId: "" },
    },
    { new: true }
  );
  if (!reserved) {
    return NextResponse.json({ error: "This gift card is already being used." }, { status: 400 });
  }

  // Gift card is partial — charge the remainder via Stripe
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  let checkout;
  try {
    checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: remainder,
            product_data: {
              name: `"${book.title}" — ${price.label}`,
              description: `Gift card applied · $${Math.round(gift.amountCents / 100)} off`,
              ...(book.coverUrl ? { images: [book.coverUrl] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      ...(price.physical ? { shipping_address_collection: { allowed_countries: ["US"] } } : {}),
      metadata: {
        bookId: book._id.toString(),
        userId: session.userId,
        format,
        giftCardId: gift._id.toString(),
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&book=${book._id}`,
      cancel_url: `${appUrl}/book/${book._id}`,
    });
  } catch (err) {
    await GiftCard.findOneAndUpdate(
      { _id: reserved._id, status: "reserved", redemptionStripeSessionId: { $exists: false } },
      {
        $set: { status: "active" },
        $unset: {
          redeemedByUserId: "",
          redeemedBookId: "",
          redeemedAt: "",
          redemptionExpiresAt: "",
        },
      }
    );
    throw err;
  }

  await GiftCard.findOneAndUpdate(
    { _id: reserved._id, status: "reserved" },
    { $set: { redemptionStripeSessionId: checkout.id } }
  );

  await Order.create({
    bookId: book._id,
    userId: session.userId,
    format,
    amountCents: remainder,
    stripeSessionId: checkout.id,
    status: "pending",
  });

  return NextResponse.json({ url: checkout.url });
}
