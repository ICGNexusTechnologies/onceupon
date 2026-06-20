import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order, { type IOrder } from "@/models/Order";
import { getAdminSession } from "@/lib/admin";
import { getStripe } from "@/lib/stripe";
import { podCostCents, stripeFeeCents, GEN_COST_CENTS } from "@/lib/podCosts";

export const maxDuration = 30;

const PAID_PLUS = ["paid", "printing", "shipped", "fulfilled"];

/** Roll a set of orders into a revenue/cost/net summary. */
function summarize(list: IOrder[]) {
  const revenueCents = list.reduce((s, o) => s + (o.amountCents || 0), 0);
  const podCents = list.reduce((s, o) => s + podCostCents(o.format || ""), 0);
  // AI generation is incurred once per book, not per order line.
  const bookIds = new Set(list.map((o) => String(o.bookId)).filter(Boolean));
  const genCents = bookIds.size * GEN_COST_CENTS;
  const feeCents = list.reduce((s, o) => s + stripeFeeCents(o.amountCents || 0), 0);
  return {
    orders: list.length,
    revenueCents,
    podCostCents: podCents,
    genCostCents: genCents,
    stripeFeeCents: feeCents,
    netCents: revenueCents - podCents - genCents - feeCents,
  };
}

/** Live Stripe balance (your money waiting to pay out). Best-effort. */
async function stripeBalance() {
  try {
    const stripe = getStripe();
    const bal = await stripe.balance.retrieve();
    const available = bal.available.reduce((s, b) => s + b.amount, 0);
    const pending = bal.pending.reduce((s, b) => s + b.amount, 0);
    const currency = (bal.available[0]?.currency || bal.pending[0]?.currency || "usd").toUpperCase();
    return { connected: true, availableCents: available, pendingCents: pending, currency };
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : "Stripe balance unavailable" };
  }
}

/** Anthropic month-to-date spend via the org Cost Report API. Needs an admin key. */
async function anthropicSpend() {
  const key = process.env.ANTHROPIC_ADMIN_KEY;
  if (!key) return { connected: false };
  try {
    // Anthropic's cost report requires UTC day boundaries for starting_at.
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const url = `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(
      start
    )}&bucket_width=1d&limit=31`;
    const res = await fetch(url, {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) {
      const body = await res.text();
      return { connected: false, error: `Anthropic API ${res.status}: ${body.slice(0, 120)}` };
    }
    const json = (await res.json()) as { data?: { results?: { amount?: string | number }[] }[] };
    // Sum every result amount across every daily bucket. Amounts are dollar strings.
    let dollars = 0;
    for (const bucket of json.data || []) {
      for (const r of bucket.results || []) {
        const v = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
        if (typeof v === "number" && !Number.isNaN(v)) dollars += v;
      }
    }
    return { connected: true, monthToDateCents: Math.round(dollars * 100) };
  } catch (e) {
    return { connected: false, error: e instanceof Error ? e.message : "Anthropic unavailable" };
  }
}

/** GET /api/admin/finance — one place to see what's coming in and going out. */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const orders = (await Order.find({}).lean()) as unknown as IOrder[];
  const paidPlus = orders.filter((o) => PAID_PLUS.includes(o.status));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthOrders = paidPlus.filter((o) => new Date(o.createdAt) >= monthStart);

  const [stripe, anthropic] = await Promise.all([stripeBalance(), anthropicSpend()]);

  return NextResponse.json({
    allTime: summarize(paidPlus),
    thisMonth: summarize(thisMonthOrders),
    monthLabel: monthStart.toLocaleString(undefined, { month: "long", year: "numeric" }),
    refundedCount: orders.filter((o) => o.status === "refunded").length,
    stripe,
    anthropic,
    fal: {
      connected: false,
      dashboardUrl: "https://fal.ai/dashboard/billing",
      note: "fal.ai has no balance API — check or top up from their dashboard.",
    },
  });
}
