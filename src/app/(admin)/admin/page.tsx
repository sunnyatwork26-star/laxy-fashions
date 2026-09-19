import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Package,
  CheckCircle2,
  MessageCircle,
  Plus,
  ShoppingBag,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { formatINR, STATUS_LABELS, STATUS_TONES } from "@/lib/orderLogic";
import StatusBadge from "@/components/admin/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard | Laxy Fashions" };

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: true,
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, stock: true, slug: true, basePrice: true, images: true },
    }),
  ]);

  const todayOrders = orders.filter((o) => o.createdAt >= startOfDay);
  const pending = orders.filter((o) => o.status === "PENDING");
  const revenue = orders
    .filter((o) =>
      ["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "DELIVERED"].includes(o.status)
    )
    .reduce((s, o) => s + Number(o.total), 0);
  const lowStock = products.filter((p) => p.stock <= 3);
  const delivered = orders.filter((o) => o.status === "DELIVERED");

  const stats = [
    {
      label: "Today's Orders",
      value: todayOrders.length,
      subtitle: `${orders.length} total orders recorded`,
      icon: ClipboardList,
      color: "border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-card",
      iconBg: "bg-blue-600/10 text-blue-600",
      trend: "+12% vs yesterday",
    },
    {
      label: "Pending Action",
      value: pending.length,
      subtitle: pending.length > 0 ? "Requires confirmation" : "All orders confirmed",
      icon: Clock,
      color: "border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-card",
      iconBg: "bg-amber-600/10 text-amber-600",
      alert: pending.length > 0,
      trend: pending.length > 0 ? "Action needed" : "Clean queue",
    },
    {
      label: "Total Revenue",
      value: formatINR(revenue),
      subtitle: `${delivered.length} orders delivered`,
      icon: TrendingUp,
      color: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-card",
      iconBg: "bg-emerald-600/10 text-emerald-600",
      trend: "Confirmed orders",
    },
    {
      label: "Low Stock Alert",
      value: lowStock.length,
      subtitle: `${products.length} active products`,
      icon: AlertCircle,
      color: "border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-card",
      iconBg: "bg-rose-600/10 text-rose-600",
      alert: lowStock.length > 0,
      trend: lowStock.length > 0 ? "Restock advised" : "Healthy stock",
    },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Store
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time commerce overview for{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-xs"
          >
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Manage Orders
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-2xl border p-5 ${s.color} relative shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground bg-card/80 px-2 py-0.5 rounded-md border border-border/40">
                  {s.trend}
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {s.value}
              </div>
              <p className="text-xs font-semibold text-foreground/80 mt-1">
                {s.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {s.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Required - Pending Orders Banner */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  Action Required: {pending.length} Pending Order{pending.length > 1 ? "s" : ""}
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </h2>
                <p className="text-xs text-amber-800/80 dark:text-amber-400 mt-0.5">
                  Confirm these orders to start preparation and dispatch.
                </p>
              </div>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-800 transition-colors shadow-xs"
            >
              Review Pending
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Orders & Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Recent Orders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest customer transactions</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all ({orders.length})
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No orders placed yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {orders.slice(0, 7).map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-secondary/20 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center font-mono text-xs font-bold text-foreground shrink-0">
                      {order.customerName ? order.customerName.slice(0, 2).toUpperCase() : "LX"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-bold text-foreground hover:text-primary truncate"
                        >
                          #{order.orderNumber}
                        </Link>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.customerName} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {formatINR(Number(order.total))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Stock Health & Quick Links */}
        <div className="space-y-6">
          {/* Low Stock Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Stock Health</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Inventory alerts</p>
              </div>
              <Link
                href="/admin/inventory"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Manage
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {lowStock.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-emerald-800">All Products In Stock</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">No products below threshold.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStock.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/40"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatINR(Number(p.basePrice))}</p>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 border border-rose-500/20 shrink-0">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/products/new"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/50 transition-colors text-center"
              >
                <Plus className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs font-semibold text-foreground">Add Product</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/50 transition-colors text-center"
              >
                <ShoppingBag className="h-4 w-4 text-accent mb-1" />
                <span className="text-xs font-semibold text-foreground">Fulfillment</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
