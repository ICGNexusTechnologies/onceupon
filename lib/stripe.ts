import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy so the build doesn't require STRIPE_SECRET_KEY to be set. */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) _stripe = new Stripe(secretKey);
  return _stripe;
}

export const PRICES: Record<string, { label: string; amountCents: number; physical: boolean }> = {
  pdf: { label: "Digital PDF", amountCents: 1900, physical: false },
  softcover: { label: "Softcover + PDF", amountCents: 3900, physical: true },
  hardcover: { label: "Hardcover + PDF", amountCents: 5400, physical: true },
};
