import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { getAdminSession } from "@/lib/admin";
import { sendGiftCardEmail } from "@/lib/email";

/** POST /api/admin/gift-cards/:id — actions on a gift card. Body: { action: "resend" } */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const { action } = (await req.json()) as { action?: string };

  await dbConnect();
  const gift = await GiftCard.findById(id);
  if (!gift) return NextResponse.json({ error: "Gift card not found" }, { status: 404 });

  if (action === "resend") {
    try {
      await sendGiftCardEmail({
        recipientEmail: gift.recipientEmail,
        recipientName: gift.recipientName,
        purchaserEmail: gift.purchaserEmail,
        message: gift.message,
        code: gift.code,
        amountCents: gift.amountCents,
      });
      return NextResponse.json({ ok: true, message: "Gift card email re-sent" });
    } catch (err) {
      console.error("gift card resend failed", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
