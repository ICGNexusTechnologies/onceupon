"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "ou-cookie-consent";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show only if the visitor hasn't chosen yet.
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // localStorage blocked — don't show.
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: "#fff",
        borderTop: "1px solid rgba(43,33,64,.12)",
        boxShadow: "0 -8px 30px var(--shadow)",
        padding: "16px 0",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
      <p style={{ flex: "1 1 280px", margin: 0, color: "var(--ink-soft)", fontSize: ".92rem", lineHeight: 1.5 }}>
        🍪 We use cookies to keep you signed in and to improve your experience. See our{" "}
        <Link href="/privacy" style={{ color: "var(--coral)", fontWeight: 700 }}>
          Privacy Policy
        </Link>
        .
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="btn btn-ghost"
          style={{ padding: "10px 18px", fontSize: ".9rem" }}
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="btn btn-primary"
          style={{ padding: "10px 18px", fontSize: ".9rem" }}
        >
          Accept
        </button>
      </div>
      </div>
    </div>
  );
}
