"use client";

import { useCallback, useEffect, useState } from "react";
import { money, pct } from "./format";

type Overview = {
  revenueCents: number;
  costCents: number;
  marginCents: number;
  aovCents: number;
  totalOrders: number;
  paidOrders: number;
  byStatus: Record<string, number>;
  byFormat: Record<string, { count: number; revenue: number }>;
  conversion: number;
  totalBooks: number;
  purchasedBooks: number;
  totalCustomers: number;
  stuck: { id: string; orderNumber: string; format: string }[];
  series: { date: string; orders: number; revenue: number }[];
};

export default function OverviewTab({
  toast,
  onGoToOrders,
}: {
  toast: (m: string) => void;
  onGoToOrders: () => void;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState("");
  const [gelatoMode, setGelatoMode] = useState<"order" | "draft" | "">("");
  const [savingMode, setSavingMode] = useState(false);

  const load = useCallback(async () => {
    try {
      const [oRes, cRes] = await Promise.all([fetch("/api/admin/overview"), fetch("/api/admin/config")]);
      if (!oRes.ok) throw new Error((await oRes.json()).error || "Failed to load");
      setData(await oRes.json());
      if (cRes.ok) setGelatoMode((await cRes.json()).gelatoOrderType);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setMode(mode: "order" | "draft") {
    setSavingMode(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gelatoOrderType: mode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setGelatoMode(mode);
      toast(d.message);
    } catch (e) {
      toast("⚠️ " + (e instanceof Error ? e.message : "Failed"));
    } finally {
      setSavingMode(false);
    }
  }

  if (err) return <div className="empty">{err}</div>;
  if (!data) return <div className="empty">Loading metrics…</div>;

  const maxRev = Math.max(1, ...data.series.map((s) => s.revenue));

  return (
    <div>
      <h1 className="page">Overview</h1>
      <p className="lede">Your business at a glance.</p>

      {data.stuck.length > 0 && (
        <div className="alert">
          <b>⚠ {data.stuck.length} order(s) need attention</b> — paid but no Gelato order after 1 hour (the art job
          or submission may have failed): {data.stuck.map((s) => s.orderNumber || "(no #)").join(", ")}.{" "}
          <a onClick={onGoToOrders} style={{ cursor: "pointer", fontWeight: 800 }}>
            View orders →
          </a>
        </div>
      )}

      <div className="cards">
        <Card lbl="Revenue" val={money(data.revenueCents)} sub="paid & beyond" />
        <Card lbl="Est. margin" val={money(data.marginCents)} sub={`after ~${money(data.costCents)} POD cost`} />
        <Card lbl="Avg order value" val={money(data.aovCents)} sub={`${data.paidOrders} paid orders`} />
        <Card lbl="Conversion" val={pct(data.conversion)} sub={`${data.purchasedBooks}/${data.totalBooks} books bought`} />
        <Card lbl="Customers" val={String(data.totalCustomers)} sub="registered" />
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Last 30 days — revenue</h3>
          <div className="bars">
            {data.series.map((s) => (
              <div
                key={s.date}
                className="bar"
                style={{ height: `${(s.revenue / maxRev) * 100}%` }}
                title={`${s.date}: ${money(s.revenue)} · ${s.orders} order(s)`}
              />
            ))}
          </div>
          <div className="dim" style={{ marginTop: 8, textAlign: "right" }}>
            peak day {money(maxRev)}
          </div>
        </div>

        <div>
          <div className="panel">
            <h3>By format</h3>
            {Object.keys(data.byFormat).length === 0 && <div className="muted">No paid orders yet.</div>}
            {Object.entries(data.byFormat).map(([fmt, v]) => (
              <div className="breakdown-row" key={fmt}>
                <span className="pill-fmt">{fmt}</span>
                <span>
                  <span className="strong">{v.count}</span> · {money(v.revenue)}
                </span>
              </div>
            ))}
          </div>

          <div className="panel">
            <h3>By status</h3>
            {Object.entries(data.byStatus).map(([st, n]) => (
              <div className="breakdown-row" key={st}>
                <span className={`badge ${st}`}>{st}</span>
                <span className="strong">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Fulfillment mode</h3>
        <p className="dim" style={{ marginBottom: 12 }}>
          <b>Draft</b> = new orders create a Gelato draft you approve before it prints. <b>Auto-production</b> = orders
          print and ship automatically. Changes apply immediately — no redeploy.
        </p>
        <div className="row-actions">
          <button
            className={`btn sm ${gelatoMode === "draft" ? "btn-gold" : "btn-ghost"}`}
            disabled={savingMode}
            onClick={() => setMode("draft")}
          >
            Draft (review first)
          </button>
          <button
            className={`btn sm ${gelatoMode === "order" ? "btn-primary" : "btn-ghost"}`}
            disabled={savingMode}
            onClick={() => setMode("order")}
          >
            Auto-production
          </button>
          <span className="dim" style={{ alignSelf: "center", marginLeft: 6 }}>
            current: <b>{gelatoMode || "…"}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function Card({ lbl, val, sub }: { lbl: string; val: string; sub: string }) {
  return (
    <div className="card">
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
