import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/dashboard", "/create", "/book", "/checkout", "/image-test", "/settings", "/orders", "/admin"];
const ADMIN_IDLE_MS = 60 * 60 * 1000; // log admins out after 60 min of inactivity

const isAdminPath = (p: string) => p.startsWith("/admin") || p.startsWith("/api/admin");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminPath = isAdminPath(pathname);

  if (!adminPath && !PROTECTED.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Must be signed in.
  const token = req.cookies.get("ou_token")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
      valid = true;
    } catch {
      // invalid/expired
    }
  }
  if (!valid) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Server-enforced admin idle timeout — works regardless of client JS (mobile-proof).
  if (adminPath) {
    const seen = req.cookies.get("ou_admin_seen")?.value;
    const now = Date.now();
    if (seen && now - Number(seen) > ADMIN_IDLE_MS) {
      // Idle too long: end the session entirely (re-login + MFA required).
      let res: NextResponse;
      if (pathname.startsWith("/api/")) {
        res = NextResponse.json({ error: "Signed out for inactivity.", code: "ADMIN_IDLE" }, { status: 401 });
      } else {
        const url = req.nextUrl.clone();
        url.pathname = "/auth";
        url.searchParams.set("next", "/admin");
        url.searchParams.set("timeout", "1");
        res = NextResponse.redirect(url);
      }
      res.cookies.delete("ou_token");
      res.cookies.delete("ou_admin_seen");
      return res;
    }
    // Active: slide the activity window forward.
    const res = NextResponse.next();
    res.cookies.set("ou_admin_seen", String(now), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create/:path*",
    "/book/:path*",
    "/checkout/:path*",
    "/image-test/:path*",
    "/settings/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
