"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  Store,
  Boxes,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
];

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <aside className="lg:w-60 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center justify-between lg:justify-start gap-2">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-heading text-xl text-accent">Laxy</span>
          <span className="font-heading text-xl font-light text-foreground">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex lg:flex-col gap-1 px-3 pb-3 lg:pb-0 overflow-x-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/75 hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="hidden lg:block mt-auto p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground/75 hover:bg-secondary"
        >
          <Store className="h-4 w-4" />
          View store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground/75 hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        {user?.email && (
          <p className="px-3 pt-2 text-xs text-muted-foreground truncate">
            {user.email}
            {user.role && (
              <span className="ml-1 capitalize text-[10px] opacity-60">
                · {user.role.toLowerCase()}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden flex justify-end gap-2 px-4 py-2 border-t border-border">
        <Link
          href="/"
          className="text-xs text-muted-foreground flex items-center gap-1"
        >
          <Store className="h-3.5 w-3.5" />
          Store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-xs text-muted-foreground flex items-center gap-1"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
