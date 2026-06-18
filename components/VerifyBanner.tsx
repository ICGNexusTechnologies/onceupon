"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function VerifyBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pathname === "/verify-email" || pathname === "/auth") return;
    fetch("/api/auth/verify-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.signedIn && d.emailVerified === false) setShow(true);
      })
      .catch(() => {});
  }, [pathname]);

  async function resend() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const d = await res.json();
      setMsg(res.ok ? "Sent! Check your inbox." : d.error || "Couldn't send.");
    } catch {
      setMsg("Couldn't send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div
      style={{
        background: "#FFF1ED",
        borderBottom: "1px solid rgba(224,101,78,.35)",
        color: "#3A2A5C",
        padding: "10px 16px",
        textAlign: "center",
        fontSize: ".92rem",
        fontWeight: 700,
        display: "flex",
        gap: 12,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span>✉️ Please verify your email to place an order.</span>
      {msg ? (
        <span style={{ color: "#5A4E6E", fontWeight: 600 }}>{msg}</span>
      ) : (
        <button
          onClick={resend}
          disabled={busy}
          style={{
            background: "#E0654E",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "6px 16px",
            fontWeight: 800,
            fontSize: ".85rem",
            cursor: "pointer",
          }}
        >
          {busy ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  );
}
