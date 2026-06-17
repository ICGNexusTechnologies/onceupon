import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order, { type IOrder } from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { getAdminSession } from "@/lib/admin";
import { podCostCents } from "@/lib/podCosts";

const PAID_PLUS = ["paid", "printing", "shipped", "fulfilled"];

/** GET /api/admin/overview — business metrics (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const orders = (await Order.find({}).lean()) as unknown as IOrder[];
  const paidPlus = orders.filter((o) => PAID_PLUS.includes(o.status));

  const revenueCents = paidPlus.reduce((s, o) => s + (o.amountCents || 0), 0);
  const costCents = paidPlus.reduce((s, o) => s + podCostCents(o.format || ""), 0);
  const aovCents = paidPlus.length ? Math.round(revenueCents / paidPlus.length) : 0;

  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  const byFormat: Record<string, { count: number; revenue: number }> = {};
  for (const o of paidPlus) {
    const f = o.format || "?";
    byFormat[f] = byFormat[f] || { count: 0, revenue: 0 };
    byFormat[f].count++;
    byFormat[f].revenue += o.amountCents || 0;
  }

  const [totalBooks, purchasedBooks, totalCustomers] = await Promise.all([
    Book.countDocuments(),
    Book.countDocuments({ status: { $in: ["paid", "generating_art", "complete"] } }),
    User.countDocuments(),
  ]);
  const conversion = totalBooks ? purchasedBooks / totalBooks : 0;

  // Stuck: physical, paid, no Gelato order, older than an hour (art job/submission likely failed).
  const hourAgo = Date.now() - 3600 * 1000;
  const stuck = orders
    .filter(
      (o) =>
        ["softcover", "hardcover"].includes(o.format || "") &&
        o.status === "paid" &&
        !o.gelatoOrderId &&
        new Date(o.createdAt).getTime() < hourAgo
    )
    .map((o) => ({ id: String(o._id), orderNumber: o.orderNumber || "", format: o.format }));

  // 30-day daily orders + revenue series.
  const days: Record<string, { orders: number; revenue: number }> = {};
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days[d.toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
  }
  const paidSet = new Set(paidPlus);
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    if (days[key]) {
      days[key].orders++;
      if (paidSet.has(o)) days[key].revenue += o.amountCents || 0;
    }
  }
  const series = Object.entries(days).map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    revenueCents,
    costCents,
    marginCents: revenueCents - costCents,
    aovCents,
    totalOrders: orders.length,
    paidOrders: paidPlus.length,
    byStatus,
    byFormat,
    conversion,
    totalBooks,
    purchasedBooks,
    totalCustomers,
    stuck,
    series,
  });
}
