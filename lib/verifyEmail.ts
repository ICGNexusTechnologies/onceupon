import crypto from "crypto";
import type { HydratedDocument } from "mongoose";
import type { IUser } from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

/** Issue a fresh email-verification token on the user and send the email. */
export async function issueVerification(user: HydratedDocument<IUser>): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  user.verifyTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  user.verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await user.save();

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
  try {
    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
  } catch (err) {
    console.error("verification email failed", err);
  }
}
