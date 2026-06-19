"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STATUS_ORDER, money, fmtDate, fmtDateTime } from "./format";
import { useConfirm } from "@/components/useConfirm";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  bookTitle: string;
  childName: string;
  format: string;
  amountCents: number;
  podCostCents: number;
  marginCents: number;
  note: string;
  status: string;
  stripeSessionId: string;
  gelatoOrderId: string;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  carrier: string;
  trackingCode: string;
  trackingUrl: string;
  shippedAt: string;
  createdAt: string;
};

const needsAttention = (o: AdminOrder) => o.format !== "pdf" && o.status === "paid" && !o.gelatoOrderId;

export default function OrdersTab({ toast }: { toast: (m: string) => void }) {
  const { confirm, confirmNode } = useConfirm();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof AdminOrder>("createdAt");
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load orders");
      setOrders((await res.json()).orders);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const r = orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (formatFilter && o.format !== formatFilter) return false;
      if (q) {
        const hay = (o.orderNumber + " " + o.customerEmail + " " + o.customerName).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...r].sort((a, b) => {
      let av: number | string = a[sortKey] as string;
      let bv: number | string = b[sortKey] as string;
      if (sortKey === "status") {
        av = STATUS_ORDER.indexOf(a.status);
        bv = STATUS_ORDER.indexOf(b.status);
      }
      if (sortKey === "amountCents" || sortKey === "marginCents") {
        av = a[sortKey] as number;
        bv = b[sortKey] as number;
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }, [orders, search, statusFilter, formatFilter, sortKey, sortDir]);

  const selected = orders.find((o) => o.id === selectedId) || null;

  function toggleSort(key: keyof AdminOrder) {
    if (key === sortKey) setSortDir((d) => d * -1);
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "amountCents" || key === "marginCents" ? -1 : 1);
    }
  }

  const runAction = useCallback(
    async (orderId: string, action: string, extra?: Record<string, unknown>, confirmMsg?: string) => {
      if (confirmMsg && !(await confirm({ message: confirmMsg, danger: true, confirmLabel: "Confirm" }))) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Action failed");
        toast(data.message || "Done");
        await load();
      } catch (e) {
        toast("⚠️ " + (e instanceof Error ? e.message : "Action failed"));
      } finally {
        setBusy(false);
      }
    },
    [load, toast, confirm]
  );

  const sortArrow = (key: keyof AdminOrder) => (key === sortKey ? (sortDir === 1 ? "▲" : "▼") : "↕");

  return (
    <div>
      <h1 className="page">Orders</h1>
      <p className="lede">Payments, production, and shipping.</p>

      <div className="toolbar">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search order #, email, or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {["pending", "paid", "printing", "shipped", "fulfilled", "refunded"].map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select className="filter" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
          <option value="">All formats</option>
          <option value="pdf">PDF</option>
          <option value="softcover">Softcover</option>
          <option value="hardcover">Hardcover</option>
        </select>
        <a className="filter refresh" href="/api/admin/export">
          ↓ Export CSV
        </a>
        <button className="filter refresh" onClick={load}>
          ⟳ Refresh
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort("orderNumber")}>Order # <span className="arrow">{sortArrow("orderNumber")}</span></th>
                <th onClick={() => toggleSort("createdAt")}>Date <span className="arrow">{sortArrow("createdAt")}</span></th>
                <th onClick={() => toggleSort("customerName")}>Customer <span className="arrow">{sortArrow("customerName")}</span></th>
                <th className="nosort">Book / Child</th>
                <th onClick={() => toggleSort("format")}>Format <span className="arrow">{sortArrow("format")}</span></th>
                <th onClick={() => toggleSort("amountCents")}>Amount <span className="arrow">{sortArrow("amountCents")}</span></th>
                <th onClick={() => toggleSort("marginCents")}>Margin <span className="arrow">{sortArrow("marginCents")}</span></th>
                <th onClick={() => toggleSort("status")}>Status <span className="arrow">{sortArrow("status")}</span></th>
                <th className="nosort">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => setSelectedId(o.id)}>
                  <td className="strong">
                    {o.orderNumber || "—"} {needsAttention(o) && <span title="Paid, no Gelato order">⚠</span>}
                  </td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>
                    <div className="strong">{o.customerName || "—"}</div>
                    <div className="dim">{o.customerEmail}</div>
                  </td>
                  <td>
                    <div className="strong">{o.bookTitle || "—"}</div>
                    {o.childName && <div className="dim">for {o.childName}</div>}
                  </td>
                  <td>
                    <span className="pill-fmt">{o.format || "—"}</span>
                  </td>
                  <td className="strong">{money(o.amountCents)}</td>
                  <td className={o.marginCents > 0 ? "pos" : "dim"}>{money(o.marginCents)}</td>
                  <td>
                    <span className={`badge ${o.status}`}>{o.status}</span>
                  </td>
                  <td>{fulfill(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && <div className="empty">{loadError || "No orders match your filters."}</div>}
        {loading && <div className="empty">Loading orders…</div>}
      </div>

      <div className={`overlay ${selected ? "open" : ""}`} onClick={() => setSelectedId(null)} />
      <aside className={`drawer ${selected ? "open" : ""}`} aria-hidden={!selected}>
        {selected && <OrderDetail o={selected} busy={busy} onClose={() => setSelectedId(null)} runAction={runAction} />}
      </aside>
      {confirmNode}
    </div>
  );
}

