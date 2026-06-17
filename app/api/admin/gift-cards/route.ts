import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import GiftCard, { type IGiftCard } from "@/models/GiftCard";
import { getAdminSession } from "@/lib/admin";
import { generateGiftCardCode } from "@/lib/giftCard";
import { sendGiftCardEmail } from "@/lib/email";

/** GET /api/admin/gift-cards — list all gift cards (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const cards = (await GiftCard.find({}).sort({ createdAt: -1 }).lean()) as unknown as IGiftCard[];
  const data = cards.map((c) => ({
    id: String(c._id),
    code: c.code,
    amountCents: c.amountCents,
    status: c.status,
    purchaserEmail: c.purchaserEmail || "",
    recipientEmail: c.recipientEmail,
    recipientName: c.recipientName,
    message: c.message || "",
    redeemedAt: c.redeemedAt || null,
    createdAt: c.createdAt,
  }));
  return NextResponse.json({ giftCards: data });
}

/** POST /api/admin/gift-cards — manually issue + email a gift card (admin only). */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { recipientEmail, recipientName, amountCents, message } = (await req.json()) as {
    recipientEmail?: string;
    recipientName?: string;
    amountCents?: number;
    message?: string;
  };

  if (!recipientEmail || !recipientName) {
    return NextResponse.json({ error: "Recipient name and email are required." }, { status: 400 });
  }
  if (!amountCents || amountCents < 100) {
    return NextResponse.json({ error: "Amount must be at least $1." }, { status: 400 });
  }

  await dbConnect();
  const code = generateGiftCardCode();
  const gift = await GiftCard.create({
    code,
    amountCents,
    status: "active", // admin-issued cards are active immediately (no payment step)
    purchaserEmail: admin.email,
    recipientEmail,
    recipientName,
    message: message || "",
  });

  try {
    await sendGiftCardEmail({
      recipientEmail,
      recipientName,
      purchaserEmail: admin.email,
      message: message || "",
      code,
      amountCents,
    });
  } catch (err) {
    console.error("admin gift card email failed", err);
    return NextResponse.json({
      ok: true,
      warning: "Card created but the email failed to send.",
      code,
      id: String(gift._id),
    });
  }

  return NextResponse.json({ ok: true, message: `Gift card ${code} issued and emailed`, code, id: String(gift._id) });
}
