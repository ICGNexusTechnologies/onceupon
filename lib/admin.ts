import { getSession, type SessionPayload } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

/** Super-admins (the master accounts) come from the ADMIN_EMAILS allowlist. */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export type AdminContext = {
  session: SessionPayload;
  email: string;
  isSuper: boolean; // can manage other admins
  mfaOk: boolean; // has MFA enabled (required for admin access)
};

/**
 * Full admin context (with a DB lookup). An admin is either a super-admin
 * (ADMIN_EMAILS) or a user granted `isAdmin` from the Team tab. Returns null if
 * the current account is not an admin at all.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.userId).select("email isAdmin mfaEnabled").lean();
  if (!user) return null;
  const isAdmin = isSuperAdminEmail(user.email) || !!user.isAdmin;
  if (!isAdmin) return null;
  return {
    session,
    email: user.email,
    isSuper: isSuperAdminEmail(user.email),
    mfaOk: !!user.mfaEnabled,
  };
}

/** API guard: returns the session only for an admin WITH MFA enabled (forced). */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.mfaOk) return null;
  return ctx.session;
}

/** API guard for team management: super-admin (ADMIN_EMAILS) with MFA only. */
export async function getSuperAdminSession(): Promise<SessionPayload | null> {
  const ctx = await getAdminContext();
  if (!ctx || !ctx.isSuper || !ctx.mfaOk) return null;
  return ctx.session;
}
