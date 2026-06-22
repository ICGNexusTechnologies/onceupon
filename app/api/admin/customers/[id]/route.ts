import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order, { type IOrder } from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { getAdminSession } from "@/lib/admin";

const PAID_PLUS = ["paid", "printing", "shipped", "fulfilled"];

/** GET /api/admin/customers/:id — one customer's profile + their orders (admin only). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await dbConnect();

  const user = await User.findById(id).select("email name createdAt emailVerified mfaEnabled").lean();
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const orders = (await Order.find({ userId: id })
    .sort({ createdAt: -1 })
    .lean()) as unknown as IOrder[];

  const bookIds = [...new Set(orders.map((o) => String(o.bookId)).filter(Boolean))];
  const books = await Book.find({ _id: { $in: bookIds } }).select("title child").lean();
  const bookMap = new Map(books.map((b) => [String(b._id), b]));

  const orderList = orders.map((o) => {
    const b = bookMap.get(String(o.bookId));
    return {
      id: String(o._id),
      orderNumber: o.orderNumber || "",
      bookTitle: b?.title || "",
      childName: b?.child?.name || "",
      format: o.format || "",
      amountCents: o.amountCents || 0,
      status: o.status || "pending",
      trackingUrl: o.trackingUrl || "",
      createdAt: o.createdAt,
    };
  });

  const spentCents = orders
    .filter((o) => PAID_PLUS.includes(o.status))
    .reduce((s, o) => s + (o.amountCents || 0), 0);

  return NextResponse.json({
    customer: {
      id: String(user._id),
      email: user.email,
      name: user.name || "",
      joinedAt: user.createdAt,
      emailVerified: !!user.emailVerified,
      mfaEnabled: !!user.mfaEnabled,
      orders: orderList,
      paidOrders: orderList.filter((o) => PAID_PLUS.includes(o.status)).length,
      spentCents,
    },
  });
}
