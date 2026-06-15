"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Success() {
  const params = useSearchParams();
  const router = useRouter();
  const bookId = params.get("book");

  useEffect(() => {
    const t = setTimeout(() => {
      router.push(bookId ? `/book/${bookId}` : "/dashboard");
    }, 2600);
    return () => clearTimeout(t);
  }, [bookId, router]);

  return (
    <div className="loading fade-in">
      <div className="spinner"></div>
      <h2>Payment received! 🎉</h2>
      <p>Creating the illustrations — taking you to your book…</p>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}
