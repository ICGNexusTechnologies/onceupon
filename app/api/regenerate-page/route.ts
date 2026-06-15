import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generatePageImage } from "@/lib/images";
import { uploadImage } from "@/lib/cloudinary";
import Book from "@/models/Book";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { bookId, pageNumber } = await req.json();
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }

    await dbConnect();
    const book = await Book.findOne({ _id: bookId, userId: session.userId });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
    if (!book.heroReferenceUrl) {
      return NextResponse.json({ error: "The hero reference is missing." }, { status: 409 });
    }

    const page = book.pages.find((item) => item.pageNumber === Number(pageNumber));
    if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });

    const raw = await generatePageImage(
      book.heroReferenceUrl,
      book.characterSheet,
      book.artStyle,
      `${page.imagePrompt}. Clean anatomy and clothing, coherent objects, no writing, no letters, no labels, no logos, no symbols, no visual artifacts.`
    );
    page.imageUrl = await uploadImage(raw, `book-${book._id}-p${page.pageNumber}`);
    book.pdfUrl = undefined;
    await book.save();

    return NextResponse.json({ imageUrl: page.imageUrl });
  } catch (err) {
    console.error("regenerate-page error", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Couldn't regenerate the illustration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
