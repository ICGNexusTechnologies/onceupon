import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runArtJob } from "@/lib/artJob";
import Book from "@/models/Book";

export const maxDuration = 300;

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
    if (book.pages.some((page) => !page.imageUrl)) {
      return NextResponse.json(
        { error: "Finish generating all illustrations before building the PDF." },
        { status: 409 }
      );
    }

    await runArtJob(bookId, { rebuildPdf: true });
    const completed = await Book.findById(bookId).select("pdfUrl");
    return NextResponse.json({ pdfUrl: completed?.pdfUrl });
  } catch (err) {
    console.error("generate-pdf error", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : String(err || "Couldn't build the PDF.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
