"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtDate } from "./format";

type Book = {
  id: string;
  title: string;
  childName: string;
  ownerEmail: string;
  status: string;
  format: string;
  coverUrl: string;
  pdfUrl: string;
  pages: number;
  createdAt: string;
};

export default function BooksTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/books");
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        setBooks((await res.json()).books);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return books.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (s && !(b.title + " " + b.childName + " " + b.ownerEmail).toLowerCase().includes(s)) return false;
      return true;
    });
  }, [books, q, statusFilter]);

  return (
    <div>
      <h1 className="page">Books</h1>
      <p className="lede">Every book created — previews and purchases.</p>

      <div className="toolbar">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search title, child, or owner…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="preview">Preview</option>
          <option value="paid">Paid</option>
          <option value="generating_art">Generating art</option>
          <option value="complete">Complete</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="nosort">Book / Child</th>
                <th className="nosort">Owner</th>
                <th className="nosort">Status</th>
                <th className="nosort">Format</th>
                <th className="nosort">Pages</th>
                <th className="nosort">Created</th>
                <th className="nosort">PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div className="strong">{b.title}</div>
                    {b.childName && <div className="dim">for {b.childName}</div>}
                  </td>
                  <td className="dim">{b.ownerEmail || "—"}</td>
                  <td>
                    <span className={`badge ${b.status}`}>{b.status.replace("_", " ")}</span>
                  </td>
                  <td>{b.format ? <span className="pill-fmt">{b.format}</span> : <span className="muted">—</span>}</td>
                  <td className="strong">{b.pages}</td>
                  <td>{fmtDate(b.createdAt)}</td>
                  <td>{b.pdfUrl ? <a href={b.pdfUrl} target="_blank" rel="noreferrer">View</a> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && <div className="empty">{err || "No books match."}</div>}
        {loading && <div className="empty">Loading books…</div>}
      </div>
    </div>
  );
}
