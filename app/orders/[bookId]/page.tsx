"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface ShippingAddress {
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface OrderDetails {
  bookId: string;
  orderNumber: string | null;
  title: string;
  childName: string;
  coverUrl?: string;
  format: string;
  amountCents: number;
  status: string;
  physical: boolean;
  shippingAddress: ShippingAddress | null;
  carrier: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  createdAt: string;
}

const PHYSICAL_STEPS = [
  { key: "paid", label: "Confirmed" },
  { key: "printing", label: "Printing" },
  { key: "shipped", label: "Shipped" },
  { key: "fulfilled", label: "Delivered" },
];

const FORMAT_LABEL: Record<string, string> = {
  pdf: "Digital PDF",
  softcover: "Softcover + PDF",
  hardcover: "Hardcover + PDF",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Confirmed — preparing your book",
  printing: "Printing",
  shipped: "Shipped",
  fulfilled: "Delivered",
};

export default function OrderPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${bookId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setOrder(d.order);
      })
      .catch((e) => setErr(e.message || "Order not found."));
  }, [bookId]);

  if (err) {
    return (
      <div className="wrap" style={{ padding: "80px 28px", textAlign: "center" }}>
        <h2 style={{ color: "var(--plum)" }}>{err}</h2>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to my books
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        <h2>Loading your order…</h2>
      </div>
    );
  }

  const amount = `$${(order.amountCents / 100).toFixed(2)}`;
  const addr = order.shippingAddress?.address;

  return (
    <div className="wrap" style={{ maxWidth: 640, padding: "56px 28px 80px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 4 }}>
        Order confirmed 🎉
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 8 }}>
        Thanks for your order! Here are the details — keep this for your records.
      </p>
      {order.orderNumber && (
        <p style={{ color: "var(--plum)", fontWeight: 700, marginBottom: 32 }}>
          Order {order.orderNumber}
        </p>
      )}

      <div className="buy-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          {order.coverUrl && (
            <div
              style={{
                width: 64,
                aspectRatio: "4/5",
                borderRadius: "6px 9px 9px 6px",
                backgroundImage: `url(${order.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
                boxShadow: "-4px 6px 14px var(--shadow)",
              }}
            />
          )}
          <div>
            <h3 style={{ margin: 0, color: "var(--plum)" }}>{order.title}</h3>
            {order.childName && (
              <div style={{ color: "var(--ink-soft)", fontSize: ".92rem" }}>
                Starring {order.childName}
              </div>
            )}
          </div>
        </div>

        <Row label="Format" value={FORMAT_LABEL[order.format] ?? order.format} />
        <Row label="Status" value={STATUS_LABEL[order.status] ?? order.status} />
        <Row
          label="Ordered"
          value={new Date(order.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
        <div className="total" style={{ marginTop: 8 }}>
          <span>Total paid</span>
          <span>{amount}</span>
        </div>
      </div>

      {order.physical ? (
        <div className="buy-card">
          <Timeline status={order.status} />

          {order.trackingCode || order.trackingUrl ? (
            <div
              style={{
                background: "#EAF3E6",
                borderRadius: 10,
                padding: "14px 16px",
                margin: "0 0 20px",
              }}
            >
              <div style={{ color: "#3f6b3a", fontWeight: 700, fontSize: ".9rem" }}>
                🚚 {order.carrier ? `${order.carrier} · ` : ""}Tracking{order.trackingCode ? `: ${order.trackingCode}` : ""}
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3f6b3a", fontWeight: 700, fontSize: ".88rem" }}
                >
                  Track your package →
                </a>
              )}
            </div>
          ) : null}

          <h3 style={{ marginTop: 0, color: "var(--plum)" }}>📦 Shipping to</h3>
          {addr ? (
            <address style={{ fontStyle: "normal", color: "var(--ink)", lineHeight: 1.6 }}>
              {order.shippingAddress?.name && <div style={{ fontWeight: 700 }}>{order.shippingAddress.name}</div>}
              {addr.line1 && <div>{addr.line1}</div>}
              {addr.line2 && <div>{addr.line2}</div>}
              <div>
                {[addr.city, addr.state].filter(Boolean).join(", ")} {addr.postal_code}
              </div>
              {addr.country && <div>{addr.country}</div>}
              {order.shippingAddress?.phone && (
                <div style={{ marginTop: 6, color: "var(--ink-soft)" }}>📞 {order.shippingAddress.phone}</div>
              )}
            </address>
          ) : (
            <p style={{ color: "var(--ink-soft)" }}>
              We don&apos;t have a shipping address on file yet — we&apos;ll reach out to confirm
              where to send your book.
            </p>
          )}
          {order.status === "paid" || order.status === "printing" ? (
            <p style={{ color: "var(--ink-soft)", fontSize: ".88rem", marginTop: 16, marginBottom: 0 }}>
              Your book will be printed and shipped to this address in 2–4 business days. We&apos;ll
              email you tracking as soon as it ships.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="buy-card">
          <h3 style={{ marginTop: 0, color: "var(--plum)" }}>💾 Digital delivery</h3>
          <p style={{ color: "var(--ink-soft)", margin: 0 }}>
            Your print-ready PDF is available to download from your book page — no shipping needed.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <Link href={`/book/${order.bookId}`} className="btn btn-primary">
          View your book →
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          My Books
        </Link>
      </div>
    </div>
  );
}

function Timeline({ status }: { status: string }) {
  const currentIndex = PHYSICAL_STEPS.findIndex((s) => s.key === status);
  // "paid" and anything before printing still counts as step 0 reached.
  const reached = currentIndex < 0 ? 0 : currentIndex;

  return (
    <div style={{ display: "flex", marginBottom: 24 }}>
      {PHYSICAL_STEPS.map((step, i) => {
        const done = i <= reached;
        return (
          <div key={step.key} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 9,
                  left: "-50%",
                  width: "100%",
                  height: 3,
                  background: i <= reached ? "var(--leaf)" : "rgba(43,33,64,.12)",
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                width: 20,
                height: 20,
                borderRadius: "50%",
                margin: "0 auto 8px",
                background: done ? "var(--leaf)" : "#fff",
                border: `3px solid ${done ? "var(--leaf)" : "rgba(43,33,64,.18)"}`,
              }}
            />
            <div
              style={{
                fontSize: ".78rem",
                fontWeight: done ? 700 : 600,
                color: done ? "var(--plum)" : "var(--ink-soft)",
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(43,33,64,.08)",
        color: "var(--ink)",
      }}
    >
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