function fulfill(o: AdminOrder) {
  if (o.format === "pdf") return <span className="muted">Digital — no shipping</span>;
  return (
    <div>
      {o.gelatoOrderId ? <span className="strong" style={{ fontSize: ".82rem" }}>{o.gelatoOrderId.slice(0, 14)}</span> : <span className="muted">No Gelato order yet</span>}
      {o.trackingCode && (
        <div style={{ fontSize: ".78rem" }}>
          <a href={o.trackingUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            {o.carrier} {o.trackingCode}
          </a>
        </div>
      )}
    </div>
  );
}

function OrderDetail({
  o,
  busy,
  onClose,
  runAction,
}: {
  o: AdminOrder;
  busy: boolean;
  onClose: () => void;
  runAction: (id: string, action: string, extra?: Record<string, unknown>, confirmMsg?: string) => void;
}) {
  const isPdf = o.format === "pdf";
  const a = o.shippingAddress;
  const idx = STATUS_ORDER.indexOf(o.status);
  const times: Record<string, string> = { paid: o.createdAt, shipped: o.shippedAt };
  const [note, setNote] = useState(o.note || "");
  const [refundAmt, setRefundAmt] = useState((o.amountCents / 100).toFixed(2));

  useEffect(() => {
    setNote(o.note || "");
    setRefundAmt((o.amountCents / 100).toFixed(2));
  }, [o]);

  return (
    <>
      <div className="drawer-head">
        <div>
          <h2>{o.orderNumber || "Order"}</h2>
          <div className="sub">
            {o.bookTitle} · for {o.childName}
          </div>
        </div>
        <button className="closex" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="drawer-body">
        <div className="sec">
          <h3>Summary</h3>
          <KV k="Status" v={<span className={`badge ${o.status}`}>{o.status}</span>} />
          <KV k="Format" v={<span className="pill-fmt">{o.format}</span>} />
          <KV k="Amount" v={money(o.amountCents)} />
          <KV k="Est. POD cost" v={money(o.podCostCents)} />
          <KV k="Est. margin" v={<span className={o.marginCents > 0 ? "pos" : ""}>{money(o.marginCents)}</span>} />
          <KV k="Placed" v={fmtDateTime(o.createdAt)} />
        </div>

        <div className="sec">
          <h3>Customer</h3>
          <KV k="Name" v={o.customerName || "—"} />
          <KV k="Email" v={o.customerEmail || "—"} />
        </div>

        <div className="sec">
          <h3>Shipping address</h3>
          {a.line1 ? (
            <>
              <KV k="Name" v={a.name || "—"} />
              <KV k="Phone" v={a.phone || "—"} />
              <KV
                k="Address"
                v={
                  <>
                    {[a.line1, a.line2].filter(Boolean).join(", ")}
                    <br />
                    {a.city}, {a.state} {a.postalCode}
                    <br />
                    {a.country}
                  </>
                }
              />
            </>
          ) : (
            <div className="kv">
              <span className="v muted">No shipping address (digital order)</span>
            </div>
          )}
        </div>

        <div className="sec">
          <h3>Payment &amp; fulfillment</h3>
          <KV k="Stripe session" v={<span className="mono">{o.stripeSessionId || "—"}</span>} />
          <KV k="Gelato order" v={<span className="mono">{o.gelatoOrderId || (isPdf ? "— (digital)" : "— (not created)")}</span>} />
          <KV
            k="Tracking"
            v={o.trackingCode ? (
              <a href={o.trackingUrl} target="_blank" rel="noreferrer">
                {o.carrier} {o.trackingCode}
              </a>
            ) : (
              "—"
            )}
          />
        </div>

        <div className="sec">
          <h3>Internal note</h3>
          <div className="field">
            <textarea rows={2} value={note} placeholder="Add a private note about this order…" onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn sm btn-ghost" disabled={busy || note === (o.note || "")} onClick={() => runAction(o.id, "note", { note })}>
            Save note
          </button>
        </div>

        <div className="sec">
          <h3>Timeline</h3>
          <ul className="timeline">
            {STATUS_ORDER.map((s, i) => {
              const cls = i < idx ? "done" : i === idx ? "current" : "todo";
              const when = s === "pending" ? o.createdAt : times[s] || "";
              return (
                <li key={s} className={cls}>
                  <span className="tl-dot" />
                  <div className="tl-label">{s}</div>
                  {when && <div className="tl-time">{fmtDateTime(when)}</div>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sec">
          <h3>Actions</h3>
          <div className="actions">
            <button className="btn btn-ghost" disabled={busy} onClick={() => runAction(o.id, "resend-confirmation")}>
              ✉ Resend confirmation
            </button>
            <button
              className="btn btn-ghost"
              disabled={busy || !(o.status === "shipped" || o.status === "fulfilled")}
              onClick={() => runAction(o.id, "resend-shipment")}
            >
              📦 Resend shipment
            </button>
            <button
              className="btn btn-ghost"
              disabled={busy || isPdf || !!o.gelatoOrderId}
              onClick={() =>
                runAction(o.id, "submit-gelato", {}, `Submit ${o.orderNumber} to Gelato? Builds the print file and creates the order/draft.`)
              }
            >
              🖨 Submit to Gelato
            </button>
            <button
              className="btn btn-gold"
              disabled={busy || isPdf || !o.gelatoOrderId || o.status !== "printing"}
              onClick={() =>
                runAction(
                  o.id,
                  "promote-gelato",
                  {},
                  `Approve ${o.orderNumber} and send it to print? Gelato will print, charge your account, and ship it.`
                )
              }
            >
              ✅ Approve &amp; print
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={() => window.open(`/api/admin/orders/${o.id}/print-pdf`, "_blank")}>
              📄 View PDF
            </button>
            <button
              className="btn btn-ghost full"
              disabled={busy || isPdf || !o.gelatoOrderId || o.status === "shipped" || o.status === "fulfilled"}
              onClick={() =>
                runAction(
                  o.id,
                  "reset-fulfillment",
                  {},
                  `Reset ${o.orderNumber}'s fulfillment? This clears the current Gelato order so you can re-submit it.`
                )
              }
            >
              ↺ Reset fulfillment (retry)
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="field">
              <label>Refund amount (USD) — leave full for a complete refund</label>
              <input type="number" step="0.01" min="0" max={(o.amountCents / 100).toFixed(2)} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
            </div>
            <button
              className="btn btn-danger full"
              disabled={busy || o.status === "pending" || o.status === "refunded"}
              onClick={() => {
                const cents = Math.round(parseFloat(refundAmt || "0") * 100);
                const full = !cents || cents >= o.amountCents;
                runAction(
                  o.id,
                  "refund",
                  full ? {} : { amountCents: cents },
                  full
                    ? `Issue a FULL refund (${money(o.amountCents)}) for ${o.orderNumber}?`
                    : `Refund ${money(cents)} of ${o.orderNumber}?`
                );
              }}
            >
              ↩ Issue refund
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}
