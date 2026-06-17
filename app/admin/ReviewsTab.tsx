"use client";

import { useCallback, useEffect, useState } from "react";
import { fmtDate } from "./format";

type Review = {
  id: string;
  userName: string;
  rating: number;
  body: string;
  verified: boolean;
  hidden: boolean;
  featured: boolean;
  createdAt: string;
};

const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

export default function ReviewsTab({ toast }: { toast: (m: string) => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setReviews((await res.json()).reviews);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id: string, action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(d.message);
      await load();
    } catch (e) {
      toast("⚠️ " + (e instanceof Error ? e.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page">Reviews</h1>
      <p className="lede">Moderate customer reviews — hide, feature, or remove. Featured reviews show first on the site.</p>

      {!loading && reviews.length === 0 && <div className="empty">{err || "No reviews yet."}</div>}
      {loading && <div className="empty">Loading reviews…</div>}

      {reviews.map((r) => (
        <div className="panel" key={r.id} style={{ opacity: r.hidden ? 0.55 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <span className="strong">{r.userName}</span>{" "}
              <span style={{ color: "var(--gold)", letterSpacing: 1 }}>{stars(r.rating)}</span>{" "}
              {r.verified && <span className="badge active">verified</span>}{" "}
              {r.featured && <span className="badge printing">featured</span>}{" "}
              {r.hidden && <span className="badge refunded">hidden</span>}
              <div className="dim">{fmtDate(r.createdAt)}</div>
            </div>
            <div className="row-actions">
              {r.hidden ? (
                <button className="btn sm btn-ghost" disabled={busy} onClick={() => moderate(r.id, "show")}>
                  Show
                </button>
              ) : (
                <button className="btn sm btn-ghost" disabled={busy} onClick={() => moderate(r.id, "hide")}>
                  Hide
                </button>
              )}
              {r.featured ? (
                <button className="btn sm btn-ghost" disabled={busy} onClick={() => moderate(r.id, "unfeature")}>
                  Unfeature
                </button>
              ) : (
                <button className="btn sm btn-gold" disabled={busy} onClick={() => moderate(r.id, "feature")}>
                  Feature
                </button>
              )}
              <button
                className="btn sm btn-danger"
                disabled={busy}
                onClick={() => moderate(r.id, "delete", `Delete ${r.userName}'s review permanently?`)}
              >
                Delete
              </button>
            </div>
          </div>
          <p style={{ marginTop: 10, color: "var(--soft)" }}>{r.body}</p>
        </div>
      ))}
    </div>
  );
}
