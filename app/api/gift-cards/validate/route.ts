import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // Throttle enumeration: 20 checks per 10 minutes per IP.
  if (!(await rateLimit(`gcvalidate:${clientIp(req)}`, 20, 600)).ok) {
    return NextResponse.json(
      { valid: false, error: "Too many attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ valid: false, error: "No code provided." });

  await dbConnect();
  const gift = await GiftCard.findOne({ code }).lean();

  if (!gift) return NextResponse.json({ valid: false, error: "Gift card not found." });
  if (gift.status === "redeemed") return NextResponse.json({ valid: false, error: "This gift card has already been used." });
  if (
    gift.status === "reserved" &&
    (!gift.redemptionExpiresAt || gift.redemptionExpiresAt.getTime() > Date.now())
  ) {
    return NextResponse.json({ valid: false, error: "This gift card is already being used." });
  }
  if (gift.status === "pending") return NextResponse.json({ valid: false, error: "This gift card is not yet active." });

  return NextResponse.json({ valid: true, amountCents: gift.amountCents });
}
