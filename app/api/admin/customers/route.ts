import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order, { type IOrder } from "@/models/Order";
import User, { type IUser } from "@/models/User";
import { getAdminSession } from "@/lib/admin";

const PAID_PLUS = ["paid", "printing", "shipped", "fulfilled"];

/** GET /api/admin/customers — users with order history + lifetime value (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const [users, orders] = await Promise.all([
    User.find({}).select("email name createdAt").lean() as unknown as Promise<IUser[]>,
    Order.find({}).select("userId amountCents status createdAt").lean() as unknown as Promise<IOrder[]>,
  ]);

  const stats = new Map<string, { orders: number; spentCents: number; lastOrderAt: Date | null }>();
  for (const o of orders) {
    const k = String(o.userId);
    const s = stats.get(k) || { orders: 0, spentCents: 0, lastOrderAt: null };
    s.orders++;
    if (PAID_PLUS.includes(o.status)) s.spentCents += o.amountCents || 0;
    const d = new Date(o.createdAt);
    if (!s.lastOrderAt || d > s.lastOrderAt) s.lastOrderAt = d;
    stats.set(k, s);
  }

  const customers = users
    .map((u) => {
      const s = stats.get(String(u._id)) || { orders: 0, spentCents: 0, lastOrderAt: null };
      return {
        id: String(u._id),
        email: u.email,
        name: u.name || "",
        joinedAt: u.createdAt,
        orders: s.orders,
        spentCents: s.spentCents,
        lastOrderAt: s.lastOrderAt,
      };
    })
    .sort((a, b) => b.spentCents - a.spentCents || (b.orders - a.orders));

  return NextResponse.json({ customers });
}
