"use client";

import { useState } from "react";
import Link from "next/link";
import type { ShowcaseBook } from "@/lib/showcase";

export default function Showcase({ books }: { books: ShowcaseBook[] }) {
  const [open, setOpen] = useState<ShowcaseBook | null>(null);

  if (!books.length) return null;

  return (
    <section className="band" id="showcase">
      <div className="wrap">
        <div className="section-head">
          <h2 className="display-l">Fresh off the press</h2>
          <p>Real books families have created with Once Uponly. Tap one for a peek.</p>
        </div>
        <div className="showcase-grid">
          {books.map((b) => (
            <button key={b.id} className="show-card" onClick={() => setOpen(b)}>
              <div className="show-cover" style={{ backgroundImage: `url(${b.coverUrl})` }} />
              <div className="show-title">{b.title}</div>
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(null)} aria-label="Close">
              ×
            </button>
            <div className="modal-cover" style={{ backgroundImage: `url(${open.coverUrl})` }} />
            <div className="modal-body">
              <h3>{open.title}</h3>
              <p>{open.synopsis}</p>
              <Link href="/create" className="btn btn-primary">
                Create your own →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
