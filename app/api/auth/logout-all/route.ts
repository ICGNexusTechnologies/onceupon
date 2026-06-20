import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession, signToken, setSessionCookie } from "@/lib/auth";

/** POST /api/auth/logout-all — sign out every other device, keep the current one. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Invalidate all tokens issued up to now. Floor to the second so the fresh
  // token we issue below (iat >= this) stays valid on the current device.
  user.sessionsValidAfter = new Date(Math.floor(Date.now() / 1000) * 1000);
  await user.save();

  const token = await signToken({ userId: user._id.toString(), email: user.email, name: user.name });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, message: "Signed out of all other devices." });
}
