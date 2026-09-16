"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { transitionOrder } from "@/server/actions/orders";
import { formatINR, STATUS_LABELS, STATUS_TONES, nextStatuses } from "@/lib/orderLogic";
import StatusBadge from "@/components/admin/StatusBadge";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "", label: "All" },
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
          `${o.orderNumber} → ${STATUS_LABELS[res.status]}`
        );
      } else {
        toast.error(res.error);
      }
      setBusy((b) => ({ ...b, [o.id]: false }));
    });
  };

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919876543210";

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Orders
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Manage customer orders and update their status.
      </p>

      {/* Status tabs */}
      <div className="mt-5 flex flex-wrap gap-1.5 border-b border-border pb-0">
        {STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.key] || 0;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors relative ${
                isActive
                  ? "bg-card text-primary border border-border border-b-transparent -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order number, name, or phone…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground text-center">
            No orders found.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((o) => {
              const next = nextStatuses(o.status);
              return (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors"
                >
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {o.orderNumber}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {o.customerName} · {o.phone} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatINR(o.total)}
                    </span>

                    {/* WhatsApp quick link */}
                    <a
                      href={`https://wa.me/${o.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hi ${o.customerName}, regarding your order ${o.orderNumber} at Laxy Fashions...`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-full hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                      title="Message on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>

                    {next.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => transition(o, e.target.value)}
                        disabled={busy[o.id]}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Move to…</option>
                        {next.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                    {busy[o.id] && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Link href={`/admin/orders/${o.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {orders.length} orders
      </div>
    </div>
  );
}
