"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  bookTitle: string;
  childName: string;
  format: string;
  amountCents: number;
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

const STATUS_ORDER = ["pending", "paid", "printing", "shipped", "fulfilled"];
const money = (c: number) => "$" + (c / 100).toFixed(2);
const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtDateTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
const needsAttention = (o: AdminOrder) => o.format !== "pdf" && o.status === "paid" && !o.gelatoOrderId;

export default function AdminDashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof AdminOrder>("createdAt");
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load orders");
      const data = await res.json();
      setOrders(data.orders);
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

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (formatFilter && o.format !== formatFilter) return false;
      if (q) {
        const hay = (o.orderNumber + " " + o.customerEmail + " " + o.customerName).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) => {
      let av: number | string = a[sortKey] as string;
      let bv: number | string = b[sortKey] as string;
      if (sortKey === "status") {
        av = STATUS_ORDER.indexOf(a.status);
        bv = STATUS_ORDER.indexOf(b.status);
      }
      if (sortKey === "amountCents") {
        av = a.amountCents;
        bv = b.amountCents;
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    return r;
  }, [orders, search, statusFilter, formatFilter, sortKey, sortDir]);

  const summary = useMemo(() => {
    const paidPlus = orders.filter((o) => ["paid", "printing", "shipped", "fulfilled"].includes(o.status));
    return {
      total: orders.length,
      revenue: paidPlus.reduce((s, o) => s + o.amountCents, 0),
      inProd: orders.filter((o) => o.status === "printing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      attn: orders.filter(needsAttention).length,
    };
  }, [orders]);

  const selected = orders.find((o) => o.id === selectedId) || null;

  function toggleSort(key: keyof AdminOrder) {
    if (key === sortKey) setSortDir((d) => d * -1);
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "amountCents" ? -1 : 1);
    }
  }

  async function runAction(orderId: string, action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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
  }

  const sortArrow = (key: keyof AdminOrder) =>
    key === sortKey ? (sortDir === 1 ? "▲" : "▼") : "↕";

  return (
    <div className="admin">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="star">✦</span>
            <div>
              Once&nbsp;Upon<small>Admin</small>
            </div>
          </div>
          <div className="who">
            <a href="/" className="backlink">
              ← Back to site
            </a>
            <span className="avatar">A</span>
          </div>
        </div>
      </header>

      <div className="wrap">
        <h1 className="page">Orders</h1>
        <p className="lede">Manage payments, production, and shipping for personalized storybooks.</p>

        <div className="cards">
          <Card lbl="Total orders" val={String(summary.total)} sub="all time" />
          <Card lbl="Revenue" val={money(summary.revenue)} sub="paid &amp; beyond" />
          <Card lbl="In production" val={String(summary.inProd)} sub="printing now" />
          <Card lbl="Shipped" val={String(summary.shipped)} sub="in transit" />
          <Card
            lbl="Needs attention"
            val={String(summary.attn)}
            sub="paid, no Gelato order"
            attention={summary.attn > 0}
          />
        </div>

        <div className="toolbar">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by order #, email, or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="printing">Printing</option>
            <option value="shipped">Shipped</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select className="filter" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
            <option value="">All formats</option>
            <option value="pdf">PDF</option>
            <option value="softcover">Softcover</option>
            <option value="hardcover">Hardcover</option>
          </select>
          <button className="filter refresh" onClick={load} title="Refresh">
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
                  <th onClick={() => toggleSort("status")}>Status <span className="arrow">{sortArrow("status")}</span></th>
                  <th className="nosort">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} onClick={() => setSelectedId(o.id)}>
                    <td className="ordno">{o.orderNumber || "—"}</td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td className="cust">
                      <div className="nm">{o.customerName || "—"}</div>
                      <div className="em">{o.customerEmail}</div>
                    </td>
                    <td className="book">
                      <div className="ti">{o.bookTitle || "—"}</div>
                      {o.childName && <div className="ch">for {o.childName}</div>}
                    </td>
                    <td>
                      <span className="pill-fmt">{o.format || "—"}</span>
                    </td>
                    <td className="amt">{money(o.amountCents)}</td>
                    <td>
                      <span className={`badge ${o.status}`}>{o.status}</span>
                    </td>
                    <td>
                      <FulfillCell o={o} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && rows.length === 0 && (
            <div className="empty">{loadError || "No orders match your filters."}</div>
          )}
          {loading && <div className="empty">Loading orders…</div>}
        </div>
      </div>

      {/* drawer */}
      <div className={`overlay ${selected ? "open" : ""}`} onClick={() => setSelectedId(null)} />
      <aside className={`drawer ${selected ? "open" : ""}`} aria-hidden={!selected}>
        {selected && (
          <OrderDetail o={selected} busy={busy} onClose={() => setSelectedId(null)} runAction={runAction} />
        )}
      </aside>

      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>

      <style jsx>{`
        .admin {
          --cream: #fbf4e6;
          --cream-2: #f4e9d2;
          --white: #fff;
          --plum: #3a2a5c;
          --soft: #5a4e6e;
          --muted: #9b92b3;
          --coral: #e0654e;
          --coral-dark: #c4452f;
          --gold: #e8a33d;
          --line: rgba(58, 42, 92, 0.1);
          --shadow: rgba(58, 42, 92, 0.12);
          --b-gray: #9b92b3;
          --b-blue: #4a78c4;
          --b-amber: #e8a33d;
          --b-teal: #3fa0a0;
          --b-green: #5da271;
          min-height: 100vh;
          background: var(--cream);
          color: var(--plum);
          font-family: "Nunito", "Segoe UI", system-ui, -apple-system, sans-serif;
          line-height: 1.5;
        }
        .admin :global(a) {
          color: var(--coral);
          text-decoration: none;
        }
        .topbar {
          background: var(--white);
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .topbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--plum);
        }
        .brand .star {
          color: var(--gold);
          font-size: 1.3rem;
        }
        .brand small {
          display: block;
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          color: var(--muted);
          text-transform: uppercase;
        }
        .who {
          font-weight: 700;
          color: var(--soft);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .backlink {
          font-weight: 700;
        }
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--coral);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
        }
        .wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .page {
          font-size: 1.6rem;
          margin: 0 0 4px;
        }
        .lede {
          color: var(--soft);
          margin-bottom: 22px;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 26px;
        }
        .toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }
        .search {
          flex: 1;
          min-width: 220px;
          position: relative;
        }
        .search input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--white);
          font: inherit;
          font-size: 0.95rem;
          color: var(--plum);
        }
        .search input:focus {
          outline: none;
          border-color: var(--coral);
        }
        .search svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }
        .filter {
          padding: 11px 14px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--white);
          font: inherit;
          font-weight: 700;
          color: var(--soft);
          font-size: 0.9rem;
          cursor: pointer;
        }
        .filter:focus {
          outline: none;
          border-color: var(--coral);
        }
        .refresh {
          color: var(--coral);
        }
        .table-wrap {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 6px 20px var(--shadow);
          border: 1px solid var(--line);
          overflow: hidden;
        }
        .table-scroll {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 880px;
        }
        thead th {
          text-align: left;
          font-size: 0.74rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 800;
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
        }
        thead th.nosort {
          cursor: default;
        }
        thead th .arrow {
          opacity: 0.5;
          font-size: 0.7rem;
        }
        tbody td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          font-size: 0.9rem;
          color: var(--soft);
          vertical-align: middle;
        }
        tbody tr {
          cursor: pointer;
          transition: background 0.12s;
        }
        tbody tr:hover {
          background: var(--cream);
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        .ordno {
          font-weight: 800;
          color: var(--plum);
        }
        .cust .nm {
          font-weight: 700;
          color: var(--plum);
        }
        .cust .em {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .book .ti {
          font-weight: 700;
          color: var(--plum);
        }
        .book .ch {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .amt {
          font-weight: 800;
          color: var(--plum);
          white-space: nowrap;
        }
        .pill-fmt {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          background: var(--cream-2);
          color: var(--soft);
          text-transform: capitalize;
        }
        .empty {
          padding: 46px;
          text-align: center;
          color: var(--muted);
          font-weight: 700;
        }
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(34, 21, 56, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: 0.25s;
          z-index: 40;
        }
        .overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100%;
          width: min(520px, 100%);
          background: var(--cream);
          box-shadow: -10px 0 40px rgba(34, 21, 56, 0.25);
          transform: translateX(100%);
          transition: transform 0.3s ease;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }
        .drawer.open {
          transform: translateX(0);
        }
        .toast {
          position: fixed;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--plum);
          color: #fff;
          padding: 13px 22px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 12px 30px rgba(34, 21, 56, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: 0.25s;
          z-index: 60;
          max-width: 90vw;
        }
        .toast.show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        @media (max-width: 1000px) {
          .cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .cards {
            grid-template-columns: 1fr;
          }
          .wrap {
            padding: 16px;
          }
        }
      `}</style>

      {/* Shared primitives used in both the table and the drawer (scoped under .admin). */}
      <style jsx global>{`
        .admin .badge {
          display: inline-block;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: capitalize;
        }
        .admin .badge.pending {
          background: #efeef3;
          color: #6b6480;
        }
        .admin .badge.paid {
          background: #e8f0fb;
          color: #4a78c4;
        }
        .admin .badge.printing {
          background: #fbf0d9;
          color: #b9791a;
        }
        .admin .badge.shipped {
          background: #dff1f1;
          color: #2c7d7d;
        }
        .admin .badge.fulfilled {
          background: #e3f3e8;
          color: #3c7d53;
        }
        .admin .badge.refunded {
          background: #f3e3e3;
          color: #b04a4a;
        }
        .admin .pill-fmt {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          background: #f4e9d2;
          color: #5a4e6e;
          text-transform: capitalize;
        }
        .admin .mono {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 0.82rem;
        }
        .admin .muted {
          color: #9b92b3;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function Card({ lbl, val, sub, attention }: { lbl: string; val: string; sub: string; attention?: boolean }) {
  return (
    <div className={`card ${attention ? "attention" : ""}`}>
      <div className="lbl">{attention ? "⚠ " : ""}{lbl}</div>
      <div className="val">{val}</div>
      <div className="sub" dangerouslySetInnerHTML={{ __html: sub }} />
      <style jsx>{`
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 6px 20px rgba(58, 42, 92, 0.12);
          border: 1px solid rgba(58, 42, 92, 0.1);
        }
        .lbl {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #9b92b3;
        }
        .val {
          font-size: 1.9rem;
          font-weight: 800;
          margin-top: 8px;
          color: #3a2a5c;
        }
        .sub {
          font-size: 0.8rem;
          color: #5a4e6e;
          margin-top: 2px;
        }
        .card.attention {
          border-color: rgba(224, 101, 78, 0.4);
          background: linear-gradient(180deg, #fff, #fff6f3);
        }
        .card.attention .val {
          color: #e0654e;
        }
      `}</style>
    </div>
  );
}

function FulfillCell({ o }: { o: AdminOrder }) {
  if (o.format === "pdf") return <span className="none">Digital — no shipping</span>;
  const dotColor =
    ({ printing: "#e8a33d", shipped: "#3fa0a0", fulfilled: "#5da271" } as Record<string, string>)[o.status] ||
    "#9b92b3";
  return (
    <div className="fulfill">
      {o.gelatoOrderId ? (
        <span className="g">
          <span className="dot" style={{ background: dotColor }} />
          {o.gelatoOrderId.slice(0, 14)}
        </span>
      ) : (
        <span className="none">No Gelato order yet</span>
      )}
      {o.trackingCode && (
        <div className="t">
          <a href={o.trackingUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            {o.carrier} {o.trackingCode}
          </a>
        </div>
      )}
      <style jsx>{`
        .g {
          font-weight: 700;
          color: #3a2a5c;
          font-size: 0.84rem;
        }
        .t {
          font-size: 0.78rem;
        }
        .none {
          color: #9b92b3;
          font-size: 0.82rem;
        }
        .dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-right: 6px;
          vertical-align: 1px;
        }
      `}</style>
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
  runAction: (id: string, action: string, confirmMsg?: string) => void;
}) {
  const isPdf = o.format === "pdf";
  const a = o.shippingAddress;
  const idx = STATUS_ORDER.indexOf(o.status);
  const times: Record<string, string> = { paid: o.createdAt, shipped: o.shippedAt };

  return (
    <>
      <div className="drawer-head">
        <div>
          <h2>{o.orderNumber || "Order"}</h2>
          <div className="sub">
            {o.bookTitle} · for {o.childName}
          </div>
        </div>
        <button className="closex" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="drawer-body">
        <div className="sec">
          <h3>Summary</h3>
          <KV k="Status" v={<span className={`badge ${o.status}`}>{o.status}</span>} />
          <KV k="Format" v={<span className="pill-fmt">{o.format}</span>} />
          <KV k="Amount" v={money(o.amountCents)} />
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
          <KV
            k="Gelato order"
            v={<span className="mono">{o.gelatoOrderId || (isPdf ? "— (digital)" : "— (not created)")}</span>}
          />
          <KV
            k="Tracking"
            v={
              o.trackingCode ? (
                <a href={o.trackingUrl} target="_blank" rel="noreferrer">
                  {o.carrier} {o.trackingCode}
                </a>
              ) : (
                "—"
              )
            }
          />
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
              className="btn btn-gold"
              disabled={busy || isPdf || !o.gelatoOrderId}
              onClick={() =>
                runAction(
                  o.id,
                  "promote-gelato",
                  `Promote ${o.orderNumber} to PRODUCTION? This sends it to print and charges your Gelato account.`
                )
              }
            >
              🏭 Promote Gelato draft
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => window.open(`/api/admin/orders/${o.id}/print-pdf`, "_blank")}
            >
              📄 View PDF
            </button>
            <button
              className="btn btn-danger full"
              disabled={busy || o.status === "pending" || o.status === "refunded"}
              onClick={() =>
                runAction(o.id, "refund", `Issue a FULL refund for ${o.orderNumber}? This returns the money to the customer.`)
              }
            >
              ↩ Issue refund
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .drawer-head {
          padding: 22px 24px;
          background: #fff;
          border-bottom: 1px solid rgba(58, 42, 92, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .drawer-head h2 {
          font-size: 1.3rem;
          margin: 0;
          color: #3a2a5c;
        }
        .drawer-head .sub {
          color: #5a4e6e;
          font-size: 0.88rem;
          margin-top: 2px;
        }
        .closex {
          border: none;
          background: #f4e9d2;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.3rem;
          line-height: 1;
          color: #5a4e6e;
          flex: none;
        }
        .drawer-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .sec {
          background: #fff;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
          border: 1px solid rgba(58, 42, 92, 0.1);
        }
        .sec h3 {
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9b92b3;
          margin: 0 0 12px;
        }
        .timeline {
          list-style: none;
          margin: 6px 0 0;
          padding: 0;
        }
        .timeline li {
          position: relative;
          padding: 0 0 18px 26px;
        }
        .timeline li:last-child {
          padding-bottom: 0;
        }
        .timeline li::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 18px;
          bottom: -2px;
          width: 2px;
          background: rgba(58, 42, 92, 0.1);
        }
        .timeline li:last-child::before {
          display: none;
        }
        .tl-dot {
          position: absolute;
          left: 0;
          top: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #f4e9d2;
          border: 2px solid #9b92b3;
        }
        .timeline li.done .tl-dot {
          background: #5da271;
          border-color: #5da271;
        }
        .timeline li.current .tl-dot {
          background: #e0654e;
          border-color: #e0654e;
          box-shadow: 0 0 0 4px rgba(224, 101, 78, 0.18);
        }
        .tl-label {
          font-weight: 800;
          color: #3a2a5c;
          text-transform: capitalize;
          font-size: 0.92rem;
        }
        .timeline li.todo .tl-label {
          color: #9b92b3;
        }
        .tl-time {
          font-size: 0.78rem;
          color: #9b92b3;
        }
        .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .btn {
          border: none;
          border-radius: 999px;
          padding: 12px 14px;
          font: inherit;
          font-weight: 800;
          font-size: 0.86rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: transform 0.12s, background 0.15s;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .btn-primary {
          background: #e0654e;
          color: #fff;
        }
        .btn-gold {
          background: #e8a33d;
          color: #3a2a5c;
        }
        .btn-ghost {
          background: #fff;
          color: #3a2a5c;
          border: 1px solid rgba(58, 42, 92, 0.1);
        }
        .btn-danger {
          background: #fff;
          color: #c4452f;
          border: 1px solid rgba(196, 69, 47, 0.35);
        }
        .btn.full {
          grid-column: 1 / -1;
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
      <style jsx>{`
        .kv {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 0;
          font-size: 0.9rem;
        }
        .k {
          color: #5a4e6e;
          font-weight: 600;
        }
        .v {
          color: #3a2a5c;
          font-weight: 700;
          text-align: right;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
