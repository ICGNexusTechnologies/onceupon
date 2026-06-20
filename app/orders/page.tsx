"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderRow {
  bookId: string;
  orderNumber: string | null;
  title: string;
  coverUrl: string | null;
  format: string;
  amountCents: number;
  status: string;
  trackingUrl: string | null;
  createdAt: string;
}

const FORMAT_LABEL: Record<string, string> = {
  pdf: "Digital PDF",
  softcover: "Softcover + PDF",
  hardcover: "Hardcover + PDF",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Confirmed",
  printing: "Printing",
  shipped: "Shipped",
  fulfilled: "Delivered",
  refunded: "Refunded",
  canceled: "Canceled",
};

const STATUS_COLOR: Record<string, string> = {
  paid: "#4A78C4",
  printing: "#b9791a",
  shipped: "#2c7d7d",
  fulfilled: "#3c7d53",
  refunded: "#b04a4a",
  canceled: "#8a8398",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (r.status === 401) {
          router.push("/auth?next=/orders");
          return null;
        }
        return r.json();
      })
      .then((d) => d && setOrders(d.orders || []));
  }, [router]);

  return (
    <div className="wrap" style={{ maxWidth: 720, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 8 }}>
        Your orders
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 28 }}>
        Track the status of every book you&rsquo;ve ordered.
      </p>

      {orders === null ? (
        <p style={{ color: "var(--ink-soft)" }}>Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="buy-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--ink-soft)", marginBottom: 16 }}>You haven&rsquo;t placed any orders yet.</p>
          <Link href="/create" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Create a book →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((o, i) => (
            <Link
              key={i}
              href={`/orders/${o.bookId}`}
              className="buy-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                textDecoration: "none",
                color: "var(--ink)",
                padding: 20,
              }}
            >
              {o.coverUrl && (
                <div
                  style={{
                    width: 56,
                    aspectRatio: "4/5",
                    borderRadius: 6,
                    backgroundImage: `url(${o.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "var(--plum)", fontSize: "1.05rem" }}>{o.title}</div>
                <div style={{ fontSize: ".86rem", color: "var(--ink-soft)", marginTop: 2 }}>
                  {o.orderNumber ? `${o.orderNumber} · ` : ""}
                  {FORMAT_LABEL[o.format] ?? o.format} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
                {o.trackingUrl && (
                  <div style={{ fontSize: ".84rem", marginTop: 6 }}>
                    <span style={{ color: "var(--coral)", fontWeight: 700 }}>Track package →</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 13px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: ".8rem",
                    background: "#fff",
                    color: STATUS_COLOR[o.status] ?? "#5A4E6E",
                    border: `1.5px solid ${STATUS_COLOR[o.status] ?? "#5A4E6E"}33`,
                  }}
                >
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                <div style={{ fontSize: ".84rem", color: "var(--ink-soft)", marginTop: 6 }}>View details</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
