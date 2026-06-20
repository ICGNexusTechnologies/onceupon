"use client";

import { useCallback, useEffect, useState } from "react";

type Admin = {
  id?: string;
  email: string;
  name: string;
  role: "super" | "admin";
  mfaEnabled: boolean;
  hasAccount: boolean;
};

export default function TeamTab({ toast }: { toast: (m: string) => void }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admins");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setAdmins((await res.json()).admins);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(action: "grant" | "revoke", targetEmail: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: targetEmail }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(d.message);
      if (action === "grant") setEmail("");
      await load();
    } catch (e) {
      toast("⚠️ " + (e instanceof Error ? e.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page">Team</h1>
      <p className="lede">Grant trusted teammates admin access. You&rsquo;re the owner — only you can manage this.</p>

      <div className="two-col">
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="nosort">Admin</th>
                  <th className="nosort">Role</th>
                  <th className="nosort">2FA</th>
                  <th className="nosort"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.email}>
                    <td>
                      <div className="strong">{a.name || a.email}</div>
                      <div className="dim">{a.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${a.role === "super" ? "fulfilled" : "paid"}`}>
                        {a.role === "super" ? "Owner" : "Admin"}
                      </span>
                    </td>
                    <td>
                      {a.mfaEnabled ? (
                        <span className="pos">● On</span>
                      ) : (
                        <span style={{ color: "var(--coral)", fontWeight: 800 }}>● Off</span>
                      )}
                    </td>
                    <td>
                      {a.role === "admin" ? (
                        <button className="btn sm btn-danger" disabled={busy} onClick={() => act("revoke", a.email)}>
                          Revoke
                        </button>
                      ) : (
                        <span className="dim">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="empty">Loading…</div>}
          {!loading && admins.length === 0 && <div className="empty">{err || "No admins."}</div>}
        </div>

        <div className="panel">
          <h3>Grant admin access</h3>
          <p className="dim" style={{ marginBottom: 12 }}>
            Enter the email of someone who already has a Once Uponly account. They&rsquo;ll get full dashboard access and
            must enable two-factor before it opens.
          </p>
          <div className="field">
            <label>Account email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" />
          </div>
          <button className="btn btn-primary full" disabled={busy || !email} onClick={() => act("grant", email)}>
            + Grant admin
          </button>
        </div>
      </div>
    </div>
  );
}
