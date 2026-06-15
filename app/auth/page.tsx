"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

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
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
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
