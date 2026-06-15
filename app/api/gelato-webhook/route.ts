import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { mapGelatoStatus } from "@/lib/gelato";
import { sendShipmentEmail } from "@/lib/email";

/**
 * Inbound Gelato webhook: receives fulfillment status updates and reflects them
 * on the Order (printing / shipped / fulfilled), stores tracking info, and emails
 * the buyer when the book ships. This never sends anything TO Gelato — safe to
 * enable independently of outbound order submission.
 *
 * Secure it with a shared secret: register the webhook URL in Gelato as
 *   https://yourdomain.com/api/gelato-webhook?secret=YOUR_SECRET
 * and set GELATO_WEBHOOK_SECRET to the same value.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.GELATO_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.nextUrl.searchParams.get("secret") || req.headers.get("gelato-webhook-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  }

  let payload: GelatoEvent;
  try {
    payload = (await req.json()) as GelatoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Gelato sends several event types; we only care about fulfillment status changes.
  const gelatoOrderId = payload.orderId ?? payload.order?.id;
  const gelatoStatus = payload.fulfillmentStatus ?? payload.status;
  if (!gelatoOrderId || !gelatoStatus) {
    return NextResponse.json({ received: true, ignored: "missing orderId/status" });
  }

  const status = mapGelatoStatus(gelatoStatus);
  if (!status) {
    return NextResponse.json({ received: true, ignored: gelatoStatus });
  }

  await dbConnect();
  const order = await Order.findOne({ gelatoOrderId });
  if (!order) {
    return NextResponse.json({ received: true, ignored: "unknown order" });
  }

  const wasShipped = order.status === "shipped" || order.status === "fulfilled";

  // Pull tracking off the first shipment, if present.
  const shipment = payload.shipment ?? payload.shipments?.[0];
  if (shipment) {
    if (shipment.trackingCode) order.trackingCode = shipment.trackingCode;
    if (shipment.trackingUrl) order.trackingUrl = shipment.trackingUrl;
    if (shipment.carrier) order.carrier = shipment.carrier;
  }

  order.status = status;
  if (status === "shipped" && !order.shippedAt) order.shippedAt = new Date();
  await order.save();

  // Email the buyer the first time the order transitions to shipped.
  if (status === "shipped" && !wasShipped) {
    after(async () => {
      try {
        const [book, user] = await Promise.all([
          Book.findById(order.bookId).select("title").lean(),
          User.findById(order.userId).select("email").lean(),
        ]);
        if (user?.email) {
          await sendShipmentEmail({
            to: user.email,
            bookId: String(order.bookId),
            orderNumber: order.orderNumber,
            bookTitle: book?.title ?? "",
            carrier: order.carrier,
            trackingCode: order.trackingCode,
            trackingUrl: order.trackingUrl,
          });
        }
      } catch (err) {
        console.error("shipment email failed", err);
      }
    });
  }

  return NextResponse.json({ received: true });
}

// Loose shape — Gelato's payloads vary by event; we read defensively.
interface GelatoShipment {
  trackingCode?: string;
  trackingUrl?: string;
  carrier?: string;
}
interface GelatoEvent {
  orderId?: string;
  order?: { id?: string };
  fulfillmentStatus?: string;
  status?: string;
  shipment?: GelatoShipment;
  shipments?: GelatoShipment[];
}
