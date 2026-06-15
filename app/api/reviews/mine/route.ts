import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Review from "@/models/Review";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ review: null });
  await dbConnect();
  const review = await Review.findOne({ userId: session.userId }).lean();
  return NextResponse.json({ review: review ?? null });
}
