import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminContext } from "@/lib/admin";
import AdminApp from "./AdminApp";

export const metadata = { title: "Admin — Once Uponly" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/auth?next=/admin");

  const ctx = await getAdminContext();
  if (!ctx) redirect("/"); // not an admin
  if (!ctx.mfaOk) redirect("/settings?mfa=required"); // admins must have 2FA on

  return <AdminApp isSuper={ctx.isSuper} />;
}
