import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User, { type IUser } from "@/models/User";
import { getSuperAdminSession, isSuperAdminEmail } from "@/lib/admin";
import { sendAdminGrantedEmail } from "@/lib/email";

function superEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** GET /api/admin/admins — list super-admins + granted admins (super-admin only). */
export async function GET() {
  const su = await getSuperAdminSession();
  if (!su) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const supers = superEmails();
  const [grantedUsers, superUsers] = await Promise.all([
    User.find({ isAdmin: true }).select("email name mfaEnabled").lean() as unknown as Promise<IUser[]>,
    User.find({ email: { $in: supers } }).select("email name mfaEnabled").lean() as unknown as Promise<IUser[]>,
  ]);
  const superMap = new Map(superUsers.map((u) => [u.email.toLowerCase(), u]));

  const admins: {
    id?: string;
    email: string;
    name: string;
    role: "super" | "admin";
    mfaEnabled: boolean;
    hasAccount: boolean;
  }[] = [];

  for (const e of supers) {
    const u = superMap.get(e);
    admins.push({ email: e, name: u?.name || "", role: "super", mfaEnabled: !!u?.mfaEnabled, hasAccount: !!u });
  }
  for (const u of grantedUsers) {
    if (supers.includes(u.email.toLowerCase())) continue; // already shown as super
    admins.push({ id: String(u._id), email: u.email, name: u.name || "", role: "admin", mfaEnabled: !!u.mfaEnabled, hasAccount: true });
  }

  return NextResponse.json({ admins });
}

/** POST /api/admin/admins — grant/revoke admin. Body: { action: "grant"|"revoke", email } */
export async function POST(req: NextRequest) {
  const su = await getSuperAdminSession();
  if (!su) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, email } = (await req.json()) as { action?: string; email?: string };
  const e = String(email || "").trim().toLowerCase();
  if (!e) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (isSuperAdminEmail(e)) {
    return NextResponse.json({ error: "That's a super-admin account and can't be changed here." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email: e });
  if (!user) {
    return NextResponse.json({ error: "No account with that email — they need to sign up first." }, { status: 404 });
  }

  if (action === "grant") {
    user.isAdmin = true;
    await user.save();
    // Email them a link straight to two-factor setup (or the dashboard if they
    // already have it) so they don't have to discover the admin URL themselves.
    try {
      await sendAdminGrantedEmail({ to: user.email, name: user.name, needsMfa: !user.mfaEnabled });
    } catch (err) {
      console.error("admin-granted email failed", err);
    }
    const note = user.mfaEnabled
      ? " — we emailed them a link to the dashboard"
      : " — we emailed them a link to set up two-factor first";
    return NextResponse.json({ ok: true, message: `${e} is now an admin${note}` });
  }
  if (action === "revoke") {
    user.isAdmin = false;
    await user.save();
    return NextResponse.json({ ok: true, message: `Admin access removed for ${e}` });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
