import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    await dbConnect();
    const normalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalized });

    // Always respond the same way so we don't reveal whether an account exists.
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;
      try {
        await sendPasswordResetEmail({ to: normalized, resetUrl });
      } catch (err) {
        console.error("password reset email failed", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot password error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
