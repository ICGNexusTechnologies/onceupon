import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";
import { MAX_PASSWORD_LENGTH, isValidPasswordLength } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();
    if (!token || !email || !password) {
      return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
    }
    if (!isValidPasswordLength(password)) {
      return NextResponse.json(
        { error: `Please use a password between 8 and ${MAX_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    await dbConnect();
    const normalized = String(email).trim().toLowerCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email: normalized,
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    // Log them straight in after a successful reset.
    const sessionToken = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    await setSessionCookie(sessionToken);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset password error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
