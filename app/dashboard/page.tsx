"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4, fontSize: "1.8rem", cursor: "pointer", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ color: n <= (hovered || value) ? "var(--marigold)" : "rgba(43,33,64,.15)", transition: "color .1s", userSelect: "none" }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >★</span>
      ))}
    </div>
  );
}

const COVERS = [
  "linear-gradient(150deg,#E0654E,#c4452f)",
  "linear-gradient(150deg,#7FB3C4,#4f8294)",
  "linear-gradient(150deg,#E8A33D,#C9962F)",
  "linear-gradient(150deg,#6E9A6B,#4f7a4c)",
  "linear-gradient(150deg,#3A2A5C,#221538)",
];

interface BookCard {
  _id: string;
  title: string;
  status: string;
  coverUrl?: string;
  pageCount: number;
  createdAt: string;
}

export default function Dashboard() {
  const [books, setBooks] = useState<BookCard[] | null>(null);
  const [name, setName] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setName(d.user?.name || ""));
    fetch("/api/books")
      .then((r) => (r.ok ? r.json() : { books: [] }))
      .then((d) => setBooks(d.books || []));
    fetch("/api/reviews/mine")
      .then((r) => r.json())
      .then((d) => setHasReviewed(!!d.review));
  }, []);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    if (!reviewRating) { setReviewError("Please pick a star rating."); return; }
    setReviewSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, body: reviewBody }),
    });
    const data = await res.json();
    if (!res.ok) { setReviewError(data.error ?? "Something went wrong."); setReviewSubmitting(false); return; }
    setReviewDone(true);
    setReviewSubmitting(false);
  }

  async function deleteBook(book: BookCard) {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    setDeletingId(book._id);
    setError("");
    try {
      const res = await fetch(`/api/books/${book._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't delete the book.");
      setBooks((current) => current?.filter((item) => item._id !== book._id) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the book.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="dash fade-in">
      <div className="dash-hero">
        <div>
          <h2>Welcome back{name ? `, ${name}` : ""}!</h2>
          <p>Your books live here. Create a new adventure or revisit an old favorite.</p>
        </div>
        <Link href="/create" className="btn btn-primary btn-lg">
          ✦ Create a new book
        </Link>
      </div>
      <div className="dash-section-h">
        <h3>My Books</h3>
        <span style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>
          {books && books.length ? `${books.length} book${books.length > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      {error && <div className="err dash-error">{error}</div>}
      <div className="lib-grid">
        {books === null ? null : books.length === 0 ? (
          <div className="empty-card">
            No books yet. Click <b>Create a new book</b> to make your first one! ✦
          </div>
        ) : (
          books.map((b, n) => (
            <article key={b._id} className="lib-card">
              <Link href={`/book/${b._id}`} className="lib-card-link">
                <div
                  className="cov"
                  style={
                    b.coverUrl
                      ? { backgroundImage: `url(${b.coverUrl})` }
                      : { background: COVERS[n % COVERS.length] }
                  }
                >
                  <span>{b.title}</span>
                </div>
                <h4>{b.title}</h4>
                <div className="meta">
                  {b.pageCount} pages · {b.status === "preview" ? "Preview" : b.status === "complete" ? "Purchased" : b.status}
                </div>
              </Link>
              {b.status === "preview" && (
                <button
                  className="delete-book"
                  type="button"
                  disabled={deletingId === b._id}
                  onClick={() => deleteBook(b)}
                >
                  {deletingId === b._id ? "Deleting..." : "Delete"}
                </button>
              )}
            </article>
          ))
        )}
      </div>

      {/* Review prompt — shown only when user has a paid book and hasn't reviewed */}
      {books && books.some((b) => ["paid", "generating_art", "complete"].includes(b.status)) && hasReviewed === false && (
        <div style={{ marginTop: 48 }}>
          {reviewDone ? (
            <div className="done-bar">
              ✓ Thank you for your review! It helps other families discover Once Upon.
            </div>
          ) : (
            <div className="card" style={{ maxWidth: 560 }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: 6 }}>Loving your book?</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: ".92rem", marginBottom: 22 }}>
                Share your experience — it means the world to other families.
              </p>
              <form onSubmit={submitReview}>
                <div className="field">
                  <label>Your rating</label>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div className="field" style={{ marginTop: 16 }}>
                  <label>Your review</label>
                  <textarea
                    placeholder="What did your child think? What made it special?"
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    maxLength={1000}
                    style={{
                      width: "100%", padding: "12px 14px", border: "2px solid rgba(43,33,64,.12)",
                      borderRadius: 12, fontFamily: "var(--body)", fontSize: "1rem",
                      color: "var(--ink)", background: "#fff", minHeight: 90,
                      resize: "vertical", lineHeight: 1.5, outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--coral)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(43,33,64,.12)")}
                  />
                </div>
                {reviewError && <p className="err">{reviewError}</p>}
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                  <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                    {reviewSubmitting ? "Submitting…" : "Submit review"}
                  </button>
                  <Link href="/reviews" style={{ color: "var(--ink-soft)", fontSize: ".88rem", fontWeight: 700 }}>
                    See all reviews →
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
