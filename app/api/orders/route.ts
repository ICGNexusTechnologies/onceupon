import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Order from "@/models/Order";
import Book from "@/models/Book";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await dbConnect();
  const orders = await Order.find({ userId: session.userId, status: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .lean();

  // Pull titles for the referenced books in one query.
  const bookIds = [...new Set(orders.map((o) => String(o.bookId)))];
  const books = await Book.find({ _id: { $in: bookIds } }).select("title coverUrl").lean();
  const bookMap = new Map(books.map((b) => [String(b._id), b]));

  return NextResponse.json({
    orders: orders.map((o) => {
      const book = bookMap.get(String(o.bookId));
      return {
        bookId: String(o.bookId),
        orderNumber: o.orderNumber ?? null,
        title: book?.title ?? "Storybook",
        coverUrl: book?.coverUrl ?? null,
        format: o.format,
        amountCents: o.amountCents,
        status: o.status,
        trackingUrl: o.trackingUrl ?? null,
        createdAt: o.createdAt,
      };
    }),
  });
}
