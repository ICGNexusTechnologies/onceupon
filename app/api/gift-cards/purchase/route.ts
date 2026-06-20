import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { getStripe, PRICES } from "@/lib/stripe";
import { generateGiftCardCode } from "@/lib/giftCard";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const TIERS: Record<string, number> = {
  pdf: 1900,
  softcover: 3400,
  hardcover: 4900,
};

export async function POST(req: Request) {
  // Unauthenticated endpoint — throttle to stop spam of DB rows / Stripe sessions.
  if (!(await rateLimit(`giftcard:${clientIp(req)}`, 10, 3600)).ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }
  const { tier, recipientEmail, recipientName, purchaserEmail, message } = await req.json();

  const amountCents = TIERS[tier];
  if (!amountCents) return NextResponse.json({ error: "Invalid gift card tier." }, { status: 400 });
  if (!recipientEmail?.trim() || !recipientName?.trim()) {
    return NextResponse.json({ error: "Recipient name and email are required." }, { status: 400 });
  }

  await dbConnect();
  const code = generateGiftCardCode();

  const gift = await GiftCard.create({
    code,
    amountCents,
    status: "pending",
    purchaserEmail: purchaserEmail?.trim() || "",
    recipientEmail: recipientEmail.trim(),
    recipientName: recipientName.trim(),
    message: message?.trim() || "",
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: purchaserEmail?.trim() || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Once Uponly Gift Card — ${PRICES[tier].label}`,
            description: `For ${recipientName.trim()} · redeemable on any Once Uponly book`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { giftCard: "true", giftCardId: gift._id.toString() },
    success_url: `${appUrl}/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/gift-cards`,
  });

  await GiftCard.findByIdAndUpdate(gift._id, { stripeSessionId: session.id });

  return NextResponse.json({ url: session.url });
}
