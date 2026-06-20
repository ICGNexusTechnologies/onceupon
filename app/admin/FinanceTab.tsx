"use client";

import { useCallback, useEffect, useState } from "react";
import { money } from "./format";

type Summary = {
  orders: number;
  revenueCents: number;
  podCostCents: number;
  genCostCents: number;
  stripeFeeCents: number;
  netCents: number;
};

type Finance = {
  allTime: Summary;
  thisMonth: Summary;
  monthLabel: string;
  refundedCount: number;
  stripe:
    | { connected: true; availableCents: number; pendingCents: number; currency: string }
    | { connected: false; error?: string };
  anthropic:
    | { connected: true; monthToDateCents: number }
    | { connected: false; error?: string };
  fal: { connected: false; dashboardUrl: string; note: string };
};

export default function FinanceTab() {
  const [data, setData] = useState<Finance | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setData(await res.json());
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (err) return <div className="empty">{err}</div>;
  if (!data) return <div className="empty">Loading finances…</div>;

  const m = data.thisMonth;
  const a = data.allTime;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page">Finance</h1>
          <p className="lede">What&apos;s coming in and going out — all in one place.</p>
        </div>
        <button className="filter refresh" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "⟳ Refresh"}
        </button>
      </div>

      {/* Live balances across the apps you pay */}
      <h3 style={{ fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", margin: "4px 0 12px" }}>
        Balances
      </h3>
      <div className="cards">
        <div className="card">
          <div className="lbl">Stripe — available</div>
          <div className="val">
            {data.stripe.connected ? money(data.stripe.availableCents) : "—"}
          </div>
          <div className="sub">
            {data.stripe.connected
              ? `+ ${money(data.stripe.pendingCents)} pending payout`
              : data.stripe.error || "not connected"}
          </div>
        </div>
        <div className="card">
          <div className="lbl">Anthropic — this month</div>
          <div className="val">
            {data.anthropic.connected ? money(data.anthropic.monthToDateCents) : "—"}
          </div>
          <div className="sub">
            {data.anthropic.connected
              ? "month-to-date spend"
              : data.anthropic.error || "add ANTHROPIC_ADMIN_KEY to show"}
          </div>
        </div>
        <div className="card">
          <div className="lbl">fal.ai</div>
          <div className="val" style={{ fontSize: "1.1rem" }}>
            <a href={data.fal.dashboardUrl} target="_blank" rel="noopener noreferrer">
              Open billing ↗
            </a>
          </div>
          <div className="sub">no balance API — check on their dashboard</div>
        </div>
      </div>

      {/* Profit & loss from your own orders */}
      <h3 style={{ fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", margin: "20px 0 12px" }}>
        Profit &amp; loss
      </h3>
      <div className="two-col">
        <div className="panel">
          <h3>{data.monthLabel} — so far</h3>
          <PL s={m} />
        </div>
        <div className="panel">
          <h3>All time</h3>
          <PL s={a} />
        </div>
      </div>

      <p className="dim" style={{ marginTop: 4 }}>
        Net = revenue − print cost − AI generation (~$1.71/book) − Stripe fees (2.9% + 30¢). POD and gen costs are
        estimates; Stripe&apos;s balance above is the real money.
        {data.refundedCount > 0 && ` ${data.refundedCount} refunded order(s) excluded.`}
      </p>
    </div>
  );
}

function PL({ s }: { s: Summary }) {
  const Row = ({ k, v, neg, strong }: { k: string; v: number; neg?: boolean; strong?: boolean }) => (
    <div className="breakdown-row">
      <span className={strong ? "strong" : undefined}>{k}</span>
      <span className={strong ? "strong" : neg ? undefined : "pos"} style={neg ? { color: "var(--coral)" } : undefined}>
        {neg ? "−" : ""}
        {money(v)}
      </span>
    </div>
  );
  return (
    <>
      <Row k={`Revenue (${s.orders} orders)`} v={s.revenueCents} />
      <Row k="Print cost (Gelato)" v={s.podCostCents} neg />
      <Row k="AI generation (fal.ai)" v={s.genCostCents} neg />
      <Row k="Stripe fees" v={s.stripeFeeCents} neg />
      <Row k="Net profit" v={s.netCents} strong />
    </>
  );
}
