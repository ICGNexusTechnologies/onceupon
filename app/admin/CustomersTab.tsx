"use client";

import { useEffect, useMemo, useState } from "react";
import { money, fmtDate } from "./format";

type Customer = {
  id: string;
  email: string;
  name: string;
  joinedAt: string;
  orders: number;
  spentCents: number;
  lastOrderAt: string | null;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  bookTitle: string;
  childName: string;
  format: string;
  amountCents: number;
  status: string;
  trackingUrl: string;
  createdAt: string;
};

type CustomerDetail = {
  id: string;
  email: string;
  name: string;
  joinedAt: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  orders: CustomerOrder[];
  paidOrders: number;
  spentCents: number;
};

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openCustomer(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setSelected((await res.json()).customer);
    } catch {
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/customers");
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        setCustomers((await res.json()).customers);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => (c.email + " " + c.name).toLowerCase().includes(s));
  }, [customers, q]);

  return (
    <div>
      <h1 className="page">Customers</h1>
      <p className="lede">Everyone who&rsquo;s signed up, ranked by lifetime spend.</p>

      <div className="toolbar">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search by email or name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="nosort">Customer</th>
                <th className="nosort">Joined</th>
                <th className="nosort">Orders</th>
                <th className="nosort">Lifetime spend</th>
                <th className="nosort">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => openCustomer(c.id)}>
                  <td>
                    <div className="strong">{c.name || "—"}</div>
                    <div className="dim">{c.email}</div>
                  </td>
                  <td>{fmtDate(c.joinedAt)}</td>
                  <td className="strong">{c.orders}</td>
                  <td className={c.spentCents > 0 ? "pos" : "dim"}>{money(c.spentCents)}</td>
                  <td>{c.lastOrderAt ? fmtDate(c.lastOrderAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && <div className="empty">{err || "No customers yet."}</div>}
        {loading && <div className="empty">Loading customers…</div>}
      </div>

      <div className={`overlay ${selected || detailLoading ? "open" : ""}`} onClick={() => setSelected(null)} />
      <div className={`drawer ${selected || detailLoading ? "open" : ""}`}>
        {detailLoading && !selected ? (
          <div className="drawer-body">
            <div className="empty">Loading…</div>
          </div>
        ) : selected ? (
          <>
            <div className="drawer-head">
              <div>
                <h2>{selected.name || "Customer"}</h2>
                <div className="sub">{selected.email}</div>
              </div>
              <button className="closex" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="drawer-body">
              <div className="sec">
                <h3>Profile</h3>
                <div className="kv">
                  <span className="k">Joined</span>
                  <span className="v">{fmtDate(selected.joinedAt)}</span>
                </div>
                <div className="kv">
                  <span className="k">Email verified</span>
                  <span className="v">{selected.emailVerified ? "Yes" : "No"}</span>
                </div>
                <div className="kv">
                  <span className="k">2FA enabled</span>
                  <span className="v">{selected.mfaEnabled ? "Yes" : "No"}</span>
                </div>
                <div className="kv">
                  <span className="k">Paid orders</span>
                  <span className="v">{selected.paidOrders}</span>
                </div>
                <div className="kv">
                  <span className="k">Lifetime spend</span>
                  <span className="v">{money(selected.spentCents)}</span>
                </div>
              </div>

              <div className="sec">
                <h3>Orders ({selected.orders.length})</h3>
                {selected.orders.length === 0 && <div className="muted">No orders yet.</div>}
                {selected.orders.map((o) => (
                  <div key={o.id} className="cust-order">
                    <div className="cust-order-top">
                      <span className="strong">{o.orderNumber || "—"}</span>
                      <span className={`badge ${o.status}`}>{o.status}</span>
                    </div>
                    <div className="dim">
                      {o.bookTitle || "Untitled"}
                      {o.childName ? ` · ${o.childName}` : ""}
                    </div>
                    <div className="cust-order-bot">
                      <span className="pill-fmt">{o.format}</span>
                      <span>{money(o.amountCents)}</span>
                      <span className="dim">{fmtDate(o.createdAt)}</span>
                      {o.trackingUrl && (
                        <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer">
                          Track ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .cust-order {
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }
        .cust-order:last-child {
          border-bottom: none;
        }
        .cust-order-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .cust-order-bot {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
