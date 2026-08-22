import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, Clock, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { formatINR, STATUS_LABELS, STATUS_TONES } from "@/lib/orderLogic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

const toneClasses: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  indigo: "bg-indigo-100 text-indigo-800",
  rose: "bg-rose-100 text-rose-800",
};

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

  const stats = [
    { label: "Today's orders", value: todayOrders.length, icon: ClipboardList },
    { label: "Pending orders", value: pending.length, icon: Clock },
    { label: "Confirmed revenue", value: formatINR(revenue), icon: TrendingUp },
    { label: "Low stock items", value: lowStock.length, icon: AlertCircle },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <h1 className="font-heading text-3xl text-accent">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">
        A quick look at today and recent activity.
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 font-heading text-2xl text-foreground">
                {s.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl text-foreground">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {orders.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              orders.slice(0, 6).map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.customerName} · {formatINR(Number(o.total))}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      toneClasses[STATUS_TONES[o.status]] ?? ""
                    }`}
                  >
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low stock */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl text-foreground">Low stock</h2>
            <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {lowStock.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">All products well stocked.</p>
            ) : (
              lowStock.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50"
                >
                  <span className="text-sm text-foreground">{p.name}</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      p.stock === 0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.stock} left
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
