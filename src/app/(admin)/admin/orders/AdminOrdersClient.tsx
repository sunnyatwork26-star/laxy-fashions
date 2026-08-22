"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { transitionOrder } from "@/server/actions/orders";
import { formatINR, STATUS_LABELS, STATUS_TONES, nextStatuses } from "@/lib/orderLogic";
import { toast } from "sonner";

const STATUSES = [
  "PENDING", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "DELIVERED", "CANCELLED",
];

const toneClasses: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  indigo: "bg-indigo-100 text-indigo-800",
  rose: "bg-rose-100 text-rose-800",
};

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

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <h1 className="font-heading text-3xl text-accent">Orders</h1>

      {/* Filters */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order number, name, phone…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            No orders found.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((o) => {
              const next = nextStatuses(o.status);
              return (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/40"
                >
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {o.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          toneClasses[STATUS_TONES[o.status]] ?? ""
                        }`}
                      >
                        {STATUS_LABELS[o.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {o.customerName} · {o.phone} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatINR(o.total)}
                    </span>
                    {next.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => transition(o, e.target.value)}
                        disabled={busy[o.id]}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-50"
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
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
