import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { decryptSecret, verifyTotp, matchBackupCode } from "@/lib/mfa";

/** POST /api/auth/mfa/disable — turn MFA off (requires a current code or backup code). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { code } = (await req.json()) as { code?: string };
  if (!code) return NextResponse.json({ error: "Enter a current code to disable." }, { status: 400 });

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!user.mfaEnabled) return NextResponse.json({ error: "Two-factor isn't enabled." }, { status: 400 });

  const secret = user.totpSecret ? decryptSecret(user.totpSecret) : "";
  const ok = (secret && verifyTotp(secret, code)) || (await matchBackupCode(code, user.mfaBackupCodes || [])) >= 0;
  if (!ok) return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  user.mfaEnabled = false;
  user.totpSecret = undefined;
  user.totpPending = undefined;
  user.mfaBackupCodes = [];
  await user.save();

  return NextResponse.json({ ok: true });
}
