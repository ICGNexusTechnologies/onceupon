import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { issueVerification } from "@/lib/verifyEmail";
import { rateLimit, clientIp } from "@/lib/rateLimit";

/** POST /api/auth/resend-verification — re-send the verification email to the current user. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Limit resends: 4 per 15 minutes per IP.
  if (!(await rateLimit(`verifres:${clientIp(req)}`, 4, 900)).ok) {
    return NextResponse.json({ error: "Please wait a few minutes before requesting another." }, { status: 429 });
  }

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  await issueVerification(user);
  return NextResponse.json({ ok: true, message: "Verification email sent." });
}
