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
  ShieldCheck,
  ExternalLink,
  Settings,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <aside className="lg:w-64 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border/80 bg-card flex flex-col transition-all">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-border/40">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-heading font-bold text-lg group-hover:scale-105 transition-transform">
            L
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xl font-bold text-foreground tracking-tight">Laxy</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-3.5 space-y-1 flex lg:flex-col overflow-x-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick Links & User Footer */}
      <div className="hidden lg:flex flex-col mt-auto p-4 border-t border-border/40 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5" />
            Live Storefront
          </span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </Link>

        {/* User Card */}
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || "Admin"}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                  <span className="capitalize">{user?.role?.toLowerCase() || "Owner"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Quick Actions */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-card/80 backdrop-blur-md">
        <Link
          href="/"
          target="_blank"
          className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 hover:text-foreground"
        >
          <Store className="h-3.5 w-3.5" />
          Storefront
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="text-xs font-medium text-destructive/80 flex items-center gap-1.5 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
