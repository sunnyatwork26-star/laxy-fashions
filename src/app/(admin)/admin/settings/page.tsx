import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStoreSettings, getStaffAdmins } from "@/server/actions/settings";
import AdminSettingsClient from "./AdminSettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Settings & Controls | Laxy Fashions Admin",
};

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const settings = await getStoreSettings();
  const isOwner = (session.user as { role?: string })?.role === "OWNER";
  const staffList = isOwner ? await getStaffAdmins().catch(() => []) : [];

  return (
    <AdminSettingsClient
      initialSettings={settings}
      currentUser={{
        id: (session.user as { id?: string }).id || "",
        name: session.user.name || "Admin",
        email: session.user.email || "admin@laxyfashions.com",
        role: (session.user as { role?: string }).role || "OWNER",
      }}
      initialStaff={staffList}
      isOwner={isOwner}
    />
  );
}
