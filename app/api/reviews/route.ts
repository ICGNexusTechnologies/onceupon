import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Review from "@/models/Review";
import Book from "@/models/Book";
import { getSession } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  }

  const { rating, body } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }
  if (!body || body.trim().length < 10) {
    return NextResponse.json({ error: "Review must be at least 10 characters." }, { status: 400 });
  }
  if (body.length > 1000) {
    return NextResponse.json({ error: "Review must be under 1000 characters." }, { status: 400 });
  }

  await dbConnect();

  const existing = await Review.findOne({ userId: session.userId });
  if (existing) {
    return NextResponse.json({ error: "You've already left a review." }, { status: 409 });
  }

  const hasPaidBook = await Book.exists({
    userId: session.userId,
    status: { $in: ["paid", "generating_art", "complete"] },
  });

  const review = await Review.create({
    userId: session.userId,
    userName: session.name,
    rating,
    body: body.trim(),
    verified: !!hasPaidBook,
  });

  return NextResponse.json({ review }, { status: 201 });
}
