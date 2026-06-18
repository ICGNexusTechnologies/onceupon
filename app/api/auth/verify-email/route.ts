import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

/** POST /api/auth/verify-email — confirm a verification token. Body: { token, email } */
export async function POST(req: NextRequest) {
  let body: { token?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { token, email } = body;
  if (!token || !email) return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });

  await dbConnect();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  if (
    user.verifyTokenHash !== tokenHash ||
    !user.verifyTokenExpires ||
    user.verifyTokenExpires.getTime() < Date.now()
  ) {
    return NextResponse.json({ error: "This link is invalid or expired. Request a new one." }, { status: 400 });
  }

  user.emailVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  return NextResponse.json({ ok: true });
}
