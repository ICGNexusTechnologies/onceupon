import type { HydratedDocument } from "mongoose";
import type { IOrder } from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { mapGelatoStatus } from "@/lib/gelato";
import { sendShipmentEmail, sendDeliveryEmail } from "@/lib/email";

export type SyncResult = {
  ok: boolean;
  error?: string;
  fulfillmentStatus?: string;
  trackingCode?: string;
  emailedShipment?: boolean;
  emailedDelivery?: boolean;
};

/**
 * Pull one order's current status + tracking from Gelato, update it, and send the
 * shipped/delivered email the first time it reaches each state (tracked by sent-flags
 * so it never double-sends). Shared by the admin "Sync tracking" button and the cron
 * job so behaviour is identical whether a human or the schedule triggers it.
 */
export async function syncOrderFromGelato(order: HydratedDocument<IOrder>): Promise<SyncResult> {
  if (!order.gelatoOrderId) return { ok: false, error: "No Gelato order to sync." };
  const apiKey = process.env.GELATO_API_KEY;
  if (!apiKey) return { ok: false, error: "Gelato API key not configured." };

  const res = await fetch(`https://order.gelatoapis.com/v4/orders/${order.gelatoOrderId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) return { ok: false, error: `Gelato lookup failed (${res.status}).` };

  const g = (await res.json()) as {
    fulfillmentStatus?: string;
    shipment?: { shipmentMethodName?: string; packages?: { trackingCode?: string; trackingUrl?: string }[] };
  };

  const mapped = g.fulfillmentStatus ? mapGelatoStatus(g.fulfillmentStatus) : null;
  if (mapped) order.status = mapped;
  const pkg = g.shipment?.packages?.find((p) => p.trackingCode);
  if (g.shipment?.shipmentMethodName) order.carrier = g.shipment.shipmentMethodName;
  if (pkg?.trackingCode) order.trackingCode = pkg.trackingCode;
  if (pkg?.trackingUrl) order.trackingUrl = pkg.trackingUrl;
  if (order.status === "shipped" && !order.shippedAt) order.shippedAt = new Date();

  const emailShipped = order.status === "shipped" && !order.shipmentEmailSentAt;
  const emailDelivered = order.status === "fulfilled" && !order.deliveryEmailSentAt;
  if (emailShipped) order.shipmentEmailSentAt = new Date();
  if (emailDelivered) order.deliveryEmailSentAt = new Date();
  await order.save();

  let emailedShipment = false;
  let emailedDelivery = false;
  if (emailShipped || emailDelivered) {
    try {
      const [book, user] = await Promise.all([
        Book.findById(order.bookId).select("title").lean(),
        User.findById(order.userId).select("email").lean(),
      ]);
      if (user?.email && emailShipped) {
        await sendShipmentEmail({
          to: user.email,
          bookId: String(order.bookId),
          orderNumber: order.orderNumber,
          bookTitle: book?.title ?? "",
          carrier: order.carrier,
          trackingCode: order.trackingCode,
          trackingUrl: order.trackingUrl,
        });
        emailedShipment = true;
      }
      if (user?.email && emailDelivered) {
        await sendDeliveryEmail({
          to: user.email,
          bookId: String(order.bookId),
          orderNumber: order.orderNumber,
          bookTitle: book?.title ?? "",
        });
        emailedDelivery = true;
      }
    } catch (err) {
      console.error("shipment/delivery email failed for order", String(order._id), err);
    }
  }

  return {
    ok: true,
    fulfillmentStatus: g.fulfillmentStatus,
    trackingCode: pkg?.trackingCode,
    emailedShipment,
    emailedDelivery,
  };
}
