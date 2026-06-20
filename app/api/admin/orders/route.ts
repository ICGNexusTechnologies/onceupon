import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { getAdminSession } from "@/lib/admin";
import { podCostCents, marginCents } from "@/lib/podCosts";

/** GET /api/admin/orders — all orders joined with book + customer (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

  const bookIds = [...new Set(orders.map((o) => String(o.bookId)).filter(Boolean))];
  const userIds = [...new Set(orders.map((o) => String(o.userId)).filter(Boolean))];
  const [books, users] = await Promise.all([
    Book.find({ _id: { $in: bookIds } }).select("title child").lean(),
    User.find({ _id: { $in: userIds } }).select("email name").lean(),
  ]);
  const bookMap = new Map(books.map((b) => [String(b._id), b]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const data = orders.map((o) => {
    const b = bookMap.get(String(o.bookId));
    const u = userMap.get(String(o.userId));
    // shippingAddress is stored as { address:{line1,line2,city,state,postal_code,country}, name, phone }
    const sa = (o.shippingAddress ?? {}) as {
      name?: string;
      phone?: string;
      address?: Record<string, string>;
    };
    const addr = sa.address ?? {};
    return {
      id: String(o._id),
      orderNumber: o.orderNumber || "",
      customerEmail: u?.email || "",
      customerName: sa.name || u?.name || "",
      bookTitle: b?.title || "",
      childName: b?.child?.name || "",
      format: o.format || "",
      amountCents: o.amountCents || 0,
      podCostCents: podCostCents(o.format || ""),
      marginCents: marginCents(o.amountCents || 0, o.format || ""),
      notes: [
        ...(o.note ? [{ text: o.note, at: o.createdAt }] : []),
        ...(((o.notes as { text: string; at: Date }[] | undefined) || []).map((n) => ({ text: n.text, at: n.at }))),
      ],
      status: o.status || "pending",
      stripeSessionId: o.stripeSessionId || "",
      gelatoOrderId: o.gelatoOrderId || "",
      shippingAddress: {
        name: sa.name || "",
        phone: sa.phone || "",
        line1: addr.line1 || "",
        line2: addr.line2 || "",
        city: addr.city || "",
        state: addr.state || "",
        postalCode: addr.postal_code || "",
        country: addr.country || "",
      },
      carrier: o.carrier || "",
      trackingCode: o.trackingCode || "",
      trackingUrl: o.trackingUrl || "",
      shippedAt: o.shippedAt || "",
      createdAt: o.createdAt || "",
    };
  });

  return NextResponse.json({ orders: data });
}
