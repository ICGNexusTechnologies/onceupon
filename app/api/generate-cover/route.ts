import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";
import { generateCoverImage } from "@/lib/images";
import { uploadImage } from "@/lib/cloudinary";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { bookId } = await req.json();
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }
    await dbConnect();
    const book = await Book.findOne({ _id: bookId, userId: session.userId });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
    if (book.coverUrl) return NextResponse.json({ coverUrl: book.coverUrl }); // idempotent

    const rawUrl = await generateCoverImage(book.characterSheet, book.artStyle, book.world, book.title);
    const coverUrl = await uploadImage(rawUrl, `cover-${book._id}`);
    book.coverUrl = coverUrl;
    await book.save();

    return NextResponse.json({ coverUrl });
  } catch (err) {
    console.error("generate-cover error", err);
    const message = err instanceof Error ? err.message : "Couldn't create the cover.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
