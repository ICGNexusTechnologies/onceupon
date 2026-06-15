"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Me {
  name: string;
}

export default function Nav() {
  const [user, setUser] = useState<Me | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="topnav">
      <div className="wrap nav-inner">
        <Link href="/" className="logo">
          <span className="star">✦</span>Once&nbsp;Upon
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#prices">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/dashboard">My Books</Link>
        </div>
        <div className="acct">
          {user ? (
            <>
              <Link href="/settings" className="acct-name">
                <span className="av">{(user.name || "?")[0].toUpperCase()}</span>
                {user.name}
              </Link>
              <a onClick={signOut}>Sign out</a>
            </>
          ) : (
            <>
              <Link href="/auth">Sign in</Link>
              <Link href="/create" className="btn btn-primary">
                Make a book
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
