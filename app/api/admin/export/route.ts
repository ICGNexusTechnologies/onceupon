import { dbConnect } from "@/lib/db";
import Order, { type IOrder } from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { getAdminSession } from "@/lib/admin";
import { podCostCents, marginCents } from "@/lib/podCosts";
import { NextResponse } from "next/server";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/admin/export — orders as a CSV download (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const orders = (await Order.find({}).sort({ createdAt: -1 }).lean()) as unknown as IOrder[];
  const bookIds = [...new Set(orders.map((o) => String(o.bookId)).filter(Boolean))];
  const userIds = [...new Set(orders.map((o) => String(o.userId)).filter(Boolean))];
  const [books, users] = await Promise.all([
    Book.find({ _id: { $in: bookIds } }).select("title child").lean(),
    User.find({ _id: { $in: userIds } }).select("email").lean(),
  ]);
  const bookMap = new Map(books.map((b) => [String(b._id), b]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const headers = [
    "Order #",
    "Date",
    "Status",
    "Customer email",
    "Book",
    "Child",
    "Format",
    "Amount USD",
    "Est. POD cost USD",
    "Est. margin USD",
    "Gelato order",
    "Tracking",
    "Ship city",
    "Ship state",
  ];

  const rows = orders.map((o) => {
    const b = bookMap.get(String(o.bookId));
    const u = userMap.get(String(o.userId));
    const sa = (o.shippingAddress ?? {}) as { address?: Record<string, string> };
    const addr = sa.address ?? {};
    return [
      o.orderNumber || "",
      new Date(o.createdAt).toISOString(),
      o.status,
      u?.email || "",
      b?.title || "",
      b?.child?.name || "",
      o.format || "",
      ((o.amountCents || 0) / 100).toFixed(2),
      (podCostCents(o.format || "") / 100).toFixed(2),
      (marginCents(o.amountCents || 0, o.format || "") / 100).toFixed(2),
      o.gelatoOrderId || "",
      o.trackingCode || "",
      addr.city || "",
      addr.state || "",
    ]
      .map(csvCell)
      .join(",");
  });

  const csv = [headers.map(csvCell).join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="once-upon-orders-${date}.csv"`,
    },
  });
}
