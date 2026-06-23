import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";
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
// Gelato's dashboard validates the URL with browser-side requests, so allow CORS
// (and a GET/OPTIONS 2xx) or the field shows "invalid" even though it's reachable.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  return NextResponse.json({ ok: true }, { headers: CORS });
}

/** Constant-time string compare; false if lengths differ. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const secret = process.env.GELATO_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.nextUrl.searchParams.get("secret") || req.headers.get("gelato-webhook-secret");
    if (!provided || !safeEqual(provided, secret)) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail closed: an unauthenticated webhook in production lets anyone forge
    // "shipped" updates (and inject a tracking link into a customer email).
    console.error("GELATO_WEBHOOK_SECRET is not set — rejecting webhook in production.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  let payload: GelatoEvent;
  try {
    payload = (await req.json()) as GelatoEvent;
  } catch {
    // Empty / non-JSON body = Gelato's create-time validation ping. Acknowledge
    // with 200 so Gelato accepts the URL (it requires a 2xx to validate it).
    return NextResponse.json({ received: true, ignored: "no body" });
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

  // Tracking can arrive under items[].fulfillments[] OR under shipment.packages[].
  const fulfillment = payload.items?.find((it) => it.fulfillments?.length)?.fulfillments?.[0];
  const pkg = payload.shipment?.packages?.find((p) => p.trackingCode);
  const trackingCode = fulfillment?.trackingCode || pkg?.trackingCode;
  const trackingUrl = fulfillment?.trackingUrl || pkg?.trackingUrl;
  const carrier = fulfillment?.shipmentMethodName || payload.shipment?.shipmentMethodName;
  if (trackingCode) order.trackingCode = trackingCode;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (carrier) order.carrier = carrier;

  order.status = status;
  if (status === "shipped" && !order.shippedAt) order.shippedAt = new Date();

  // Email the buyer the first time the order ships — tracked by a real sent-flag,
  // not the status transition, so a prior manual sync can't suppress it.
  const shouldEmail = status === "shipped" && !order.shipmentEmailSentAt;
  if (shouldEmail) order.shipmentEmailSentAt = new Date();
  await order.save();

  if (shouldEmail) {
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
interface GelatoFulfillment {
  trackingCode?: string;
  trackingUrl?: string;
  shipmentMethodName?: string;
}
interface GelatoItem {
  fulfillmentStatus?: string;
  fulfillments?: GelatoFulfillment[];
}
interface GelatoEvent {
  orderId?: string;
  order?: { id?: string };
  fulfillmentStatus?: string;
  status?: string;
  items?: GelatoItem[];
  shipment?: {
    shipmentMethodName?: string;
    packages?: { trackingCode?: string; trackingUrl?: string }[];
  };
}
