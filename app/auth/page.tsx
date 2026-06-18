"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState("");

  async function submit() {
    setErr("");
    if (!email || !pass) {
      setErr("Please enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Something went wrong. Please try again.");
        return;
      }
      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        return;
      }
      if (mode === "signup") {
        setSignedUpEmail(email);
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerify() {
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const d = await res.json();
      setResendMsg(res.ok ? "Sent! Check your inbox." : d.error || "Couldn't send.");
    } catch {
      setResendMsg("Couldn't send. Try again.");
    }
  }

  if (signedUpEmail) {
    return (
      <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.7rem", marginBottom: 8 }}>Verify your email ✉️</h1>
          <p className="wiz-sub" style={{ marginBottom: 20 }}>
            We sent a verification link to <b>{signedUpEmail}</b>. Click it to confirm your email — you&rsquo;ll need
            it before you can place an order.
          </p>
          <Link
            href="/dashboard"
            className="go"
            style={{ display: "inline-block", textDecoration: "none", marginBottom: 16 }}
          >
            Continue to my books →
          </Link>
          <p style={{ color: "var(--ink-soft)", fontSize: ".86rem" }}>
            Didn&rsquo;t get it?{" "}
            <b style={{ color: "var(--coral)", cursor: "pointer" }} onClick={resendVerify}>
              Resend email
            </b>
            {resendMsg && <span style={{ display: "block", marginTop: 8, fontWeight: 600 }}>{resendMsg}</span>}
          </p>
        </div>
      </div>
    );
  }

  async function verifyMfa() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Invalid code.");
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (mfaToken) {
    return (
      <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
        <div className="card">
          <h1 style={{ fontSize: "1.7rem", marginBottom: 6 }}>Two-factor verification</h1>
          <p className="wiz-sub" style={{ marginBottom: 24 }}>
            Enter the 6-digit code from your authenticator app (or a backup code).
          </p>
          <div className="field">
            <label>Authentication code</label>
            <input
              inputMode="numeric"
              autoFocus
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              onKeyDown={(e) => e.key === "Enter" && verifyMfa()}
            />
          </div>
          <button className="go" onClick={verifyMfa} disabled={busy || !mfaCode}>
            {busy ? "Verifying…" : "Verify →"}
          </button>
          <div className="err">{err}</div>
          <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: ".86rem", marginTop: 16 }}>
            <b
              style={{ color: "var(--coral)", cursor: "pointer" }}
              onClick={() => {
                setMfaToken(null);
                setMfaCode("");
                setErr("");
              }}
            >
              ← Back to sign in
            </b>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
      <div className="card">
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "signin" ? "on" : ""}`} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button className={`auth-tab ${mode === "signup" ? "on" : ""}`} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>
        <h1 style={{ fontSize: "1.7rem", marginBottom: 6 }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="wiz-sub" style={{ marginBottom: 24 }}>
          {mode === "signup" ? "Save your books and track your orders." : "Sign in to your books and orders."}
        </p>
        {mode === "signup" && (
          <div className="field">
            <label>Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <button className="go" onClick={submit} disabled={busy}>
          {busy ? "One moment…" : mode === "signup" ? "Create account →" : "Sign in →"}
        </button>
        <div className="err">{err}</div>
        {mode === "signin" && (
          <p style={{ textAlign: "center", marginTop: 12 }}>
            <Link href="/forgot-password" style={{ color: "var(--ink-soft)", fontSize: ".86rem", fontWeight: 700 }}>
              Forgot your password?
            </Link>
          </p>
        )}
        <p style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: ".86rem", marginTop: 16 }}>
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <b style={{ color: "var(--coral)", cursor: "pointer" }} onClick={() => setMode("signin")}>
                Sign in
              </b>
            </>
          ) : (
            <>
              New here?{" "}
              <b style={{ color: "var(--coral)", cursor: "pointer" }} onClick={() => setMode("signup")}>
                Create an account
              </b>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
