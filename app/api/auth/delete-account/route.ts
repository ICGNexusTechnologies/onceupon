import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Book from "@/models/Book";
import Order from "@/models/Order";
import Review from "@/models/Review";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/admin";
import { MAX_PASSWORD_LENGTH } from "@/lib/password";

/** POST /api/auth/delete-account — permanently delete the current account (password required). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password) return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Protect the master account from self-lockout.
  if (isSuperAdminEmail(user.email)) {
    return NextResponse.json(
      { error: "This is the owner account — remove it from ADMIN_EMAILS before deleting." },
      { status: 403 }
    );
  }

  await Promise.all([
    Book.deleteMany({ userId: user._id }),
    Order.deleteMany({ userId: user._id }),
    Review.deleteMany({ userId: user._id }),
  ]);
  await User.findByIdAndDelete(user._id);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
