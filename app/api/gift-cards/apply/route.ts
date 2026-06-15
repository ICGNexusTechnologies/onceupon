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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { bookId, format, giftCardCode } = await req.json();
  if (!mongoose.isValidObjectId(bookId)) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const price = PRICES[format];
  if (!price) return NextResponse.json({ error: "Unknown format." }, { status: 400 });
  if (!giftCardCode) return NextResponse.json({ error: "No gift card code provided." }, { status: 400 });

  await dbConnect();

  const book = await Book.findOne({ _id: bookId, userId: session.userId });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.status !== "preview") return NextResponse.json({ error: "This book is already purchased." }, { status: 400 });

  const gift = await GiftCard.findOne({ code: giftCardCode.toUpperCase().trim() });
  if (!gift || gift.status !== "active") {
    return NextResponse.json({ error: "Invalid or inactive gift card." }, { status: 400 });
  }

  const remainder = price.amountCents - gift.amountCents;

  if (remainder <= 0) {
    // Gift card covers the full amount — no Stripe needed
    await GiftCard.findByIdAndUpdate(gift._id, {
      status: "redeemed",
      redeemedByUserId: session.userId,
      redeemedBookId: bookId,
      redeemedAt: new Date(),
    });
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

  // Gift card is partial — charge the remainder via Stripe
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const checkout = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: session.email,
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
