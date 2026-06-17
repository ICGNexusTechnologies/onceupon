import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Book from "@/models/Book";
import { getAdminSession } from "@/lib/admin";

/** GET /api/admin/orders/:id/print-pdf — redirect to the book's PDF (admin only). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await dbConnect();
  const order = await Order.findById(id).select("bookId").lean();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const book = await Book.findById(order.bookId).select("pdfUrl").lean();
  if (!book?.pdfUrl) {
    return NextResponse.json({ error: "No PDF available for this book yet" }, { status: 404 });
  }
  return NextResponse.redirect(book.pdfUrl);
}
