"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface GiftCardInfo {
  code: string;
  amountCents: number;
  recipientName: string;
  recipientEmail: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [gift, setGift] = useState<GiftCardInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setError("No session found."); return; }
    fetch(`/api/gift-cards/by-session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setGift(d.gift);
      })
      .catch(() => setError("Couldn't load gift card details."));
  }, [sessionId]);

  if (error) {
    return (
      <div className="loading" style={{ padding: "80px 20px" }}>
        <h2>Something went wrong</h2>
        <p style={{ marginBottom: 24 }}>{error}</p>
        <Link href="/gift-cards" className="btn btn-primary">Back to gift cards</Link>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="loading" style={{ padding: "80px 20px" }}>
        <div className="spinner" />
        <p>Loading your gift card…</p>
      </div>
    );
  }

  const amount = `$${Math.round(gift.amountCents / 100)}`;

  return (
    <div className="center-wrap fade-in" style={{ maxWidth: 600, textAlign: "center" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 20 }}>🎁</div>
      <h1 className="display-l" style={{ marginBottom: 12 }}>Gift card sent!</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", marginBottom: 36 }}>
        Your {amount} gift card is on its way to <strong>{gift.recipientEmail}</strong>.
      </p>

      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 32px",
        boxShadow: "0 16px 40px var(--shadow)", marginBottom: 32,
        border: "2px dashed var(--marigold)",
      }}>
        <p style={{ color: "var(--ink-soft)", fontSize: ".88rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>
          Gift card for {gift.recipientName}
        </p>
        <div style={{
          fontFamily: "monospace", fontWeight: 900, fontSize: "2rem",
          letterSpacing: ".12em", color: "var(--coral)", margin: "0 0 8px",
        }}>
          {gift.code}
        </div>
        <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", margin: 0 }}>Value: {amount}</p>
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", marginBottom: 28 }}>
        They can use this code at checkout when ordering any Once Uponly book.
        Save it in case the email goes to spam!
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/create" className="btn btn-primary">Make a book yourself →</Link>
        <Link href="/gift-cards" className="btn btn-ghost">Buy another gift card</Link>
      </div>
    </div>
  );
}

export default function GiftCardSuccessPage() {
  return (
    <Suspense fallback={
      <div className="loading" style={{ padding: "80px 20px" }}>
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
