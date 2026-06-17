import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book, { type IBook } from "@/models/Book";
import User, { type IUser } from "@/models/User";
import { getAdminSession } from "@/lib/admin";

/** GET /api/admin/books — all books with owner + status (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const books = (await Book.find({})
    .select("title child status format coverUrl pdfUrl userId createdAt pages")
    .sort({ createdAt: -1 })
    .lean()) as unknown as (IBook & { _id: unknown })[];

  const userIds = [...new Set(books.map((b) => String(b.userId)).filter(Boolean))];
  const users = (await User.find({ _id: { $in: userIds } }).select("email").lean()) as unknown as IUser[];
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const data = books.map((b) => ({
    id: String(b._id),
    title: b.title || "(untitled)",
    childName: b.child?.name || "",
    ownerEmail: userMap.get(String(b.userId))?.email || "",
    status: b.status || "preview",
    format: b.format || "",
    coverUrl: b.coverUrl || "",
    pdfUrl: b.pdfUrl || "",
    pages: Array.isArray(b.pages) ? b.pages.length : 0,
    createdAt: b.createdAt,
  }));

  return NextResponse.json({ books: data });
}
