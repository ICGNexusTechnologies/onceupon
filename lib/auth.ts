import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

const COOKIE_NAME = "ou_token";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Read + verify the session from the request cookie. Null if absent/invalid
 *  or revoked via "log out all devices" (sessionsValidAfter). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: SessionPayload & { iat?: number };
  try {
    const { payload: p } = await jwtVerify(token, secret());
    payload = p as unknown as SessionPayload & { iat?: number };
  } catch {
    return null;
  }

  // Revocation: reject tokens issued before the user's sessionsValidAfter.
  try {
    await dbConnect();
    const user = await User.findById(payload.userId).select("sessionsValidAfter").lean();
    if (user?.sessionsValidAfter && payload.iat && payload.iat * 1000 < user.sessionsValidAfter.getTime()) {
      return null;
    }
  } catch {
    // On a DB hiccup, don't lock everyone out — the signature is already valid.
  }

  return { userId: payload.userId, email: payload.email, name: payload.name };
}

export { COOKIE_NAME };
