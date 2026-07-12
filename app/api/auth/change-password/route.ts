import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import User from "@/models/User";
import { MAX_PASSWORD_LENGTH, isValidPasswordLength } from "@/lib/password";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
    }
    if (!isValidPasswordLength(newPassword)) {
      return NextResponse.json(
        { error: `Please use a password between 8 and ${MAX_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (typeof currentPassword !== "string" || currentPassword.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("change password error", err);
    return NextResponse.json({ error: "Couldn't change your password." }, { status: 500 });
  }
}
