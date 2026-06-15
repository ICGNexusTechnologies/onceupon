"use client";

import { useState } from "react";
import Link from "next/link";

const TIERS = [
  { key: "pdf", label: "Digital PDF", price: 19, note: "Instant download, great for last-minute gifts", emoji: "📄" },
  { key: "softcover", label: "Softcover Book", price: 34, note: "Printed book + free PDF", emoji: "📗" },
  { key: "hardcover", label: "Hardcover Book", price: 49, note: "Premium keepsake + free PDF", emoji: "📚", popular: true },
];

export default function GiftCardsPage() {
  const [tier, setTier] = useState("hardcover");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, recipientEmail, recipientName, purchaserEmail, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setBusy(false);
    }
  }

  const selected = TIERS.find((t) => t.key === tier)!;

  return (
    <div className="fade-in">
      <section className="band" style={{ background: "var(--paper-2)", padding: "70px 0 60px" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ marginBottom: 18, display: "inline-flex" }}>🎁 Give the gift of story</span>
          <h1 className="display-l" style={{ marginBottom: 14 }}>Once Upon Gift Cards</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "1.1rem", maxWidth: "40ch", margin: "0 auto" }}>
            Give someone a personalized storybook for the little one they love most.
          </p>
        </div>
      </section>

      <div className="wrap" style={{ maxWidth: 760, padding: "50px 28px 100px" }}>
        <form onSubmit={handleSubmit}>

          {/* Tier picker */}
          <h2 style={{ fontSize: "1.3rem", marginBottom: 18, color: "var(--plum)" }}>Choose an amount</h2>
          <div className="gift-tier-grid">
            {TIERS.map((t) => (
              <div
                key={t.key}
                onClick={() => setTier(t.key)}
                style={{
                  border: `2px solid ${tier === t.key ? "var(--coral)" : "rgba(43,33,64,.12)"}`,
                  background: tier === t.key ? "#FFF1ED" : "#fff",
                  borderRadius: 18,
                  padding: "22px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  position: "relative",
                  transition: ".15s",
                }}
              >
                {t.popular && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "var(--coral)", color: "#fff", fontSize: ".7rem", fontWeight: 800,
                    padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: ".04em",
                  }}>MOST LOVED</div>
                )}
                <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{t.emoji}</div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--plum)", fontSize: "1.05rem" }}>{t.label}</div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--coral)", fontSize: "1.8rem", margin: "4px 0" }}>${t.price}</div>
                <div style={{ color: "var(--ink-soft)", fontSize: ".82rem", lineHeight: 1.35 }}>{t.note}</div>
              </div>
            ))}
          </div>

          {/* Recipient */}
          <h2 style={{ fontSize: "1.3rem", marginBottom: 18, color: "var(--plum)" }}>Who is it for?</h2>
          <div className="card" style={{ marginBottom: 28 }}>
            <div className="row">
              <div className="field">
                <label>Recipient&apos;s name</label>
                <input
                  type="text"
                  placeholder="Sarah"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Recipient&apos;s email</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Personal message <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                placeholder="For the little one in your life — hope this brings lots of bedtime magic! 🌙"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Your email <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>(optional — for your confirmation)</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={purchaserEmail}
                onChange={(e) => setPurchaserEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Summary + submit */}
          <div className="gift-summary">
            <div>
              <div style={{ color: "#d8cdf0", fontSize: ".88rem", marginBottom: 2 }}>You&apos;re buying</div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "1.2rem" }}>
                {selected.emoji} ${selected.price} {selected.label} Gift Card
              </div>
            </div>
            {error && <p style={{ color: "#ffb3a3", fontWeight: 700, margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy} style={{ background: "var(--marigold)", color: "var(--plum)", flexShrink: 0 }}>
              {busy ? "One moment…" : `Buy $${selected.price} gift card →`}
            </button>
          </div>
        </form>
      </div>

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
              <Link href="/gift-cards">Gift cards</Link>
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
