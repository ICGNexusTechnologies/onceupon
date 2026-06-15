import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runArtJob } from "@/lib/artJob";
import Book from "@/models/Book";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { bookId } = await req.json();
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    await dbConnect();
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        userId: session.userId,
        status: { $in: ["preview", "error"] },
      },
      { status: "generating_art", format: "development" },
      { new: true }
    );

    if (!book) {
      const existing = await Book.findOne({ _id: bookId, userId: session.userId }).select("status");
      if (!existing) return NextResponse.json({ error: "Book not found." }, { status: 404 });
      if (existing.status === "generating_art") {
        return NextResponse.json({ status: existing.status });
      }
      return NextResponse.json(
        { error: "This book cannot be generated from its current status." },
        { status: 409 }
      );
    }

    after(async () => {
      try {
        await runArtJob(bookId);
      } catch (err) {
        console.error("development art job failed", err);
      }
    });

    return NextResponse.json({ status: book.status });
  } catch (err) {
    console.error("generate-art error", err);
    const message = err instanceof Error ? err.message : "Couldn't start illustration generation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
