import { getSession, type SessionPayload } from "@/lib/auth";

/** True if the email is in the ADMIN_EMAILS allowlist (comma-separated). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Returns the session only if it belongs to an admin; otherwise null. */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) return null;
  return session;
}
