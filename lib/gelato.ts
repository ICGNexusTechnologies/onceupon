import type { IBook } from "@/models/Book";
import type { IOrder } from "@/models/Order";
import User from "@/models/User";
import { buildPrintPdf } from "@/lib/printPdf";
import { uploadPrintPdf } from "@/lib/blob";

const GELATO_ORDER_URL = "https://order.gelatoapis.com/v4/orders";

/** Map our format to the configured Gelato productUid (set these in env). */
function productUidFor(format: string): string | undefined {
  if (format === "hardcover") return process.env.GELATO_HARDCOVER_UID;
  if (format === "softcover") return process.env.GELATO_SOFTCOVER_UID;
  return undefined;
}

interface GelatoAddress {
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

/**
 * Gelato print-on-demand integration.
 *
 * OUTBOUND (app -> Gelato) is intentionally gated behind GELATO_ENABLED so we
 * never submit a real fulfillment order by accident (e.g. from a test purchase).
 * Flip GELATO_ENABLED=true only once the create-order call below is implemented
 * and pointed at the right environment (start with Gelato's sandbox).
 *
 * INBOUND (Gelato -> app) is handled in app/api/gelato-webhook/route.ts and is
 * always safe — it only reads status updates Gelato sends us.
 */

export const gelatoEnabled = () => process.env.GELATO_ENABLED === "true";

/** Map a Gelato fulfillment status to our Order.status values. */
export function mapGelatoStatus(gelatoStatus: string): IOrder["status"] | null {
  switch (gelatoStatus) {
    case "created":
    case "passed":
    case "in_production":
    case "printed":
      return "printing";
    case "shipped":
      return "shipped";
    case "delivered":
      return "fulfilled";
    default:
      return null; // unknown / intermediate states we don't surface
  }
}

/**
 * Submit a finished book to Gelato for printing + shipping.
 * STUB: not implemented yet. Returns null and submits nothing unless
 * GELATO_ENABLED is set AND the API call below is filled in.
 */
export async function submitOrderToGelato(
  book: IBook,
  order: IOrder
): Promise<{ gelatoOrderId: string } | null> {
  if (!gelatoEnabled()) {
    console.log(
      `[gelato] disabled — skipping submission for order ${order._id} (set GELATO_ENABLED=true to activate)`
    );
    return null;
  }

  const apiKey = process.env.GELATO_API_KEY;
  if (!apiKey) {
    console.warn("[gelato] GELATO_ENABLED is true but GELATO_API_KEY is not set — skipping");
    return null;
  }

  const productUid = productUidFor(order.format);
  if (!productUid) {
    console.warn(`[gelato] no productUid configured for format "${order.format}" — skipping`);
    return null;
  }

  if (!book.pages?.length || book.pages.some((p) => !p.imageUrl)) {
    console.warn(`[gelato] book ${book._id} is not fully illustrated yet — skipping submission`);
    return null;
  }

  // Build the single combined print PDF (front cover + interior + back cover) to
  // Gelato's spec, and host it where Gelato can fetch it. pageCount = total pages.
  const { pdf: printPdf, pageCount } = await buildPrintPdf(book);
  const fileUrl = await uploadPrintPdf(printPdf, `print-${order._id}`);

  const ship = (order.shippingAddress ?? {}) as GelatoAddress;
  const addr = ship.address ?? {};
  const nameParts = (ship.name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Buyer email is required by Gelato; pull it from the account.
  const user = await User.findById(order.userId).select("email").lean();

  // orderType "draft" lets Gelato validate + hold the order without producing it.
  // Set GELATO_ORDER_TYPE=order to send straight to production.
  const orderType = process.env.GELATO_ORDER_TYPE === "order" ? "order" : "draft";

  const payload = {
    orderType,
    orderReferenceId: order.orderNumber ?? String(order._id),
    customerReferenceId: String(order.userId),
    currency: "USD",
    items: [
      {
        itemReferenceId: String(order._id),
        productUid,
        quantity: 1,
        pageCount,
        files: [{ type: "default", url: fileUrl }],
      },
    ],
    shippingAddress: {
      firstName,
      lastName,
      addressLine1: addr.line1 ?? "",
      addressLine2: addr.line2 ?? "",
      city: addr.city ?? "",
      postCode: addr.postal_code ?? "",
      state: addr.state ?? "",
      country: addr.country ?? "US",
      email: user?.email ?? "",
      phone: ship.phone ?? "",
    },
  };

  const res = await fetch(GELATO_ORDER_URL, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gelato order failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Gelato response missing order id");
  console.log(`[gelato] created ${orderType} order ${data.id} for ${payload.orderReferenceId}`);
  return { gelatoOrderId: data.id };
}
