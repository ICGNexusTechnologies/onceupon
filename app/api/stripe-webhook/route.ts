import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/db";
import Book from "@/models/Book";
import Order from "@/models/Order";
import GiftCard from "@/models/GiftCard";
import { getStripe } from "@/lib/stripe";
import { runArtJob } from "@/lib/artJob";
import { submitOrderToGelato } from "@/lib/gelato";
import { sendGiftCardEmail, sendOrderConfirmationEmail } from "@/lib/email";
import { nextOrderNumber } from "@/lib/orderNumber";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Stripe signature verification needs the RAW body — do not parse JSON first
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const { bookId, giftCardId, giftCard } = cs.metadata || {};

    if (giftCard === "true" && giftCardId) {
      // Gift card purchase — activate it and email the recipient
      await dbConnect();
      const gift = await GiftCard.findByIdAndUpdate(
        giftCardId,
        { status: "active" },
        { new: true }
      );
      if (gift) {
        after(async () => {
          try {
            await sendGiftCardEmail({
              recipientEmail: gift.recipientEmail,
              recipientName: gift.recipientName,
              purchaserEmail: gift.purchaserEmail,
              message: gift.message,
              code: gift.code,
              amountCents: gift.amountCents,
            });
          } catch (err) {
            console.error("gift card email failed", err);
          }
        });
      }
    } else if (bookId) {
      // Book purchase (full price, upgrade, or partial after gift card)
      const isUpgrade = cs.metadata?.upgrade === "true";
      await dbConnect();
      // Stripe keeps the phone on customer_details, not on shipping_details — merge it in.
      const shipping = cs.collected_information?.shipping_details ?? cs.customer_details ?? {};
      const phone = cs.customer_details?.phone;
      const orderDoc = await Order.findOne({ stripeSessionId: cs.id });
      if (orderDoc) {
        orderDoc.status = "paid";
        orderDoc.shippingAddress = { ...shipping, ...(phone ? { phone } : {}) };
        if (!orderDoc.orderNumber) orderDoc.orderNumber = await nextOrderNumber();
        await orderDoc.save();
      }
      const book = await Book.findByIdAndUpdate(
        bookId,
        {
          format: cs.metadata?.format,
          ...(!isUpgrade && { status: "paid" }),
        },
        { new: true }
      );

      // Send the buyer an order confirmation email
      const buyerEmail = cs.customer_details?.email || cs.customer_email || undefined;
      if (buyerEmail) {
        after(async () => {
          try {
            await sendOrderConfirmationEmail({
              to: buyerEmail,
              bookId,
              orderNumber: orderDoc?.orderNumber,
              bookTitle: book?.title ?? "",
              childName: book?.child?.name,
              format: cs.metadata?.format,
              amountCents: cs.amount_total ?? 0,
              isUpgrade,
            });
          } catch (err) {
            console.error("order confirmation email failed", err);
          }
        });
      }

      if (giftCardId) {
        await GiftCard.findByIdAndUpdate(giftCardId, {
          status: "redeemed",
          redeemedBookId: bookId,
          redeemedAt: new Date(),
        });
      }

      const physical = cs.metadata?.format === "softcover" || cs.metadata?.format === "hardcover";

      // Only run the art job for new purchases, not format upgrades.
      if (!isUpgrade) {
        // Respond to Stripe immediately; run the heavy art job after the response.
        // (On Vercel, swap this for a real queue — Inngest/QStash — for books at scale.)
        // runArtJob submits the Gelato order itself once the book is complete.
        after(async () => {
          try {
            await runArtJob(bookId);
          } catch (err) {
            console.error("post-payment art job failed", err);
          }
        });
      } else if (physical && book && orderDoc) {
        // Already-complete book bought as a printed copy (or a PDF→print upgrade):
        // the art job won't run, so submit the Gelato order directly here.
        after(async () => {
          try {
            const result = await submitOrderToGelato(book, orderDoc);
            if (result) {
              orderDoc.gelatoOrderId = result.gelatoOrderId;
              orderDoc.status = "printing";
              await orderDoc.save();
            }
          } catch (err) {
            console.error("gelato submission failed (upgrade)", err);
          }
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
