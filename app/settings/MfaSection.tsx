"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function MfaSection() {
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<"idle" | "setup" | "backup">("idle");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequired(new URLSearchParams(window.location.search).get("mfa") === "required");
    }
    fetch("/api/auth/mfa/status")
      .then((r) => (r.ok ? r.json() : { mfaEnabled: false }))
      .then((d) => {
        setEnabled(!!d.mfaEnabled);
        setLoaded(true);
      });
  }, []);

  async function startSetup() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setQr(d.qrDataUrl);
      setSecret(d.secret);
      setStep("setup");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't start setup.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setBackupCodes(d.backupCodes);
      setEnabled(true);
      setStep("backup");
      setCode("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't enable.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEnabled(false);
      setDisableCode("");
      setStep("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't disable.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div
      className="buy-card"
      style={{ marginBottom: 24, ...(required && !enabled ? { border: "2px solid var(--coral)" } : {}) }}
    >
      {required && !enabled && (
        <p style={{ color: "#c4452f", fontWeight: 800, marginTop: 0, marginBottom: 12 }}>
          🔒 Admin accounts must enable two-factor authentication before opening the dashboard. Set it up below.
        </p>
      )}
      <h3 style={{ marginTop: 0, color: "var(--plum)" }}>
        Two-factor authentication{" "}
        {enabled && step !== "backup" && (
          <span style={{ color: "var(--leaf)", fontSize: ".85rem", fontWeight: 800 }}>● On</span>
        )}
      </h3>

      {/* Newly-generated backup codes (show once) */}
      {step === "backup" && (
        <div>
          <p style={{ color: "var(--ink-soft)", marginBottom: 12 }}>
            ✅ Two-factor is on. <strong>Save these backup codes now</strong> — each works once if you lose your
            authenticator. They won&rsquo;t be shown again.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              background: "#fff",
              border: "2px dashed var(--coral)",
              borderRadius: 12,
              padding: 16,
              fontFamily: "ui-monospace, Menlo, monospace",
              fontWeight: 700,
              color: "var(--plum)",
              marginBottom: 14,
            }}
          >
            {backupCodes.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              navigator.clipboard?.writeText(backupCodes.join("\n"));
            }}
            style={{ marginRight: 10 }}
          >
            Copy codes
          </button>
          <button className="btn" onClick={() => setStep("idle")}>
            Done
          </button>
        </div>
      )}

      {/* Idle, not enabled */}
      {step === "idle" && !enabled && (
        <div>
          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
            Add a second step at login using an authenticator app (Google Authenticator, Authy, 1Password). Strongly
            recommended for accounts that manage orders or refunds.
          </p>
          <button className="btn btn-primary" onClick={startSetup} disabled={busy}>
            {busy ? "Starting…" : "Enable two-factor"}
          </button>
        </div>
      )}

      {/* Setup: scan QR + verify */}
      {step === "setup" && (
        <div>
          <p style={{ color: "var(--ink-soft)", marginBottom: 12 }}>
            1. Scan this QR code with your authenticator app, then 2. enter the 6-digit code it shows.
          </p>
          {qr && (
            <Image src={qr} alt="Scan with your authenticator app" width={180} height={180} style={{ borderRadius: 10, marginBottom: 12 }} unoptimized />
          )}
          <p style={{ fontSize: ".82rem", color: "var(--ink-soft)", marginBottom: 12 }}>
            Can&rsquo;t scan? Enter this key manually:{" "}
            <code style={{ fontWeight: 700, color: "var(--plum)", wordBreak: "break-all" }}>{secret}</code>
          </p>
          <div className="field">
            <label>6-digit code</label>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
            />
          </div>
          <button className="btn btn-primary" onClick={confirmEnable} disabled={busy || code.length < 6}>
            {busy ? "Verifying…" : "Verify & enable"}
          </button>
          <button className="btn" onClick={() => setStep("idle")} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        </div>
      )}

      {/* Enabled: offer disable */}
      {step === "idle" && enabled && (
        <div>
          <p style={{ color: "var(--ink-soft)", marginBottom: 12 }}>
            Your account is protected with two-factor authentication. To turn it off, enter a current code from your
            authenticator (or a backup code).
          </p>
          <div className="field">
            <label>Current code</label>
            <input inputMode="numeric" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="123456" />
          </div>
          <button
            className="btn"
            onClick={disable}
            disabled={busy || !disableCode}
            style={{ background: "#fff", color: "#c4452f", border: "1px solid rgba(196,69,47,.4)" }}
          >
            {busy ? "Disabling…" : "Disable two-factor"}
          </button>
        </div>
      )}

      {err && <p style={{ color: "#c4452f", fontWeight: 700, marginTop: 10 }}>{err}</p>}
    </div>
  );
}
