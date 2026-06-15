import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";
import Order from "@/models/Order";
import { getStripe, PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { bookId, format } = await req.json();
    const price = PRICES[format];
    if (!price) return NextResponse.json({ error: "Unknown format." }, { status: 400 });
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    await dbConnect();
    const book = await Book.findOne({ _id: bookId, userId: session.userId });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

    // Any format can be purchased on any book; a non-preview book is treated as an
    // upgrade so the webhook updates the format without re-running the art job.
    const isUpgrade = book.status !== "preview";

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price.amountCents,
            product_data: {
              name: `"${book.title}" — ${price.label}`,
              description: `Personalized 40-page storybook starring ${book.child.name}`,
              ...(book.coverUrl ? { images: [book.coverUrl] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      // US-only at launch: the $49/$34 prices assume Gelato's US print + shipping
      // cost (~$22.50 hardcover). International shipping/VAT varies too much for
      // a flat price — add countries back with per-region shipping_options.
      ...(price.physical
        ? {
            shipping_address_collection: { allowed_countries: ["US"] },
            phone_number_collection: { enabled: true },
          }
        : {}),
      metadata: { bookId: book._id.toString(), userId: session.userId, format, upgrade: isUpgrade ? "true" : "false" },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&book=${book._id}`,
      cancel_url: `${appUrl}/book/${book._id}`,
    });

    await Order.create({
      bookId: book._id,
      userId: session.userId,
      format,
      amountCents: price.amountCents,
      stripeSessionId: checkout.id,
      status: "pending",
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("checkout error", err);
    const message =
      err instanceof Error && err.message === "STRIPE_SECRET_KEY is not configured"
        ? "Checkout is not configured yet. Add STRIPE_SECRET_KEY to the server environment."
        : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
