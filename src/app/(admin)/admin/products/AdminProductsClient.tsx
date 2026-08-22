"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package } from "lucide-react";
import { formatINR } from "@/lib/orderLogic";

const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"];

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
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-3xl text-accent">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground btn-press"
        >
          <Plus className="h-4 w-4" />
          New product
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, SKU, fabric…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">No products found.</p>
            <Link
              href="/admin/products/new"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((p) => {
              const imgs = p.images as string[];
              const basePriceNum = Number(p.basePrice);
              const salePriceNum = p.salePrice ? Number(p.salePrice) : null;
              const price =
                salePriceNum && salePriceNum > 0 && salePriceNum < basePriceNum
                  ? salePriceNum
                  : basePriceNum;

              return (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50"
                >
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary relative">
                    {imgs?.[0] && (
                      <Image
                        src={imgs[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.fabric || "—"} · {p.sku || "no SKU"} ·{" "}
                      {p.stock} in stock
                      {p.category && ` · ${p.category.name}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{formatINR(price)}</p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        p.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "ARCHIVED"
                          ? "bg-zinc-200 text-zinc-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
