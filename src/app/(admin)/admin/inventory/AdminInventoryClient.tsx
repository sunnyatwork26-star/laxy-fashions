"use client";

import { useState, useTransition } from "react";
import { updateStock } from "@/server/actions/products";
import { formatINR } from "@/lib/orderLogic";
import { Loader2, Save } from "lucide-react";
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
  SALE_CONFIRMATION: "Sale",
  CANCELLATION_RELEASE: "Cancellation restore",
  MANUAL_ADJUSTMENT: "Manual adjustment",
  RESTOCK: "Restock",
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

  const lowStock = localProducts.filter((p) => p.stock <= 3);
  const ok = localProducts.filter((p) => p.stock > 3);

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <h1 className="font-heading text-3xl text-accent">Inventory</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Adjust stock levels and view movement history.
      </p>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-600/40 bg-amber-900/10 p-4">
          <p className="text-sm font-medium text-amber-400">
            {lowStock.length} product{lowStock.length > 1 ? "s" : ""} with 3 or fewer units
          </p>
        </div>
      )}

      {/* Product stock table */}
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-heading text-lg">Stock levels</h2>
        </div>
        <div className="divide-y divide-border">
          {localProducts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.sku} {p.fabric ? `· ${p.fabric}` : ""}
                </p>
              </div>

              {editId === p.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => saveStock(p)}
                    disabled={isPending}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60 flex items-center gap-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                      p.stock === 0
                        ? "bg-rose-100 text-rose-800"
                        : p.stock <= 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {p.stock} in stock
                  </span>
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs text-primary hover:underline"
                  >
                    Adjust
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Movement history */}
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-heading text-lg">Recent movements</h2>
        </div>
        {movements.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No movements yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{m.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[m.type] ?? m.type}
                    {m.note ? ` — ${m.note}` : ""}
                    {m.createdByAdmin ? ` · ${m.createdByAdmin.name}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-sm font-medium ${
                      m.quantity > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
