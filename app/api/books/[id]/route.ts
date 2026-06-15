import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";
import Order from "@/models/Order";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await dbConnect();
  const book = await Book.findOne({ _id: id, userId: session.userId }).lean();
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const paid = book.status !== "preview";
  return NextResponse.json({
    book: {
      _id: book._id,
      title: book.title,
      dedication: book.dedication,
      child: book.child,
      status: book.status,
      format: book.format,
      canGenerateArt:
        process.env.NODE_ENV !== "production" &&
        (book.status === "preview" || book.status === "error"),
      canGeneratePdf:
        book.pages.length > 0 &&
        book.pages.every((page) => Boolean(page.imageUrl)) &&
        !book.pdfUrl,
      canRegenerateArt: process.env.NODE_ENV !== "production",
      coverUrl: book.coverUrl,
      pdfUrl: paid ? book.pdfUrl : undefined,
      // Hide imagePrompts from the client; only expose page art when paid (cover always)
      pages: book.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        setting: p.setting,
        time: p.time,
        imageUrl: paid || p.pageNumber === 1 ? p.imageUrl : undefined,
      })),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await dbConnect();
  const book = await Book.findOne({ _id: id, userId: session.userId });
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (book.status !== "preview") {
    return NextResponse.json(
      { error: "Purchased books cannot be deleted." },
      { status: 409 }
    );
  }

  await Promise.all([
    Book.deleteOne({ _id: book._id }),
    Order.deleteMany({ bookId: book._id, userId: session.userId, status: "pending" }),
  ]);

  return NextResponse.json({ deleted: true });
}
