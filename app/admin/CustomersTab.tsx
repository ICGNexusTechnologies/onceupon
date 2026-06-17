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

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

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
                <tr key={c.id}>
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
    </div>
  );
}
