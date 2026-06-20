import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { getSession, signToken, setSessionCookie } from "@/lib/auth";
import User from "@/models/User";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { name, email, password } = await req.json();
    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const normalized = email.trim().toLowerCase();
      if (normalized !== user.email) {
        // Changing the email requires the current password — otherwise a hijacked
        // session could change the email and take over the account via reset.
        if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
          return NextResponse.json(
            { error: "Enter your current password to change your email.", code: "PASSWORD_REQUIRED" },
            { status: 401 }
          );
        }
        const taken = await User.findOne({ email: normalized });
        if (taken) {
          return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
        }
        user.email = normalized;
      }
    }

    await user.save();

    // Email/name live in the JWT, so reissue the session cookie after a change.
    const token = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("profile update error", err);
    return NextResponse.json({ error: "Couldn't update your profile." }, { status: 500 });
  }
}
