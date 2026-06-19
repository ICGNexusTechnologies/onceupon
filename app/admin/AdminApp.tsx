"use client";

import { useCallback, useState } from "react";
import OverviewTab from "./OverviewTab";
import OrdersTab from "./OrdersTab";
import CustomersTab from "./CustomersTab";
import GiftCardsTab from "./GiftCardsTab";
import ReviewsTab from "./ReviewsTab";
import BooksTab from "./BooksTab";
import TeamTab from "./TeamTab";
import AdminIdleTimeout from "./AdminIdleTimeout";

const BASE_TABS = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
  { key: "giftcards", label: "Gift cards" },
  { key: "reviews", label: "Reviews" },
  { key: "books", label: "Books" },
];

export default function AdminApp({ isSuper }: { isSuper: boolean }) {
  const TABS = isSuper ? [...BASE_TABS, { key: "team", label: "Team" }] : BASE_TABS;
  const [tab, setTab] = useState("overview");
  const [toastMsg, setToastMsg] = useState("");

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(""), 2800);
  }, []);

  return (
    <div className="admin">
      <AdminIdleTimeout />
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
        <nav className="tabs">
          <div className="tabs-inner">
            {TABS.map((t) => (
              <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="wrap">
        {tab === "overview" && <OverviewTab toast={toast} onGoToOrders={() => setTab("orders")} />}
        {tab === "orders" && <OrdersTab toast={toast} />}
        {tab === "customers" && <CustomersTab />}
        {tab === "giftcards" && <GiftCardsTab toast={toast} />}
        {tab === "reviews" && <ReviewsTab toast={toast} />}
        {tab === "books" && <BooksTab />}
        {tab === "team" && isSuper && <TeamTab toast={toast} />}
      </div>

      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>

      <style jsx global>{`
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
          --green: #5da271;
          min-height: 100vh;
          background: var(--cream);
          color: var(--plum);
          font-family: "Nunito", "Segoe UI", system-ui, -apple-system, sans-serif;
          line-height: 1.5;
        }
        .admin a {
          color: var(--coral);
          text-decoration: none;
        }
        .admin .topbar {
          background: var(--white);
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .admin .topbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .admin .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .admin .brand .star {
          color: var(--gold);
          font-size: 1.3rem;
        }
        .admin .brand small {
          display: block;
          font-weight: 700;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          color: var(--muted);
          text-transform: uppercase;
        }
        .admin .who {
          font-weight: 700;
          color: var(--soft);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .admin .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--coral);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
        }
        .admin .tabs {
          border-top: 1px solid var(--line);
          overflow-x: auto;
        }
        .admin .tabs-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          gap: 4px;
        }
        .admin .tab {
          border: none;
          background: none;
          padding: 13px 16px;
          font: inherit;
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--muted);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          white-space: nowrap;
        }
        .admin .tab:hover {
          color: var(--soft);
        }
        .admin .tab.active {
          color: var(--coral);
          border-bottom-color: var(--coral);
        }
        .admin .wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .admin .page {
          font-size: 1.5rem;
          margin: 0 0 4px;
        }
        .admin .lede {
          color: var(--soft);
          margin-bottom: 22px;
        }
        .admin .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .admin .card {
          background: var(--white);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 6px 20px var(--shadow);
          border: 1px solid var(--line);
        }
        .admin .card .lbl {
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .admin .card .val {
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 8px;
          color: var(--plum);
        }
        .admin .card .sub {
          font-size: 0.8rem;
          color: var(--soft);
          margin-top: 2px;
        }
        .admin .card.attention {
          border-color: rgba(224, 101, 78, 0.4);
          background: linear-gradient(180deg, #fff, #fff6f3);
        }
        .admin .card.attention .val {
          color: var(--coral);
        }
        .admin .alert {
          background: linear-gradient(180deg, #fff, #fff6f3);
          border: 1px solid rgba(224, 101, 78, 0.4);
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 22px;
          color: var(--plum);
        }
        .admin .alert b {
          color: var(--coral-dark);
        }
        .admin .toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin .search {
          flex: 1;
          min-width: 220px;
          position: relative;
        }
        .admin .search input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--white);
          font: inherit;
          font-size: 0.95rem;
          color: var(--plum);
        }
        .admin .search input:focus {
          outline: none;
          border-color: var(--coral);
        }
        .admin .search svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }
        .admin .filter {
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
        .admin .filter:focus {
          outline: none;
          border-color: var(--coral);
        }
        .admin .filter.refresh {
          color: var(--coral);
        }
        .admin .table-wrap {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 6px 20px var(--shadow);
          border: 1px solid var(--line);
          overflow: hidden;
        }
        .admin .table-scroll {
          overflow-x: auto;
        }
        .admin table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }
        .admin thead th {
          text-align: left;
          font-size: 0.72rem;
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
        .admin thead th.nosort {
          cursor: default;
        }
        .admin thead th .arrow {
          opacity: 0.5;
          font-size: 0.7rem;
        }
        .admin tbody td {
          padding: 13px 16px;
          border-bottom: 1px solid var(--line);
          font-size: 0.9rem;
          color: var(--soft);
          vertical-align: middle;
        }
        .admin tbody tr.clickable {
          cursor: pointer;
          transition: background 0.12s;
        }
        .admin tbody tr.clickable:hover {
          background: var(--cream);
        }
        .admin tbody tr:last-child td {
          border-bottom: none;
        }
        .admin .strong {
          font-weight: 800;
          color: var(--plum);
        }
        .admin .dim {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .admin .pos {
          color: var(--green);
          font-weight: 800;
        }
        .admin .badge {
          display: inline-block;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: capitalize;
        }
        .admin .badge.pending { background: #efeef3; color: #6b6480; }
        .admin .badge.paid { background: #e8f0fb; color: #4a78c4; }
        .admin .badge.printing { background: #fbf0d9; color: #b9791a; }
        .admin .badge.shipped { background: #dff1f1; color: #2c7d7d; }
        .admin .badge.fulfilled { background: #e3f3e8; color: #3c7d53; }
        .admin .badge.refunded { background: #f3e3e3; color: #b04a4a; }
        .admin .badge.canceled { background: #efeef3; color: #8a8398; }
        .admin .badge.active { background: #e3f3e8; color: #3c7d53; }
        .admin .badge.redeemed { background: #efeef3; color: #6b6480; }
        .admin .badge.complete { background: #e3f3e8; color: #3c7d53; }
        .admin .badge.preview { background: #efeef3; color: #6b6480; }
        .admin .badge.generating_art { background: #fbf0d9; color: #b9791a; }
        .admin .badge.error { background: #f3e3e3; color: #b04a4a; }
        .admin .pill-fmt {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          background: var(--cream-2);
          color: var(--soft);
          text-transform: capitalize;
        }
        .admin .mono {
          font-family: ui-monospace, Menlo, Consolas, monospace;
          font-size: 0.82rem;
        }
        .admin .empty {
          padding: 46px;
          text-align: center;
          color: var(--muted);
          font-weight: 700;
        }
        .admin .panel {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 6px 20px var(--shadow);
          border: 1px solid var(--line);
          padding: 20px;
          margin-bottom: 20px;
        }
        .admin .panel h3 {
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 14px;
        }
        .admin .two-col {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 820px) {
          .admin .two-col {
            grid-template-columns: 1fr;
          }
        }
        .admin .bars {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 140px;
        }
        .admin .bar {
          flex: 1;
          background: var(--coral);
          border-radius: 3px 3px 0 0;
          min-height: 2px;
          opacity: 0.85;
        }
        .admin .bar:hover {
          opacity: 1;
        }
        .admin .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
          font-size: 0.9rem;
        }
        .admin .breakdown-row:last-child {
          border-bottom: none;
        }
        .admin .field {
          margin-bottom: 12px;
        }
        .admin .field label {
          display: block;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--soft);
          margin-bottom: 5px;
        }
        .admin .field input,
        .admin .field textarea,
        .admin .field select {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--white);
          font: inherit;
          font-size: 0.92rem;
          color: var(--plum);
        }
        .admin .field input:focus,
        .admin .field textarea:focus {
          outline: none;
          border-color: var(--coral);
        }
        .admin .overlay {
          position: fixed;
          inset: 0;
          background: rgba(34, 21, 56, 0.4);
          opacity: 0;
          visibility: hidden;
          transition: 0.25s;
          z-index: 40;
        }
        .admin .overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .admin .drawer {
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
        .admin .drawer.open {
          transform: translateX(0);
        }
        .admin .drawer-head {
          padding: 22px 24px;
          background: var(--white);
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .admin .drawer-head h2 {
          font-size: 1.25rem;
          margin: 0;
        }
        .admin .drawer-head .sub {
          color: var(--soft);
          font-size: 0.88rem;
          margin-top: 2px;
        }
        .admin .closex {
          border: none;
          background: var(--cream-2);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.3rem;
          line-height: 1;
          color: var(--soft);
          flex: none;
        }
        .admin .drawer-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .admin .sec {
          background: var(--white);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
          border: 1px solid var(--line);
        }
        .admin .sec h3 {
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 12px;
        }
        .admin .kv {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 0;
          font-size: 0.9rem;
        }
        .admin .kv .k {
          color: var(--soft);
          font-weight: 600;
        }
        .admin .kv .v {
          color: var(--plum);
          font-weight: 700;
          text-align: right;
          word-break: break-word;
        }
        .admin .muted {
          color: var(--muted);
          font-weight: 600;
        }
        .admin .timeline {
          list-style: none;
          margin: 6px 0 0;
          padding: 0;
        }
        .admin .timeline li {
          position: relative;
          padding: 0 0 18px 26px;
        }
        .admin .timeline li:last-child {
          padding-bottom: 0;
        }
        .admin .timeline li::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 18px;
          bottom: -2px;
          width: 2px;
          background: var(--line);
        }
        .admin .timeline li:last-child::before {
          display: none;
        }
        .admin .tl-dot {
          position: absolute;
          left: 0;
          top: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--cream-2);
          border: 2px solid var(--muted);
        }
        .admin .timeline li.done .tl-dot {
          background: var(--green);
          border-color: var(--green);
        }
        .admin .timeline li.current .tl-dot {
          background: var(--coral);
          border-color: var(--coral);
          box-shadow: 0 0 0 4px rgba(224, 101, 78, 0.18);
        }
        .admin .tl-label {
          font-weight: 800;
          color: var(--plum);
          text-transform: capitalize;
          font-size: 0.92rem;
        }
        .admin .timeline li.todo .tl-label {
          color: var(--muted);
        }
        .admin .tl-time {
          font-size: 0.78rem;
          color: var(--muted);
        }
        .admin .actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .admin .btn {
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
        .admin .btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .admin .btn-primary { background: var(--coral); color: #fff; }
        .admin .btn-gold { background: var(--gold); color: var(--plum); }
        .admin .btn-ghost { background: var(--white); color: var(--plum); border: 1px solid var(--line); }
        .admin .btn-danger { background: #fff; color: var(--coral-dark); border: 1px solid rgba(196, 69, 47, 0.35); }
        .admin .btn.full { grid-column: 1 / -1; }
        .admin .btn.sm { padding: 7px 12px; font-size: 0.8rem; border-radius: 999px; }
        .admin .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .admin .row-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .admin .toast {
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
          text-align: center;
        }
        .admin .toast.show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
    </div>
  );
}
