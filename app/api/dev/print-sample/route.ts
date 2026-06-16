import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/Book";
import { buildPrintPdf } from "@/lib/printPdf";
import { uploadPrintPdf } from "@/lib/blob";

export const maxDuration = 300;

// DEV-ONLY: builds the Gelato print-spec PDF from an existing completed book and
// uploads it to Vercel Blob, returning a public URL Gelato can fetch.
// ?light=1 lowers image compression for a smaller test file (optional — Blob has
// no per-file size cap, so full quality is fine).
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  await dbConnect();
  const bookId = req.nextUrl.searchParams.get("bookId");
  const light = req.nextUrl.searchParams.get("light") === "1";
  const book = bookId
    ? await Book.findById(bookId)
    : await Book.findOne({ status: "complete" }).sort({ createdAt: -1 });

  if (!book) return NextResponse.json({ error: "No completed book found." }, { status: 404 });
  if (!book.pages?.length || book.pages.some((p) => !p.imageUrl)) {
    return NextResponse.json({ error: "Book is not fully illustrated." }, { status: 400 });
  }

  try {
    // 200dpi (w_1600) for the lighter test file; ≥150dpi keeps it valid for Gelato.
    const { pdf, pageCount } = await buildPrintPdf(
      book,
      light ? { imageTransform: "f_jpg,q_auto:low,w_1280" } : {}
    );
    const sizeMb = (pdf.length / 1_048_576).toFixed(1);
    const url = await uploadPrintPdf(pdf, `print-test-${book._id}`);

    return NextResponse.json({ book: book.title, pageCount, sizeMb, url });
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
