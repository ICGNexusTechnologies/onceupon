"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Scene from "@/components/Scene";
import { useConfirm } from "@/components/useConfirm";

interface Page {
  pageNumber: number;
  text: string;
  setting: string;
  time: string;
  imageUrl?: string;
}

interface BookData {
  _id: string;
  title: string;
  dedication: string;
  child: { name: string; hairColor: string; skinTone: string; outfitColor: string };
  status: string;
  canGenerateArt: boolean;
  canGeneratePdf: boolean;
  canRegenerateArt: boolean;
  format?: string;
  coverUrl?: string;
  pdfUrl?: string;
  pages: Page[];
}

const FORMATS = [
  { key: "pdf", label: "Digital PDF", price: 19, note: "Print-ready download, instant" },
  { key: "softcover", label: "Softcover + PDF", price: 39, note: "Printed book · free US shipping, 2–4 business days" },
  { key: "hardcover", label: "Hardcover + PDF", price: 54, note: "Premium keepsake · free US shipping · best value" },
];

export default function BookReader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { confirm, confirmNode } = useConfirm();
  const [book, setBook] = useState<BookData | null>(null);
  const [err, setErr] = useState("");
  const [i, setI] = useState(0);
  const [format, setFormat] = useState("pdf");
  const [busy, setBusy] = useState(false);
  const [artBusy, setArtBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pageBusy, setPageBusy] = useState(false);
  const [gcOpen, setGcOpen] = useState(false);
  const [gcCode, setGcCode] = useState("");
  const [gcApplied, setGcApplied] = useState<{ amountCents: number } | null>(null);
  const [gcError, setGcError] = useState("");
  const [gcBusy, setGcBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/books/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setBook(d.book);
      })
      .catch((e) => setErr(e.message || "Book not found."));
  }, [id]);

  useEffect(load, [load]);

  // Poll while art is generating so pages fill in as they complete
  useEffect(() => {
    if (book?.status !== "paid" && book?.status !== "generating_art") return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [book?.status, load]);

  // Kick off the free cover preview once (idempotent server-side)
  useEffect(() => {
    if (!book || book.status !== "preview" || book.coverUrl) return;
    fetch("/api/generate-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: id }),
    })
      .then((r) => r.ok && load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.status, book?.coverUrl, id]);

  const hasPurchase = book ? book.status !== "preview" : false;
  // Always offer every format (pdf / softcover / hardcover), regardless of any prior purchase.
  const upgradeFormats = FORMATS;

  const go = useCallback(
    (n: number) => {
      if (!book) return;
      setI(Math.max(0, Math.min(book.pages.length - 1, n)));
    },
    [book]
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [i, go]);

  async function checkout() {
    setBusy(true);
    try {
      const endpoint = gcApplied ? "/api/gift-cards/apply" : "/api/checkout";
      const body = gcApplied
        ? { bookId: id, format, giftCardCode: gcCode }
        : { bookId: id, format };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.free) {
        window.location.href = `/checkout/success?book=${id}`;
      } else {
        window.location.href = data.url;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }

  async function applyGiftCard() {
    setGcError("");
    setGcBusy(true);
    try {
      const res = await fetch(`/api/gift-cards/validate?code=${encodeURIComponent(gcCode)}`);
      const data = await res.json();
      if (!data.valid) throw new Error(data.error ?? "Invalid gift card.");
      setGcApplied({ amountCents: data.amountCents });
    } catch (e) {
      setGcError(e instanceof Error ? e.message : "Invalid gift card.");
    } finally {
      setGcBusy(false);
    }
  }

  async function generateArt() {
    const confirmed = await confirm({
      title: "Generate illustrations",
      message: "Generate the hero reference and all 40 page illustrations now? This uses fal.ai credits.",
      confirmLabel: "Generate",
    });
    if (!confirmed) return;

    setArtBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start illustration generation.");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't start illustration generation.");
    } finally {
      setArtBusy(false);
    }
  }

  async function generatePdf() {
    setPdfBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't build the PDF.");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't build the PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function regeneratePage() {
    const page = book?.pages[i];
    if (!page) return;
    const confirmed = await confirm({
      title: "Regenerate page",
      message: `Regenerate page ${page.pageNumber}'s illustration? This uses one fal.ai image generation.`,
      confirmLabel: "Regenerate",
    });
    if (!confirmed) return;

    setPageBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/regenerate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id, pageNumber: page.pageNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't regenerate the illustration.");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't regenerate the illustration.");
    } finally {
      setPageBusy(false);
    }
  }

  if (err) {
    return (
      <div className="loading fade-in">
        <h2>Oh no!</h2>
        <p>{err}</p>
        <p style={{ marginTop: 18 }}>
          <Link href="/dashboard" className="btn btn-primary">My Books</Link>
        </p>
      </div>
    );
  }
  if (!book) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        <h2>Opening the book…</h2>
      </div>
    );
  }

  const sel = upgradeFormats.find((f) => f.key === format) ?? upgradeFormats[0] ?? FORMATS[0];
  const generating = book.status === "paid" || book.status === "generating_art";

  return (
    <div className="read-wrap fade-in">
      <div className="read-grid">
        <div>
          <div className="booktitle">{book.title}</div>
          <div className="book">
            {book.pages.map((p, n) => (
              <div key={p.pageNumber} className={`page ${n === i ? "on" : ""}`}>
                <div className="illus">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={`Page ${p.pageNumber} illustration`} />
                  ) : n === 0 && book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverUrl} alt="Cover" />
                  ) : hasPurchase || n === 0 ? (
                    <Scene setting={p.setting} time={p.time} hero={book.child} />
                  ) : (
                    <div className="locked">
                      <div className="lk-ic">🔒</div>
                      <div className="lk-t">
                        Illustration created
                        <br />
                        after checkout
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-side">
                  <div className="pnum">
                    PAGE {p.pageNumber}
                    {n === book.pages.length - 1 ? " · THE END" : ""}
                  </div>
                  <p>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="controls">
            <button className="nav-btn" disabled={i === 0} onClick={() => go(i - 1)}>
              ‹
            </button>
            <div className="dots">
              {book.pages.map((_, n) => (
                <i key={n} className={n === i ? "on" : ""} onClick={() => go(n)} />
              ))}
            </div>
            <button className="nav-btn" disabled={i === book.pages.length - 1} onClick={() => go(i + 1)}>
              ›
            </button>
          </div>
          {book.canRegenerateArt && book.pages[i]?.imageUrl && (
            <div className="page-tools">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={regeneratePage}
                disabled={pageBusy}
              >
                {pageBusy ? "Regenerating..." : `Regenerate page ${book.pages[i].pageNumber} illustration`}
              </button>
            </div>
          )}
          <p style={{ textAlign: "center", color: "var(--ink-soft)", marginTop: 12, fontSize: ".9rem" }}>
            {hasPurchase
              ? generating
                ? "Your illustrations are being painted — pages fill in as they finish."
                : ""
              : "Cover preview ready · the rest of the illustrations are created after checkout"}
          </p>
        </div>
        <div>
          {hasPurchase && (
            <>
              <div className="done-bar">
                {book.status === "complete"
                  ? book.format === "development"
                    ? "Full test book generated"
                    : "✓ Purchased — full book unlocked"
                  : book.status === "error"
                    ? "Illustration generation stopped with an error."
                    : "Creating your illustrations…"}
              </div>
              <div className="toolbar">
                {book.canGeneratePdf && (
                  <button className="btn btn-primary" onClick={generatePdf} disabled={pdfBusy}>
                    {pdfBusy ? "Building PDF..." : "Build PDF"}
                  </button>
                )}
                {book.canGenerateArt && (
                  <button className="btn btn-primary" onClick={generateArt} disabled={artBusy}>
                    {artBusy ? "Starting..." : "Retry illustrations"}
                  </button>
                )}
                {book.pdfUrl && (
                  <a href={`/api/books/${id}/pdf`} className="btn btn-ghost">
                    ⬇ Download PDF
                  </a>
                )}
                <Link href="/dashboard" className="btn btn-ghost">My Books</Link>
                <Link href="/create" className="btn btn-primary">Make another</Link>
              </div>
            </>
          )}
          {book && (
            <div className="buy-card" style={{ marginTop: hasPurchase ? 20 : 0 }}>
              <h3>{hasPurchase ? "Add a print copy" : book.title}</h3>
              <div className="by">
                {hasPurchase ? "Upgrade to a physical book" : `A personalized storybook · ${book.pages.length} pages`}
              </div>
              {upgradeFormats.map((f) => (
                <div key={f.key} className={`opt ${format === f.key ? "sel" : ""}`} onClick={() => { setFormat(f.key); setGcApplied(null); setGcCode(""); setGcOpen(false); }}>
                  <div className="top">
                    <strong>{f.label}</strong>
                    <span className="price">${f.price}</span>
                  </div>
                  <small>{f.note}</small>
                </div>
              ))}
              {/* Gift card */}
              {!gcApplied ? (
                <div style={{ marginBottom: 12 }}>
                  {gcOpen ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="ONCE-XXXX-XXXX"
                        value={gcCode}
                        onChange={(e) => { setGcCode(e.target.value.toUpperCase()); setGcError(""); }}
                        style={{
                          flex: 1, padding: "10px 12px", border: "2px solid rgba(43,33,64,.12)",
                          borderRadius: 12, fontSize: ".95rem",
                          color: "var(--ink)", background: "#fff", outline: "none",
                          fontFamily: "monospace", letterSpacing: ".05em",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && applyGiftCard()}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={applyGiftCard}
                        disabled={gcBusy || !gcCode}
                        style={{ padding: "10px 16px", fontSize: ".88rem" }}
                      >
                        {gcBusy ? "…" : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGcOpen(true)}
                      style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: ".88rem", fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      🎁 Have a gift card?
                    </button>
                  )}
                  {gcError && <p style={{ color: "#c4452f", fontSize: ".84rem", fontWeight: 700, margin: "6px 0 0" }}>{gcError}</p>}
                </div>
              ) : (
                <div style={{ background: "#EAF3E6", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#3f6b3a", fontWeight: 700, fontSize: ".88rem" }}>
                    🎁 Gift card: −${Math.round(gcApplied.amountCents / 100)}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setGcApplied(null); setGcCode(""); setGcOpen(false); }}
                    style={{ background: "none", border: "none", color: "#3f6b3a", cursor: "pointer", fontWeight: 700, fontSize: ".84rem" }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="total">
                <span>Total</span>
                <span>
                  {gcApplied
                    ? Math.max(0, sel.price - Math.round(gcApplied.amountCents / 100)) === 0
                      ? <span style={{ color: "var(--leaf)", fontWeight: 800 }}>Free! 🎉</span>
                      : `$${Math.max(0, sel.price - Math.round(gcApplied.amountCents / 100))}`
                    : `$${sel.price}`}
                </span>
              </div>
              <button className="btn btn-primary" onClick={checkout} disabled={busy}>
                {busy ? "One moment…" : "Checkout →"}
              </button>
              {!hasPurchase && book.canGenerateArt && (
                <button
                  className="btn btn-ghost dev-generate"
                  onClick={generateArt}
                  disabled={artBusy}
                >
                  {artBusy ? "Starting generation..." : "Generate full book for testing"}
                </button>
              )}
              <div className="guarantee">🔒 Secure checkout · happiness guarantee</div>
            </div>
          )}
        </div>
      </div>
      {confirmNode}
    </div>
  );
}
