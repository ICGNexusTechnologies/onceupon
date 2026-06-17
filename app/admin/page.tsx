import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import AdminApp from "./AdminApp";

export const metadata = { title: "Admin — Once Upon" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/auth?next=/admin");
  if (!isAdminEmail(session.email)) redirect("/");
  return <AdminApp />;
}
