"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const IDLE_MS = 60 * 60 * 1000; // log out after 60 min of inactivity
const WARN_MS = 55 * 60 * 1000; // warn 5 min before

/**
 * Idle-timeout guard for the admin dashboard only. Tracks activity; after 60
 * minutes idle it calls logout (clearing the session cookie server-side) and
 * sends the admin back to sign in. Warns at 55 min so they can stay signed in.
 */
export default function AdminIdleTimeout() {
  const router = useRouter();
  const lastRef = useRef(Date.now());
  const warnRef = useRef(false);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    let done = false;
    const logout = async () => {
      if (done) return;
      done = true;
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      router.push("/auth?next=/admin&timeout=1");
      router.refresh();
    };

    const bump = () => {
      lastRef.current = Date.now();
      if (warnRef.current) {
        warnRef.current = false;
        setWarn(false);
      }
    };
    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    // On returning to a backgrounded/suspended tab (mobile), check immediately.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRef.current >= IDLE_MS) logout();
    };
    document.addEventListener("visibilitychange", onVisible);

    const iv = window.setInterval(() => {
      const idle = Date.now() - lastRef.current;
      if (idle >= IDLE_MS) {
        window.clearInterval(iv);
        logout();
      } else if (idle >= WARN_MS && !warnRef.current) {
        warnRef.current = true;
        setWarn(true);
      }
    }, 15000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(iv);
    };
  }, [router]);

  if (!warn) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(43,33,64,.55)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "28px 26px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 24px 60px rgba(34,21,56,.4)",
          textAlign: "center",
        }}
      >
        <h3 style={{ margin: "0 0 8px", color: "#3A2A5C", fontSize: "1.25rem", fontWeight: 800 }}>Still there?</h3>
        <p style={{ margin: "0 0 22px", color: "#5A4E6E", lineHeight: 1.5 }}>
          You&rsquo;ll be signed out of the admin dashboard soon for inactivity.
        </p>
        <button
          onClick={() => {
            lastRef.current = Date.now();
            warnRef.current = false;
            setWarn(false);
          }}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "12px 24px",
            background: "#E0654E",
            color: "#fff",
            fontWeight: 800,
            fontSize: ".9rem",
            cursor: "pointer",
          }}
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
