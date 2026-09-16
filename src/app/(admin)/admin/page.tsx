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
} from "lucide-react";
import { formatINR, STATUS_LABELS, STATUS_TONES } from "@/lib/orderLogic";
import StatusBadge from "@/components/admin/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, stock: true, slug: true },
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
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      iconBg: "bg-blue-100",
    },
    {
      label: "Pending Orders",
      value: pending.length,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      iconBg: "bg-amber-100",
      alert: pending.length > 0,
    },
    {
      label: "Revenue",
      value: formatINR(revenue),
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      iconBg: "bg-emerald-100",
    },
    {
      label: "Low Stock",
      value: lowStock.length,
      icon: AlertCircle,
      color: "bg-rose-50 text-rose-600 border-rose-200",
      iconBg: "bg-rose-100",
      alert: lowStock.length > 0,
    },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-5xl space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-xl border p-4 ${s.color} relative overflow-hidden`}
            >
              {s.alert && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              )}
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${s.iconBg} mb-3`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="font-heading text-2xl sm:text-3xl font-bold">
                {s.value}
              </div>
              <p className="text-xs font-medium mt-0.5 opacity-80">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action Required - Pending Orders */}
      {pending.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="font-heading text-lg font-bold text-amber-900">
              Action Required — {pending.length} Pending Order{pending.length > 1 ? "s" : ""}
            </h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            These orders need to be confirmed or cancelled. Review each order and take action.
          </p>
          <div className="space-y-2">
            {pending.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all group"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {o.orderNumber}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {o.customerName} · {formatINR(Number(o.total))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700 font-medium">
                    Review →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {pending.length > 3 && (
            <Link
              href="/admin/orders?status=PENDING"
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-900 mt-3"
            >
              View all {pending.length} pending orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No orders yet. Share your shop link to get started!
                </p>
              </div>
            ) : (
              orders.slice(0, 6).map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {o.orderNumber}
                      </p>
                      <StatusBadge status={o.status} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {o.customerName} · {formatINR(Number(o.total))} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low stock */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Stock Alerts
            </h2>
            <Link
              href="/admin/inventory"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Inventory <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {lowStock.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  All products are well stocked!
                </p>
              </div>
            ) : (
              lowStock.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href="/admin/inventory"
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground truncate">
                    {p.name}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      p.stock === 0
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-center group"
          >
            <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium mt-2">All Orders</p>
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-center group"
          >
            <Package className="h-6 w-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium mt-2">New Product</p>
          </Link>
          <Link
            href="/admin/inventory"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-center group"
          >
            <AlertCircle className="h-6 w-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium mt-2">Inventory</p>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all text-center group"
          >
            <MessageCircle className="h-6 w-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium mt-2">View Store</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
