"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search, ChevronRight, Loader2, MessageCircle, X, ShoppingBag, Filter } from "lucide-react";
import { transitionOrder } from "@/server/actions/orders";
import { formatINR, STATUS_LABELS, STATUS_TONES, nextStatuses } from "@/lib/orderLogic";
import StatusBadge from "@/components/admin/StatusBadge";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "", label: "All Orders" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: string;
  total: number;
  createdAt: Date;
}

export default function AdminOrdersClient({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((o) =>
        (o.orderNumber + " " + o.customerName + " " + o.phone)
          .toLowerCase()
          .includes(t)
      );
    }
    return list;
  }, [orders, q, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { "": orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const transition = async (o: Order, toStatus: string) => {
    if (!toStatus || toStatus === o.status) return;
    setBusy((b) => ({ ...b, [o.id]: true }));
    startTransition(async () => {
      const res = await transitionOrder(o.id, toStatus);
      if (res.ok) {
        setOrders((list) =>
          list.map((x) => (x.id === o.id ? { ...x, status: res.status } : x))
        );
        toast.success(
          `Order #${o.orderNumber} updated to ${STATUS_LABELS[res.status]}`
        );
      } else {
        toast.error(res.error);
      }
      setBusy((b) => ({ ...b, [o.id]: false }));
    });
  };

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and process customer orders through fulfillment stages.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/50">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orders by #number, customer name, phone..."
            className="w-full rounded-xl border border-border/70 bg-secondary/30 px-10 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:bg-card transition-all"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No orders matching your criteria</h3>
            <p className="text-xs text-muted-foreground mt-1">Try selecting a different status filter or clearing search.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((o) => {
              const next = nextStatuses(o.status);
              const cleanPhone = o.phone.replace(/\D/g, "");
              const waText = encodeURIComponent(
                `Hi ${o.customerName}, regarding your order #${o.orderNumber} at Laxy Fashions...`
              );

              return (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-secondary/25 transition-colors"
                >
                  {/* Left: Customer & ID */}
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3.5 min-w-0 flex-1 group">
                    <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center font-mono text-xs font-bold text-foreground shrink-0 group-hover:border-primary/40 transition-colors">
                      {o.customerName ? o.customerName.slice(0, 2).toUpperCase() : "LX"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          #{o.orderNumber}
                        </span>
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        <span className="font-medium text-foreground/80">{o.customerName}</span> · {o.phone} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>

                  {/* Right: Pricing, WhatsApp, Transition Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold text-foreground min-w-[70px] text-right">
                      {formatINR(o.total)}
                    </span>

                    {/* WhatsApp button */}
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors"
                      title="Direct WhatsApp Chat"
                      aria-label="Direct WhatsApp Chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>

                    {/* Move to status dropdown */}
                    {next.length > 0 && (
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => transition(o, e.target.value)}
                          disabled={busy[o.id]}
                          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          <option value="">Move to…</option>
                          {next.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {busy[o.id] && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}

                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/60 transition-colors"
                      title="View order details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Showing {filtered.length} of {orders.length} orders</span>
        <span>Laxy Fashions Order Management</span>
      </div>
    </div>
  );
}
