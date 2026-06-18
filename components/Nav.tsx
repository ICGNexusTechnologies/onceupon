"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Me {
  name: string;
}

export default function Nav() {
  const [user, setUser] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="topnav">
      <div className="wrap nav-inner">
        <Link href="/" className="logo" onClick={closeMenu}>
          <span className="star">✦</span>Once&nbsp;Upon
        </Link>
        <button
          className={`nav-toggle${menuOpen ? " open" : ""}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div id="primary-nav" className={`nav-menu${menuOpen ? " open" : ""}`}>
          <div className="nav-links">
            <Link href="/" onClick={closeMenu}>Home</Link>
            <Link href="/#how" onClick={closeMenu}>How it works</Link>
            <Link href="/#prices" onClick={closeMenu}>Pricing</Link>
            <Link href="/about" onClick={closeMenu}>About</Link>
            <Link href="/dashboard" onClick={closeMenu}>My Books</Link>
          </div>
          <div className="acct">
            {user ? (
              <>
                <Link href="/settings" className="acct-name" onClick={closeMenu}>
                  <span className="av">{(user.name || "?")[0].toUpperCase()}</span>
                  {user.name}
                </Link>
                <button className="nav-action" type="button" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={closeMenu}>Sign in</Link>
                <Link href="/auth?mode=signup" onClick={closeMenu}>Sign up</Link>
                <Link href="/create" className="btn btn-primary" onClick={closeMenu}>
                  Make a book
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
