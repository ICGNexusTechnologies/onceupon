import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Please use a password of at least 6 characters." }, { status: 400 });
    }
    await dbConnect();
    const normalized = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      return NextResponse.json({ error: "That email already has an account. Try signing in." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalized,
      name: (name || normalized.split("@")[0]).trim(),
      passwordHash,
    });
    const token = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    await setSessionCookie(token);
    return NextResponse.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
