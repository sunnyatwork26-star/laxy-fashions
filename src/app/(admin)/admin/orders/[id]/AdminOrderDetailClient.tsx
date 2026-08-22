"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageCircle, Phone, MapPin, StickyNote, Package,
} from "lucide-react";
import { transitionOrder } from "@/server/actions/orders";
import {
  formatINR, STATUS_LABELS, STATUS_TONES, nextStatuses,
  buildWhatsAppMessage, whatsappUrl,
} from "@/lib/orderLogic";
import { toast } from "sonner";

const toneClasses: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  indigo: "bg-indigo-100 text-indigo-800",
  rose: "bg-rose-100 text-rose-800",
};

export default function AdminOrderDetailClient({ order: initialOrder }: { order: any }) {
  const [order, setOrder] = useState(initialOrder);
  const [confirmTo, setConfirmTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const runTransition = (toStatus: string, note?: string) => {
    setError("");
    setBusy(true);
    startTransition(async () => {
      const res = await transitionOrder(order.id, toStatus, note);
      setBusy(false);
      if (res.ok) {
        setOrder((o: any) => ({ ...o, status: res.status }));
        setConfirmTo(null);
        toast.success(`Order ${order.orderNumber} → ${STATUS_LABELS[res.status]}`);
        router.refresh();
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  const next = nextStatuses(order.status);
  const waLink = whatsappUrl(
    buildWhatsAppMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items,
      total: order.total,
    })
  );

  return (
    <div className="p-5 sm:p-8 max-w-3xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl text-accent">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <span
          className={`text-sm font-medium px-3 py-1.5 rounded-full ${
            toneClasses[STATUS_TONES[order.status]] ?? ""
          }`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Items */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg flex items-center gap-2">
          <Package className="h-4 w-4" /> Items
        </h2>
        <div className="mt-3 space-y-2">
          {order.items.map((it: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-foreground/85">
                {it.quantity} × {it.productNameSnapshot}{" "}
                <span className="text-muted-foreground">
                  ({formatINR(it.unitPriceSnapshot)})
                </span>
              </span>
              <span className="font-medium">{formatINR(it.lineTotalSnapshot)}</span>
            </div>
          ))}
          <div className="pt-3 mt-2 border-t border-border flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-heading text-xl">{formatINR(order.total)}</span>
          </div>
        </div>
        {order.inventoryCommitted && (
          <p className="mt-3 text-xs text-emerald-600">
            ✓ Inventory committed for this order.
          </p>
        )}
      </div>

      {/* Customer */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-heading text-lg">Customer</h2>
        <p className="text-sm flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {order.customerName} · {order.phone}
        </p>
        <p className="text-sm flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span>
            {order.addressLine}, {order.area}
            {order.landmark ? `, ${order.landmark}` : ""}, {order.city},{" "}
            {order.state} {order.pincode}
          </span>
        </p>
        {order.note && (
          <p className="text-sm flex items-start gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{order.note}</span>
          </p>
        )}
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          Message customer on WhatsApp
        </a>
      </div>

      {/* Status history */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg mb-3">Status history</h2>
        {order.statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history.</p>
        ) : (
          <ol className="space-y-3">
            {order.statusHistory.map((h: any, i: number) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  {i < order.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-1">
                  <p className="text-foreground">
                    {h.fromStatus
                      ? `${STATUS_LABELS[h.fromStatus]} → ${STATUS_LABELS[h.toStatus]}`
                      : `Order placed → ${STATUS_LABELS[h.toStatus]}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {h.changedByAdmin
                      ? h.changedByAdmin.name ?? h.changedByAdmin.email
                      : "System"}{" "}
                    ·{" "}
                    {new Date(h.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {h.note && (
                    <p className="text-xs text-muted-foreground italic">
                      "{h.note}"
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Next actions */}
      <div className="mt-6">
        <h2 className="font-heading text-lg mb-3">Next steps</h2>
        {next.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This order is {STATUS_LABELS[order.status].toLowerCase()} — no
            further actions.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => {
                  if (s === "CONFIRMED" || s === "CANCELLED") setConfirmTo(s);
                  else runTransition(s);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-medium btn-press disabled:opacity-60 ${
                  s === "CANCELLED"
                    ? "border border-destructive text-destructive hover:bg-destructive hover:text-white"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {s === "CONFIRMED"
                  ? "Confirm order"
                  : s === "CANCELLED"
                  ? "Cancel order"
                  : `Mark as ${STATUS_LABELS[s]}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => !busy && setConfirmTo(null)}
          />
          <div className="relative bg-background rounded-2xl border border-border p-6 w-full max-w-md animate-fade-in">
            <h3 className="font-heading text-xl">
              {confirmTo === "CONFIRMED"
                ? "Confirm this order?"
                : "Cancel this order?"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmTo === "CONFIRMED"
                ? "We'll verify stock and reserve it for this order. This cannot be undone without cancelling."
                : order.inventoryCommitted
                ? "Stock reserved for this order will be returned to inventory."
                : "No inventory was committed, so nothing will be restocked."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmTo(null)}
                disabled={busy}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => runTransition(confirmTo)}
                disabled={busy}
                className={`rounded-full px-5 py-2 text-sm font-medium text-white inline-flex items-center gap-2 ${
                  confirmTo === "CANCELLED" ? "bg-destructive" : "bg-primary"
                }`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmTo === "CONFIRMED" ? "Confirm order" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
