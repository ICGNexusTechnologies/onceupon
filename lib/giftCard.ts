import crypto from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGiftCardCode(): string {
  const bytes = crypto.randomBytes(8);
  const part = (start: number) =>
    Array.from(bytes.slice(start, start + 4))
      .map((b) => CHARS[b % CHARS.length])
      .join("");
  return `ONCE-${part(0)}-${part(4)}`;
}
