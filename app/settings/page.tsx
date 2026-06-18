"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MfaSection from "./MfaSection";

interface OrderRow {
  bookId: string;
  orderNumber: string | null;
  title: string;
  coverUrl: string | null;
  format: string;
  amountCents: number;
  status: string;
  trackingUrl: string | null;
  createdAt: string;
}

const FORMAT_LABEL: Record<string, string> = {
  pdf: "Digital PDF",
  softcover: "Softcover + PDF",
  hardcover: "Hardcover + PDF",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Confirmed",
  printing: "Printing",
  shipped: "Shipped",
  fulfilled: "Delivered",
};

export default function SettingsPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  // profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  // password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  // orders
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          router.push("/auth?next=/settings");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.user) {
          setName(d.user.name || "");
          setEmail(d.user.email || "");
          setLoaded(true);
        }
      });
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []));
  }, [router]);

  async function saveProfile() {
    setProfileMsg("");
    setProfileErr("");
    setProfileBusy(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProfileMsg("Saved!");
      router.refresh();
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword() {
    setPwMsg("");
    setPwErr("");
    if (newPassword !== confirmPassword) {
      setPwErr("New passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPwMsg("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Couldn't change password.");
    } finally {
      setPwBusy(false);
    }
  }

  if (!loaded) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        <h2>Loading your account…</h2>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, padding: "56px 28px 80px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 28 }}>
        Account settings
      </h1>

      {/* Profile */}
      <div className="buy-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: "var(--plum)" }}>Profile</h3>
        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={profileBusy}>
          {profileBusy ? "Saving…" : "Save changes"}
        </button>
        {profileMsg && <span style={{ color: "var(--leaf)", fontWeight: 700, marginLeft: 12 }}>{profileMsg}</span>}
        {profileErr && <p style={{ color: "#c4452f", fontWeight: 700, marginTop: 10 }}>{profileErr}</p>}
      </div>

      {/* Password */}
      <div className="buy-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: "var(--plum)" }}>Change password</h3>
        <div className="field">
          <label>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="field">
          <label>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" onClick={savePassword} disabled={pwBusy}>
          {pwBusy ? "Updating…" : "Update password"}
        </button>
        {pwMsg && <span style={{ color: "var(--leaf)", fontWeight: 700, marginLeft: 12 }}>{pwMsg}</span>}
        {pwErr && <p style={{ color: "#c4452f", fontWeight: 700, marginTop: 10 }}>{pwErr}</p>}
      </div>

      {/* Two-factor authentication */}
      <MfaSection />

      {/* Orders */}
      <div className="buy-card">
        <h3 style={{ marginTop: 0, color: "var(--plum)" }}>Order history</h3>
        {orders === null ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading orders…</p>
        ) : orders.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            No orders yet. <Link href="/create" style={{ color: "var(--coral)", fontWeight: 700 }}>Create a book →</Link>
          </p>
        ) : (
          orders.map((o, i) => (
            <Link
              key={i}
              href={`/orders/${o.bookId}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(43,33,64,.08)",
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              {o.coverUrl && (
                <div
                  style={{
                    width: 38,
                    aspectRatio: "4/5",
                    borderRadius: 4,
                    backgroundImage: `url(${o.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--plum)" }}>{o.title}</div>
                <div style={{ fontSize: ".84rem", color: "var(--ink-soft)" }}>
                  {o.orderNumber ? `${o.orderNumber} · ` : ""}
                  {FORMAT_LABEL[o.format] ?? o.format} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>${(o.amountCents / 100).toFixed(2)}</div>
                <div style={{ fontSize: ".8rem", color: "var(--ink-soft)" }}>{STATUS_LABEL[o.status] ?? o.status}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
