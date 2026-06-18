import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { decryptSecret, verifyTotp, generateBackupCodes } from "@/lib/mfa";

/** POST /api/auth/mfa/enable — confirm the code and turn MFA on; returns backup codes. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { code } = (await req.json()) as { code?: string };
  if (!code) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!user.totpPending) return NextResponse.json({ error: "Start setup first." }, { status: 400 });

  const secret = decryptSecret(user.totpPending);
  if (!verifyTotp(secret, code)) {
    return NextResponse.json({ error: "That code didn't match. Try the current one." }, { status: 400 });
  }

  const { plain, hashes } = await generateBackupCodes();
  user.totpSecret = user.totpPending;
  user.totpPending = undefined;
  user.mfaEnabled = true;
  user.mfaBackupCodes = hashes;
  await user.save();

  return NextResponse.json({ ok: true, backupCodes: plain });
}
