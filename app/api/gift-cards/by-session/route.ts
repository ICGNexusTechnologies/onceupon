import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id." }, { status: 400 });

  // Verify payment actually completed with Stripe before revealing the code
  const cs = await getStripe().checkout.sessions.retrieve(sessionId);
  if (cs.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed." }, { status: 402 });
  }

  await dbConnect();
  const gift = await GiftCard.findOne({ stripeSessionId: sessionId })
    .select("code amountCents recipientName recipientEmail status")
    .lean();

  if (!gift) return NextResponse.json({ error: "Gift card not found." }, { status: 404 });

  return NextResponse.json({ gift });
}
