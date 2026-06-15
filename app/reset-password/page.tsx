"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const invalidLink = !token || !email;

  async function submit() {
    setErr("");
    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
      <div className="card">
        <h1 style={{ fontSize: "1.7rem", marginBottom: 6 }}>Choose a new password</h1>
        {invalidLink ? (
          <>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>
              This reset link is missing or invalid. Please request a new one.
            </p>
            <Link href="/forgot-password" className="go" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>
              Setting a new password for <b>{email}</b>.
            </p>
            <div className="field">
              <label>New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <button className="go" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Reset password →"}
            </button>
            <div className="err">{err}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
