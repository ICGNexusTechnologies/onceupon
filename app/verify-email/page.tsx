"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyInner() {
  const params = useSearchParams();
  const [state, setState] = useState<"verifying" | "ok" | "error">("verifying");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email");
    if (!token || !email) {
      setState("error");
      setMsg("This verification link is incomplete.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) setState("ok");
        else {
          setState("error");
          setMsg(d.error || "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMsg("Something went wrong. Please try again.");
      });
  }, [params]);

  return (
    <div className="center-wrap fade-in" style={{ maxWidth: 460 }}>
      <div className="card" style={{ textAlign: "center" }}>
        {state === "verifying" && (
          <>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <h1 style={{ fontSize: "1.5rem" }}>Verifying your email…</h1>
          </>
        )}
        {state === "ok" && (
          <>
            <h1 style={{ fontSize: "1.7rem", marginBottom: 8 }}>Email verified ✅</h1>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>
              You&rsquo;re all set — you can now place orders.
            </p>
            <Link href="/dashboard" className="go" style={{ display: "inline-block", textDecoration: "none" }}>
              Go to your books →
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <h1 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Couldn&rsquo;t verify</h1>
            <p className="wiz-sub" style={{ marginBottom: 24 }}>{msg}</p>
            <Link href="/settings" className="go" style={{ display: "inline-block", textDecoration: "none" }}>
              Go to settings to resend →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
