import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import { syncOrderFromGelato } from "@/lib/syncOrder";

export const maxDuration = 120;

/**
 * GET /api/cron/sync-orders — scheduled job (Vercel Cron) that pulls every
 * in-flight order's status from Gelato and sends the shipped/delivered emails
 * automatically. This makes fulfillment notifications independent of Gelato's
 * webhook reliably reaching us.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const provided = auth?.replace(/^Bearer\s+/i, "") || req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await dbConnect();
  // Only orders that are printing/shipped (or paid-with-Gelato) can still change;
  // fulfilled/refunded/canceled are terminal and skipped.
  const orders = await Order.find({
    gelatoOrderId: { $exists: true, $nin: [null, ""] },
    status: { $in: ["paid", "printing", "shipped"] },
  });

  let synced = 0;
  let shippedEmails = 0;
  let deliveredEmails = 0;
  for (const order of orders) {
    try {
      const r = await syncOrderFromGelato(order);
      if (r.ok) {
        synced++;
        if (r.emailedShipment) shippedEmails++;
        if (r.emailedDelivery) deliveredEmails++;
      }
    } catch (err) {
      console.error("cron sync failed for order", String(order._id), err);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: orders.length,
    synced,
    shippedEmails,
    deliveredEmails,
  });
}
