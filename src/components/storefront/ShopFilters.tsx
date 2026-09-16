"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

const OCCASIONS = ["Festive", "Wedding", "Casual", "Work", "Puja"];
const FABRICS = ["Silk", "Cotton", "Chiffon", "Linen", "Net", "Banarasi", "Chanderi", "Georgette"];

export default function ShopFilters({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentOccasion = params.get("occasion") ?? "";
  const currentFabric = params.get("fabric") ?? "";
  const currentSort = params.get("sort") ?? "newest";
  const currentInStock = params.get("inStock") === "1";

  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (!value) p.delete(key);
    else p.set(key, value);
    router.push(`${pathname}?${p.toString()}`);
    setOpen(false);
  };

  const clear = () => {
    router.push(pathname);
    setOpen(false);
  };

  const hasFilters = currentOccasion || currentFabric || currentInStock;

  const filterContent = (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <div className="eyebrow mb-2">Sort</div>
        <select
          value={currentSort}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {/* Occasion */}
      <div>
        <div className="eyebrow mb-2">Occasion</div>
        <div className="space-y-1.5">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() =>
                update("occasion", currentOccasion === o ? "" : o)
              }
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                currentOccasion === o
                  ? "text-primary font-medium"
                  : "text-foreground/75 hover:text-primary"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <div className="eyebrow mb-2">Fabric</div>
        <div className="space-y-1.5">
          {FABRICS.map((f) => (
            <button
              key={f}
              onClick={() =>
                update("fabric", currentFabric === f ? "" : f)
              }
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                currentFabric === f
                  ? "text-primary font-medium"
                  : "text-foreground/75 hover:text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* In stock */}
      <div>
        <div className="eyebrow mb-2">Availability</div>
        <button
          onClick={() =>
            update("inStock", currentInStock ? "" : "1")
          }
          className={`text-sm px-2 py-1.5 rounded transition-colors ${
            currentInStock
              ? "text-primary font-medium"
              : "text-foreground/75 hover:text-primary"
          }`}
        >
          In stock only
        </button>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </button>
      )}
    </div>
  );

  if (!mobile) return filterContent;

  return (
    <div className="lg:hidden mb-5">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter &amp; sort
        {hasFilters && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[80%] max-w-xs bg-background shadow-xl p-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl">Filter</h2>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </div>
  );
}

