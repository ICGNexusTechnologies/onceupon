import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { generateMfaSetup, encryptSecret } from "@/lib/mfa";

/** POST /api/auth/mfa/setup — begin TOTP setup; returns a QR + secret to scan. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.mfaEnabled) return NextResponse.json({ error: "Two-factor is already enabled." }, { status: 400 });

  const { secret, otpauth, qrDataUrl } = await generateMfaSetup(user.email);
  user.totpPending = encryptSecret(secret);
  await user.save();

  return NextResponse.json({ secret, otpauth, qrDataUrl });
}
