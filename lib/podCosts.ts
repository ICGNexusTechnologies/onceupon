/**
 * Estimated Gelato print-on-demand cost (product + US shipping) per format, in
 * cents. Used to surface per-order margin in the admin. These are estimates —
 * actual Gelato charges vary slightly by destination and any Gelato+ discount.
 *   hardcover: ~$15.53 product + ~$6.99 shipping
 *   softcover: ~$11.10 product + ~$6.99 shipping
 *   pdf:       no fulfillment cost
 */
export const POD_COST_CENTS: Record<string, number> = {
  pdf: 0,
  softcover: 1809,
  hardcover: 2252,
};

export function podCostCents(format: string): number {
  return POD_COST_CENTS[format] ?? 0;
}

/** Stripe standard processing fee: 2.9% + 30¢ per successful charge. */
export function stripeFeeCents(amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.round(amountCents * 0.029) + 30;
}

/**
 * Margin in cents: what the customer paid minus our estimated POD cost and
 * the Stripe processing fee — i.e. the profit that actually lands.
 */
export function marginCents(amountCents: number, format: string): number {
  return amountCents - podCostCents(format) - stripeFeeCents(amountCents);
}
