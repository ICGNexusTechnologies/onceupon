import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";
import { decryptSecret, verifyTotp, matchBackupCode, verifyMfaChallenge } from "@/lib/mfa";
import { rateLimit, clientIp } from "@/lib/rateLimit";

/** POST /api/auth/mfa/verify — second login step: { mfaToken, code } -> session. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`mfa:${clientIp(req)}`, 10, 600)).ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  let body: { mfaToken?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { mfaToken, code } = body;
  if (!mfaToken || !code) return NextResponse.json({ error: "Missing code." }, { status: 400 });

  const userId = await verifyMfaChallenge(mfaToken);
  if (!userId) return NextResponse.json({ error: "Your sign-in expired. Please log in again." }, { status: 401 });

  await dbConnect();
  const user = await User.findById(userId);
  if (!user || !user.mfaEnabled) return NextResponse.json({ error: "Two-factor not set up." }, { status: 401 });

  const secret = user.totpSecret ? decryptSecret(user.totpSecret) : "";
  let ok = !!secret && verifyTotp(secret, code);

  if (!ok) {
    // Try a one-time backup code; consume it on success.
    const idx = await matchBackupCode(code, user.mfaBackupCodes || []);
    if (idx >= 0) {
      ok = true;
      user.mfaBackupCodes!.splice(idx, 1);
      await user.save();
    }
  }

  if (!ok) return NextResponse.json({ error: "Invalid code." }, { status: 401 });

  const token = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
  await setSessionCookie(token);
  return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name } });
}
