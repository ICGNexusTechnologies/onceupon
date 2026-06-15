"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  body: string;
  verified: boolean;
  createdAt: string;
}

function Stars({ rating, size = "1.2rem" }: { rating: number; size?: string }) {
  return (
    <span style={{ color: "var(--marigold)", fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (n <= rating ? "★" : "☆")).join("")}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2, fontSize: "2rem", cursor: "pointer", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            color: n <= (hovered || value) ? "var(--marigold)" : "rgba(43,33,64,.15)",
            transition: "color .1s",
            userSelect: "none",
          }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function averageRating(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<{ name: string } | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reviews").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : { user: null })),
    ]).then(([rd, ud]) => {
      setReviews(rd.reviews ?? []);
      setUser(ud.user ?? null);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) { setError("Please choose a star rating."); return; }
    setSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setSubmitting(false); return; }
    setReviews((prev) => [data.review, ...prev]);
    setSubmitted(true);
    setSubmitting(false);
  }

  const avg = averageRating(reviews);
  const alreadyReviewed = reviews.some((r) => r.userName === user?.name && user);

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="band" style={{ background: "var(--paper-2)", padding: "70px 0 60px" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ marginBottom: 18, display: "inline-flex" }}>✦ Families love Once Upon</span>
          <h1 className="display-l" style={{ marginBottom: 16 }}>Real reviews from real parents</h1>
          {!loading && reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
              <Stars rating={Math.round(avg)} size="1.6rem" />
              <span style={{ fontFamily: "var(--display)", fontSize: "1.6rem", fontWeight: 700, color: "var(--plum)" }}>
                {avg.toFixed(1)}
              </span>
              <span style={{ color: "var(--ink-soft)", fontWeight: 700 }}>
                from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="wrap" style={{ maxWidth: 860, padding: "50px 28px 100px" }}>

        {/* Submit form */}
        {loading ? null : user === null ? (
          <div
            className="card"
            style={{ textAlign: "center", marginBottom: 48, padding: "36px 30px" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✍️</div>
            <h3 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Share your experience</h3>
            <p style={{ color: "var(--ink-soft)", marginBottom: 22 }}>
              Sign in to leave a review — it only takes a moment.
            </p>
            <Link href="/auth" className="btn btn-primary">Sign in to review →</Link>
          </div>
        ) : submitted || alreadyReviewed ? (
          <div
            className="done-bar"
            style={{ marginBottom: 48, fontSize: "1rem", padding: "18px 24px" }}
          >
            ✓ Thanks for your review! It helps other families discover Once Upon.
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: 4 }}>Leave a review</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", marginBottom: 24 }}>
              Signed in as <strong>{user.name}</strong>
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Your rating</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div className="field" style={{ marginTop: 18 }}>
                <label>Your review</label>
                <textarea
                  className="field textarea"
                  placeholder="What did you love about your Once Upon book?"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "2px solid rgba(43,33,64,.12)",
                    borderRadius: 14,
                    fontFamily: "var(--body)",
                    fontSize: "1.05rem",
                    color: "var(--ink)",
                    background: "#fff",
                    minHeight: 110,
                    resize: "vertical",
                    lineHeight: 1.5,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--coral)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(43,33,64,.12)")}
                />
                <div style={{ textAlign: "right", fontSize: ".8rem", color: "var(--ink-soft)", marginTop: 4 }}>
                  {body.length}/1000
                </div>
              </div>
              {error && <p className="err">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ marginTop: 6, width: "100%", justifyContent: "center" }}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="loading" style={{ padding: "60px 20px" }}>
            <div className="spinner" />
            <p>Loading reviews…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-card">
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📖</div>
            <p>No reviews yet — be the first to share your story!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {reviews.map((r) => (
              <div
                key={r._id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "26px 28px",
                  boxShadow: "0 8px 24px var(--shadow)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <Stars rating={r.rating} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontWeight: 800, color: "var(--plum)" }}>{r.userName}</span>
                      {r.verified && (
                        <span
                          style={{
                            background: "#EAF3E6",
                            color: "#3f6b3a",
                            fontSize: ".72rem",
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 999,
                            letterSpacing: ".04em",
                          }}
                        >
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "var(--ink-soft)", fontSize: ".85rem" }}>{formatDate(r.createdAt)}</span>
                </div>
                <p style={{ color: "var(--ink)", lineHeight: 1.65 }}>{r.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="logo" style={{ color: "#fff", marginBottom: 14 }}>
                <span className="star">✦</span>Once Upon
              </div>
              <p style={{ color: "#b3a8cc", fontSize: ".9rem", maxWidth: "30ch" }}>
                Personalized storybooks that make every child the hero of their own adventure.
              </p>
            </div>
            <div>
              <h4>Create</h4>
              <Link href="/create">Make a book</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#prices">Pricing</Link>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <a>Gift cards</a>
              <Link href="/reviews">Reviews</Link>
            </div>
            <div>
              <h4>Help</h4>
              <a>FAQ</a>
              <a>Shipping</a>
              <a>Contact</a>
            </div>
          </div>
          <div className="foot-bottom">© 2026 Once Upon. Made with love (and a little magic).</div>
        </div>
      </footer>
    </div>
  );
}
