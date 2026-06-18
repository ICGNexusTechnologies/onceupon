import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

/** GET /api/auth/mfa/status — whether the current account has MFA enabled. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.userId).select("mfaEnabled").lean();
  return NextResponse.json({ mfaEnabled: !!user?.mfaEnabled });
}
