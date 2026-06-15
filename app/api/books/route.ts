import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await dbConnect();
  const books = await Book.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .select("title status coverUrl pages createdAt")
    .lean();

  return NextResponse.json({
    books: books.map((b) => ({
      _id: b._id,
      title: b.title,
      status: b.status,
      coverUrl: b.coverUrl,
      pageCount: b.pages?.length ?? 0,
      createdAt: b.createdAt,
    })),
  });
}
