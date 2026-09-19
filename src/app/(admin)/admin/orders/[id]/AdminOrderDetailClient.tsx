"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, MessageCircle, Phone, MapPin, StickyNote, Package,
  CheckCircle2, Clock, Truck, XCircle, Copy, Check, ExternalLink,
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
  const [copied, setCopied] = useState(false);
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
        toast.success(`Order #${order.orderNumber} updated to ${STATUS_LABELS[res.status]}`);
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
    }),
    order.phone
  );
  const isCancelled = order.status === "CANCELLED";
  const currentFlowIdx = ORDER_FLOW.indexOf(order.status);

  const copyAddress = () => {
    const addr = `${order.customerName}\n${order.addressLine}, ${order.area}${order.landmark ? `, ${order.landmark}` : ""}\n${order.city}, ${order.state} ${order.pincode}\nPhone: ${order.phone}`;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    toast.success("Shipping address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Navigation */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Orders
      </Link>

      {/* Order Title Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl sm:text-4xl font-bold text-foreground">
              #{order.orderNumber}
            </h1>
            <StatusBadge status={order.status} size="md" pulse={order.status === "PENDING"} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
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

        <div className="flex items-center gap-2.5">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors shadow-xs"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Customer
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Visual Stepper Progress Bar */}
      {!isCancelled && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Fulfillment Journey
          </h2>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {ORDER_FLOW.map((step, idx) => {
              const StepIcon = flowIcons[step] ?? CheckCircle2;
              const isPast = idx < currentFlowIdx;
              const isCurrent = idx === currentFlowIdx;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none min-w-[70px]">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-xs shadow-primary/30 ring-4 ring-primary/10"
                          : isPast
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                        isCurrent ? "font-bold text-primary" : isPast ? "text-emerald-700 font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {idx < ORDER_FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                        idx < currentFlowIdx ? "bg-emerald-500" : "bg-border/60"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Two Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Order Items ({order.items.length})
            </h2>

            <div className="divide-y divide-border/60">
              {order.items.map((it: any, i: number) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/50 flex items-center justify-center font-mono text-xs font-bold text-foreground shrink-0">
                      {it.quantity}×
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{it.productNameSnapshot}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Unit price: {formatINR(it.unitPriceSnapshot)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground shrink-0">
                    {formatINR(it.lineTotalSnapshot)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Calculation */}
            <div className="pt-4 border-t border-border/60 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Subtotal</span>
                <span>{formatINR(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Delivery / Shipping</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="pt-2 border-t border-border/40 flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="font-mono text-2xl font-bold text-foreground">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline Audit History */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Status History</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events recorded.</p>
            ) : (
              <ol className="space-y-4">
                {order.statusHistory.map((h: any, i: number) => (
                  <li key={i} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full mt-0.5 ${i === 0 ? "bg-primary ring-2 ring-primary/20" : "bg-border"}`} />
                      {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-border/80" />}
                    </div>
                    <div className="pb-1">
                      <p className="font-semibold text-foreground">
                        {h.fromStatus
                          ? `${STATUS_LABELS[h.fromStatus]} → ${STATUS_LABELS[h.toStatus]}`
                          : `Order Placed (${STATUS_LABELS[h.toStatus]})`}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {h.changedByAdmin ? h.changedByAdmin.name : "Customer / Storefront"} ·{" "}
                        {new Date(h.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right 1 Col: Customer & Action Controls */}
        <div className="space-y-6">
          {/* Customer Details Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-foreground">Customer</h2>
              <button
                onClick={copyAddress}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Address"}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                <p className="font-bold text-sm text-foreground">{order.customerName}</p>
                <p className="text-muted-foreground font-mono">{order.phone}</p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Destination
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {order.addressLine}, {order.area}
                  {order.landmark ? `, ${order.landmark}` : ""}, {order.city},{" "}
                  {order.state} - {order.pincode}
                </p>
              </div>

              {order.note && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
                  <p className="font-semibold flex items-center gap-1 text-xs">
                    <StickyNote className="h-3.5 w-3.5 text-amber-700" /> Customer Note
                  </p>
                  <p className="text-xs italic mt-0.5">&ldquo;{order.note}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${order.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> Call Customer
              </a>
            </div>
          </div>

          {/* Action Transition Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3">
            <h2 className="font-heading text-lg font-bold text-foreground">Next Fulfillment Action</h2>
            {next.length === 0 ? (
              <p className="text-xs text-muted-foreground">Order has completed its terminal status.</p>
            ) : (
              <div className="space-y-2">
                {next.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => {
                      if (s === "CONFIRMED" || s === "CANCELLED") setConfirmTo(s);
                      else runTransition(s);
                    }}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${
                      s === "CANCELLED"
                        ? "border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                    }`}
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {s === "CONFIRMED"
                      ? "✓ Confirm Order"
                      : s === "CANCELLED"
                      ? "✗ Cancel Order"
                      : `Advance to ${STATUS_LABELS[s]}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-xs" onClick={() => !busy && setConfirmTo(null)} />
          <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="font-heading text-xl font-bold text-foreground">
              {confirmTo === "CONFIRMED" ? "Confirm and Lock Order?" : "Cancel this Order?"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {confirmTo === "CONFIRMED"
                ? "Confirming will commit inventory to this order and move it to preparation."
                : "Cancelling will restore committed inventory back to stock."}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmTo(null)}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Go back
              </button>
              <button
                onClick={() => runTransition(confirmTo)}
                disabled={busy}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 ${
                  confirmTo === "CANCELLED" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {confirmTo === "CONFIRMED" ? "Yes, Confirm" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
