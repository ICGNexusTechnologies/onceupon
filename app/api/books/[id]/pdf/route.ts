import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPrivatePdfDownloadUrl } from "@/lib/cloudinary";
import Book from "@/models/Book";

function pdfFilename(title: string) {
  const safeTitle = title
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return `${safeTitle || "once-upon-book"}.pdf`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  await dbConnect();
  const book = await Book.findOne({ _id: id, userId: session.userId }).select("title pdfUrl");
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
  if (!book.pdfUrl) {
    return NextResponse.json({ error: "The PDF is not ready yet." }, { status: 409 });
  }

  const cloudinaryResponse = await fetch(getPrivatePdfDownloadUrl(book.pdfUrl), {
    signal: AbortSignal.timeout(30_000),
  });
  if (!cloudinaryResponse.ok || !cloudinaryResponse.body) {
    return NextResponse.json({ error: "Couldn't download the PDF." }, { status: 502 });
  }

  return new NextResponse(cloudinaryResponse.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(book.title)}"`,
      "Cache-Control": "private, no-store",
      ...(cloudinaryResponse.headers.get("content-length")
        ? { "Content-Length": cloudinaryResponse.headers.get("content-length")! }
        : {}),
    },
  });
}
