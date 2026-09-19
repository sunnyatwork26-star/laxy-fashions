"use client";

import { useState, useTransition } from "react";
import { updateStock } from "@/server/actions/products";
import { formatINR } from "@/lib/orderLogic";
import { Loader2, Save, X, Boxes, AlertCircle, TrendingUp, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  status: string;
  fabric?: string | null;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  note?: string | null;
  createdAt: Date;
  product: { name: string };
  createdByAdmin?: { name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  SALE_CONFIRMATION: "Sale Order",
  CANCELLATION_RELEASE: "Order Cancellation",
  MANUAL_ADJUSTMENT: "Manual Correction",
  RESTOCK: "Inventory Restock",
};

export default function AdminInventoryClient({
  products,
  movements,
}: {
  products: Product[];
  movements: Movement[];
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<string>("");
  const [editNote, setEditNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localProducts, setLocalProducts] = useState(products);

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setEditStock(String(p.stock));
    setEditNote("");
  };

  const saveStock = (p: Product) => {
    const newVal = Number(editStock);
    if (isNaN(newVal) || newVal < 0) {
      toast.error("Invalid stock value.");
      return;
    }
    startTransition(async () => {
      const res = await updateStock(p.id, newVal, editNote || undefined);
      if (res.ok) {
        setLocalProducts((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, stock: newVal } : x))
        );
        toast.success(`${p.name} stock updated to ${newVal}`);
        setEditId(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const totalStockUnits = localProducts.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = localProducts.filter((p) => p.stock > 0 && p.stock <= 3);
  const outOfStock = localProducts.filter((p) => p.stock === 0);

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
          Inventory Control
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor real-time stock levels, record manual adjustments, and review audit trails.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Total In-Stock Units</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-foreground">{totalStockUnits}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Across {localProducts.length} active SKUs</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-800">Low Stock SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-foreground">{lowStock.length}</div>
          <p className="text-[11px] text-muted-foreground mt-1">3 or fewer units remaining</p>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 to-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-800">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-foreground">{outOfStock.length}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Require immediate restocking</p>
        </div>
      </div>

      {/* Stock Levels Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Stock Levels by Product</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click adjust to update stock counts inline</p>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {localProducts.map((p) => {
            const isOut = p.stock === 0;
            const isLow = p.stock > 0 && p.stock <= 3;

            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-secondary/25 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU: {p.sku || "N/A"} {p.fabric ? `· Fabric: ${p.fabric}` : ""}
                  </p>
                </div>

                {editId === p.id ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-20 rounded-xl border border-primary bg-card px-3 py-1.5 font-mono text-xs outline-none shadow-xs"
                      autoFocus
                    />
                    <input
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Reason for adjustment…"
                      className="w-44 rounded-xl border border-border bg-card px-3 py-1.5 text-xs outline-none focus:border-primary shadow-xs"
                    />
                    <button
                      onClick={() => saveStock(p)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-xs"
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isOut
                          ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                          : isLow
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      }`}
                    >
                      {p.stock} units
                    </span>
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      Adjust
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement Audit History */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-bold text-foreground">Stock Movement Audit Log</h2>
          </div>
          <span className="text-xs text-muted-foreground">Last {movements.length} events</span>
        </div>

        {movements.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {movements.map((m) => {
              const isPositive = m.quantity > 0;
              return (
                <div key={m.id} className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium">{TYPE_LABELS[m.type] ?? m.type}</span>
                        {m.note ? ` · Note: "${m.note}"` : ""}
                        {m.createdByAdmin ? ` · By ${m.createdByAdmin.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-sm font-bold ${
                        isPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositive ? `+${m.quantity}` : m.quantity}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
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
