"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageCircle, Phone, MapPin, StickyNote, Package,
  CheckCircle2, Clock, Truck, XCircle, Copy,
} from "lucide-react";
import { transitionOrder } from "@/server/actions/orders";
import {
  formatINR, STATUS_LABELS, STATUS_TONES, nextStatuses,
  buildWhatsAppMessage, whatsappUrl,
} from "@/lib/orderLogic";
import StatusBadge from "@/components/admin/StatusBadge";
import { toast } from "sonner";

const ORDER_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "DELIVERED"];
const flowIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PREPARING: Package,
  READY: CheckCircle2,
  DISPATCHED: Truck,
  DELIVERED: CheckCircle2,
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
  const isCancelled = order.status === "CANCELLED";
  const currentFlowIdx = ORDER_FLOW.indexOf(order.status);

  const copyAddress = () => {
    const addr = `${order.customerName}\n${order.addressLine}, ${order.area}${order.landmark ? `, ${order.landmark}` : ""}\n${order.city}, ${order.state} ${order.pincode}\nPhone: ${order.phone}`;
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  return (
    <div className="p-5 sm:p-8 max-w-3xl space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusBadge status={order.status} size="lg" />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Order Progress Bar */}
      {!isCancelled && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Order Progress
          </h2>
          <div className="flex items-center justify-between">
            {ORDER_FLOW.map((step, idx) => {
              const StepIcon = flowIcons[step] ?? CheckCircle2;
              const isPast = idx <= currentFlowIdx;
              const isCurrent = idx === currentFlowIdx;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCurrent
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : isPast
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium ${
                        isCurrent ? "text-primary" : isPast ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {idx < ORDER_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 rounded-full ${
                        idx < currentFlowIdx ? "bg-emerald-400" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-5 flex items-center gap-3">
          <XCircle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <p className="font-semibold text-rose-800">Order Cancelled</p>
            <p className="text-sm text-rose-700">
              {order.inventoryCommitted
                ? "Stock has been restored to inventory."
                : "No inventory was committed for this order."}
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-bold flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" /> Order Items
        </h2>
        <div className="mt-3 space-y-2">
          {order.items.map((it: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-foreground">
                <span className="font-medium">{it.quantity}×</span>{" "}
                {it.productNameSnapshot}{" "}
                <span className="text-muted-foreground">
                  @ {formatINR(it.unitPriceSnapshot)}
                </span>
              </span>
              <span className="font-semibold">{formatINR(it.lineTotalSnapshot)}</span>
            </div>
          ))}
          <div className="pt-3 mt-2 border-t border-border flex justify-between items-baseline">
            <span className="text-sm font-medium text-muted-foreground">Order Total</span>
            <span className="font-heading text-2xl font-bold">{formatINR(order.total)}</span>
          </div>
        </div>
        {order.inventoryCommitted && (
          <p className="mt-3 text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Inventory committed for this order.
          </p>
        )}
      </div>

      {/* Customer */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Customer Details</h2>
          <button
            onClick={copyAddress}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Address
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customerName}</span>
            <span className="text-muted-foreground">·</span>
            <span>{order.phone}</span>
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
              <span className="text-muted-foreground italic">{order.note}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Message on WhatsApp
          </a>
          <a
            href={`tel:${order.phone}`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call Customer
          </a>
        </div>
      </div>

      {/* Status history */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-bold mb-3">Status Timeline</h2>
        {order.statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history.</p>
        ) : (
          <ol className="space-y-3">
            {order.statusHistory.map((h: any, i: number) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full mt-1 ${
                    i === 0 ? "bg-primary ring-2 ring-primary/20" : "bg-border"
                  }`} />
                  {i < order.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-foreground font-medium">
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
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      &ldquo;{h.note}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Next actions */}
      <div>
        <h2 className="font-heading text-lg font-bold mb-3">Next Steps</h2>
        {next.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">
              This order is <strong>{STATUS_LABELS[order.status].toLowerCase()}</strong> — no further actions available.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {next.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => {
                  if (s === "CONFIRMED" || s === "CANCELLED") setConfirmTo(s);
                  else runTransition(s);
                }}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md disabled:opacity-60 ${
                  s === "CANCELLED"
                    ? "border-2 border-red-300 text-red-700 bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                {s === "CONFIRMED"
                  ? "✓ Confirm Order"
                  : s === "CANCELLED"
                  ? "✗ Cancel Order"
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
          <div className="relative bg-background rounded-2xl border border-border p-6 w-full max-w-md animate-fade-in shadow-xl">
            <h3 className="font-heading text-xl font-bold">
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
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmTo(null)}
                disabled={busy}
                className="rounded-full border-2 border-gray-300 bg-white text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={() => runTransition(confirmTo)}
                disabled={busy}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-2 shadow-md transition-all hover:shadow-lg disabled:opacity-50 ${
                  confirmTo === "CANCELLED" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmTo === "CONFIRMED" ? "✓ Confirm Order" : "✗ Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
