import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";
import { signMfaChallenge } from "@/lib/mfa";
import { isSuperAdminEmail } from "@/lib/admin";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Throttle brute-force attempts: 10 per 10 minutes per IP.
    if (!(await rateLimit(`login:${clientIp(req)}`, 10, 600)).ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    await dbConnect();
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    // Password is correct — if MFA is on, require the second factor before issuing a session.
    if (user.mfaEnabled) {
      const mfaToken = await signMfaChallenge(user._id.toString());
      return NextResponse.json({ mfaRequired: true, mfaToken });
    }
    const token = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    await setSessionCookie(token);
    const isAdmin = !!user.isAdmin || isSuperAdminEmail(user.email);
    return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name }, isAdmin });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
