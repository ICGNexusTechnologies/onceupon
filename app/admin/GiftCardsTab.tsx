"use client";

import { useCallback, useEffect, useState } from "react";
import { money, fmtDate } from "./format";

type GiftCard = {
  id: string;
  code: string;
  amountCents: number;
  status: string;
  purchaserEmail: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
  redeemedAt: string | null;
  createdAt: string;
};

export default function GiftCardsTab({ toast }: { toast: (m: string) => void }) {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // issue form
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("54");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gift-cards");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setCards((await res.json()).giftCards);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function issue() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName,
          recipientEmail,
          amountCents: Math.round(parseFloat(amount || "0") * 100),
          message,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(d.warning || d.message);
      setRecipientName("");
      setRecipientEmail("");
      setMessage("");
      await load();
    } catch (e) {
      toast("⚠️ " + (e instanceof Error ? e.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  async function resend(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast(d.message);
    } catch (e) {
      toast("⚠️ " + (e instanceof Error ? e.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page">Gift cards</h1>
      <p className="lede">Issued and redeemed cards — and comp one for a customer.</p>

      <div className="two-col">
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="nosort">Code</th>
                  <th className="nosort">Amount</th>
                  <th className="nosort">Status</th>
                  <th className="nosort">Recipient</th>
                  <th className="nosort">Created</th>
                  <th className="nosort"></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td className="mono strong">{c.code}</td>
                    <td className="strong">{money(c.amountCents)}</td>
                    <td>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                    <td>
                      <div className="strong">{c.recipientName}</div>
                      <div className="dim">{c.recipientEmail}</div>
                    </td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td>
                      <button className="btn sm btn-ghost" disabled={busy} onClick={() => resend(c.id)}>
                        Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && cards.length === 0 && <div className="empty">{err || "No gift cards yet."}</div>}
          {loading && <div className="empty">Loading…</div>}
        </div>

        <div className="panel">
          <h3>Issue a gift card</h3>
          <div className="field">
            <label>Recipient name</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="field">
            <label>Recipient email</label>
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="field">
            <label>Amount</label>
            <select value={amount} onChange={(e) => setAmount(e.target.value)}>
              <option value="19">Digital PDF — $19</option>
              <option value="39">Softcover Book — $39</option>
              <option value="54">Hardcover Book — $54</option>
            </select>
          </div>
          <div className="field">
            <label>Message (optional)</label>
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="A little something from us…" />
          </div>
          <button className="btn btn-primary full" disabled={busy || !recipientName || !recipientEmail} onClick={issue}>
            🎁 Issue &amp; email card
          </button>
          <p className="dim" style={{ marginTop: 8 }}>
            Issued cards are active immediately and emailed to the recipient — no charge.
          </p>
        </div>
      </div>
    </div>
  );
}
