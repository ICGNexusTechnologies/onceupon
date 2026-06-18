import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { SignJWT, jwtVerify } from "jose";

// Allow a one-step clock drift in either direction.
authenticator.options = { window: 1 };

const ISSUER = "Once Upon";

// --- TOTP secret encryption at rest (AES-256-GCM, key derived from JWT_SECRET) ---
function encKey(): Buffer {
  return crypto.createHash("sha256").update(`${process.env.JWT_SECRET}:mfa-enc`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString("utf8");
}

// --- Setup ---
export async function generateMfaSetup(email: string): Promise<{
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}> {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, ISSUER, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  return { secret, otpauth, qrDataUrl };
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

// --- Backup codes ---
export async function generateBackupCodes(count = 10): Promise<{ plain: string[]; hashes: string[] }> {
  const plain: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  const hashes = await Promise.all(plain.map((c) => bcrypt.hash(c, 10)));
  return { plain, hashes };
}

/** Returns the index of a matching (unused) backup code, or -1. */
export async function matchBackupCode(code: string, hashes: string[]): Promise<number> {
  const normalized = code.replace(/\s/g, "").toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) return i;
  }
  return -1;
}

// --- Short-lived MFA challenge token (signed with a key distinct from the
//     session key, so it can NEVER be replayed as a valid session cookie) ---
function challengeKey(): Uint8Array {
  return new Uint8Array(crypto.createHash("sha256").update(`${process.env.JWT_SECRET}:mfa-challenge`).digest());
}

export async function signMfaChallenge(userId: string): Promise<string> {
  return new SignJWT({ userId, typ: "mfa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(challengeKey());
}

export async function verifyMfaChallenge(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, challengeKey());
    if (payload.typ !== "mfa" || typeof payload.userId !== "string") return null;
    return payload.userId;
  } catch {
    return null;
  }
}
