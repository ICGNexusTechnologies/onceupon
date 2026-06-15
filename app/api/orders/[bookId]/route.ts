import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";
import Order from "@/models/Order";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { bookId } = await params;
  if (!mongoose.isValidObjectId(bookId)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await dbConnect();
  const book = await Book.findOne({ _id: bookId, userId: session.userId })
    .select("title child format coverUrl")
    .lean();
  if (!book) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // The most recent paid order for this book
  const order = await Order.findOne({ bookId, userId: session.userId, status: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .lean();
  if (!order) return NextResponse.json({ error: "No order found for this book." }, { status: 404 });

  const physical = order.format === "softcover" || order.format === "hardcover";

  return NextResponse.json({
    order: {
      bookId: String(book._id),
      orderNumber: order.orderNumber ?? null,
      title: book.title,
      childName: book.child?.name ?? "",
      coverUrl: book.coverUrl,
      format: order.format,
      amountCents: order.amountCents,
      status: order.status,
      physical,
      shippingAddress: physical ? (order.shippingAddress ?? null) : null,
      carrier: order.carrier ?? null,
      trackingCode: order.trackingCode ?? null,
      trackingUrl: order.trackingUrl ?? null,
      shippedAt: order.shippedAt ?? null,
      createdAt: order.createdAt,
    },
  });
}
