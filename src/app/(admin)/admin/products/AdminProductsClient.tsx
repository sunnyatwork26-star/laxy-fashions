"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package, ChevronRight, X, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/orderLogic";

const STATUSES = ["", "ACTIVE", "INACTIVE", "ARCHIVED"];

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  fabric?: string | null;
  stock: number;
  status: string;
  basePrice: number;
  salePrice?: number | null;
  images: string[];
  category?: { name: string } | null;
}

export default function AdminProductsClient({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    let list = [...products];
    if (status) list = list.filter((p) => p.status === status);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((p) =>
        (p.name + " " + (p.sku ?? "") + " " + (p.fabric ?? ""))
          .toLowerCase()
          .includes(t)
      );
    }
    return list;
  }, [products, q, status]);

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
            Products Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your saree collections, pricing, inventory, and media.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by product name, fabric, SKU…"
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

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary shadow-xs cursor-pointer"
        >
          <option value="">All Statuses ({products.length})</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Product List */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No products found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            <Link
              href="/admin/products/new"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((p) => {
              const imgs = p.images as string[];
              const basePriceNum = Number(p.basePrice);
              const salePriceNum = p.salePrice ? Number(p.salePrice) : null;
              const hasSale = salePriceNum && salePriceNum > 0 && salePriceNum < basePriceNum;
              const activePrice = hasSale ? salePriceNum : basePriceNum;

              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= 3;

              return (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/25 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-secondary border border-border/60 relative group-hover:border-primary/40 transition-colors">
                    {imgs?.[0] ? (
                      <Image
                        src={imgs[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-6 w-6 opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      {p.category && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/40">
                          {p.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.fabric || "Fabric: —"} · SKU: {p.sku || "N/A"}
                    </p>
                  </div>

                  {/* Stock Pill */}
                  <div className="hidden sm:block text-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isOutOfStock
                          ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                          : isLowStock
                          ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      }`}
                    >
                      {isLowStock && <AlertCircle className="h-3 w-3" />}
                      {p.stock} units
                    </span>
                  </div>

                  {/* Price & Status */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-bold text-foreground">
                      {formatINR(activePrice)}
                      {hasSale && (
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground line-through">
                          {formatINR(basePriceNum)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border ${
                        p.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                          : p.status === "ARCHIVED"
                          ? "bg-zinc-500/10 text-zinc-700 border-zinc-500/20"
                          : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground px-1">
        Showing {filtered.length} of {products.length} products
      </div>
    </div>
  );
}
