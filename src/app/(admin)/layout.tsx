import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <AdminSidebar user={session.user as any} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
