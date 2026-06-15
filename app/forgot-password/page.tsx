"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (!email) {
      setErr("Please enter your email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
      <div className="card">
        <h1 style={{ fontSize: "1.7rem", marginBottom: 6 }}>Forgot your password?</h1>
        {sent ? (
          <>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>
              If an account exists for <b>{email}</b>, we&apos;ve sent a reset link. Check your inbox
              (and spam folder) — the link expires in 1 hour.
            </p>
            <Link href="/auth" className="go" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <button className="go" onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send reset link →"}
            </button>
            <div className="err">{err}</div>
            <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: ".86rem", marginTop: 16 }}>
              Remembered it?{" "}
              <Link href="/auth" style={{ color: "var(--coral)", fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
