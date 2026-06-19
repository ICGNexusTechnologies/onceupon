import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";
import Book from "@/models/Book";
import User from "@/models/User";
import { getAdminSession } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
import { submitOrderToGelato } from "@/lib/gelato";
import { sendOrderConfirmationEmail, sendShipmentEmail } from "@/lib/email";

export const maxDuration = 60;

/**
 * POST /api/admin/orders/:id — admin actions on a single order.
 * Body: { action: "resend-confirmation" | "resend-shipment" | "promote-gelato"
 *                 | "refund" | "note", amountCents?: number, note?: string }
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const { action, amountCents, note } = (await req.json()) as {
    action?: string;
    amountCents?: number;
    note?: string;
  };

  await dbConnect();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    if (action === "resend-confirmation") {
      const [book, user] = await Promise.all([
        Book.findById(order.bookId).select("title child").lean(),
        User.findById(order.userId).select("email").lean(),
      ]);
      if (!user?.email) return NextResponse.json({ error: "No customer email on file" }, { status: 400 });
      await sendOrderConfirmationEmail({
        to: user.email,
        bookId: String(order.bookId),
        orderNumber: order.orderNumber,
        bookTitle: book?.title ?? "",
        childName: book?.child?.name,
        format: order.format,
        amountCents: order.amountCents,
        isUpgrade: false,
      });
      return NextResponse.json({ ok: true, message: "Confirmation email re-sent" });
    }

    if (action === "resend-shipment") {
      if (order.status !== "shipped" && order.status !== "fulfilled") {
        return NextResponse.json({ error: "Order hasn't shipped yet" }, { status: 400 });
      }
      const [book, user] = await Promise.all([
        Book.findById(order.bookId).select("title").lean(),
        User.findById(order.userId).select("email").lean(),
      ]);
      if (!user?.email) return NextResponse.json({ error: "No customer email on file" }, { status: 400 });
      await sendShipmentEmail({
        to: user.email,
        bookId: String(order.bookId),
        orderNumber: order.orderNumber,
        bookTitle: book?.title ?? "",
        carrier: order.carrier,
        trackingCode: order.trackingCode,
        trackingUrl: order.trackingUrl,
      });
      return NextResponse.json({ ok: true, message: "Shipment email re-sent" });
    }

    if (action === "submit-gelato") {
      if (order.gelatoOrderId) return NextResponse.json({ error: "Already submitted to Gelato." }, { status: 400 });
      if (order.format === "pdf") return NextResponse.json({ error: "Digital order — nothing to print." }, { status: 400 });
      const book = await Book.findById(order.bookId);
      if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });
      const result = await submitOrderToGelato(book, order);
      if (!result) {
        return NextResponse.json(
          { error: "Gelato returned nothing — check GELATO_ENABLED and that the book is fully illustrated." },
          { status: 502 }
        );
      }
      order.gelatoOrderId = result.gelatoOrderId;
      order.status = "printing";
      await order.save();
      return NextResponse.json({ ok: true, message: "Submitted to Gelato" });
    }

    if (action === "promote-gelato") {
      if (!order.gelatoOrderId) {
        return NextResponse.json({ error: "No Gelato draft to promote" }, { status: 400 });
      }
      const apiKey = process.env.GELATO_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "Gelato API key not configured" }, { status: 400 });
      // Convert the held draft to a production order.
      const res = await fetch(`https://order.gelatoapis.com/v3/orders/${order.gelatoOrderId}`, {
        method: "PATCH",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ orderType: "order" }),
      });
      if (!res.ok) {
        const body = await res.text();
        return NextResponse.json(
          { error: `Gelato promotion failed (${res.status}): ${body.slice(0, 300)}` },
          { status: 502 }
        );
      }
      order.status = "printing";
      await order.save();
      return NextResponse.json({ ok: true, message: "Gelato draft promoted to production" });
    }

    if (action === "refund") {
      if (!order.stripeSessionId) {
        return NextResponse.json({ error: "No payment on file to refund" }, { status: 400 });
      }
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!pi) return NextResponse.json({ error: "No payment intent found for this order" }, { status: 400 });

      // Optional partial refund: a positive amount under the order total.
      const partial = typeof amountCents === "number" && amountCents > 0 && amountCents < order.amountCents;
      const params: { payment_intent: string; amount?: number } = { payment_intent: pi };
      if (partial) params.amount = Math.round(amountCents!);
      const refund = await stripe.refunds.create(params);

      if (!partial) order.status = "refunded";
      await order.save();
      return NextResponse.json({
        ok: true,
        message: partial
          ? `Partial refund of $${(amountCents! / 100).toFixed(2)} issued (${refund.id})`
          : `Full refund issued (${refund.id})`,
      });
    }

    if (action === "note") {
      order.note = (note || "").slice(0, 1000);
      await order.save();
      return NextResponse.json({ ok: true, message: "Note saved" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("admin action error", action, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
