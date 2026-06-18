import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

/** GET /api/auth/verify-status — minimal flags for the verification banner. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ signedIn: false });
  await dbConnect();
  const user = await User.findById(session.userId).select("emailVerified").lean();
  return NextResponse.json({ signedIn: true, emailVerified: user?.emailVerified !== false });
}
