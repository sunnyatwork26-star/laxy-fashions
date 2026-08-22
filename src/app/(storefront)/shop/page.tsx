import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import { serializeProducts } from "@/lib/orderLogic";
import Link from "next/link";
import { Search, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Sarees",
  description: "Browse our complete collection of handpicked Banarasi, Kanjivaram, Chanderi, and Linen sarees.",
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    fabric?: string;
    occasion?: string;
    q?: string;
    sort?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = params.category || "";
  const fabricFilter = params.fabric || "";
  const occasionFilter = params.occasion || "";
  const searchQuery = params.q || "";
  const sortBy = params.sort || "newest";

  // Build Prisma filter query
  const where: any = {
    status: "ACTIVE",
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (fabricFilter) {
    where.fabric = { equals: fabricFilter, mode: "insensitive" };
  }

  if (occasionFilter) {
    where.occasion = { has: occasionFilter };
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { description: { contains: searchQuery, mode: "insensitive" } },
      { fabric: { contains: searchQuery, mode: "insensitive" } },
      { sku: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Order sorting
  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "price-low") orderBy = { basePrice: "asc" };
  if (sortBy === "price-high") orderBy = { basePrice: "desc" };

  const [rawProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const products = serializeProducts(rawProducts);

  const fabrics = ["Silk", "Cotton", "Chiffon", "Linen", "Georgette"];

  return (
    <div className="container-laxy py-10 space-y-8">
      {/* Header banner */}
      <div className="border-b border-border pb-6">
        <span className="eyebrow">Catalog</span>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mt-1">
          {categorySlug
            ? categories.find((c) => c.slug === categorySlug)?.name || "Saree Collection"
            : "All Sarees"}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Handpicked Indian sarees with rich fabrics, intricate zari work, and vibrant colors.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/shop"
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
              !categorySlug
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-border text-foreground"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}${fabricFilter ? `&fabric=${fabricFilter}` : ""}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                categorySlug === cat.slug
                  ? "bg-primary text-white"
                  : "bg-secondary hover:bg-border text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-border/60">
          {/* Search bar */}
          <div className="sm:col-span-6 relative">
            <form action="/shop" method="GET" className="flex items-center">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search by saree name, fabric, or color..."
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground text-xs rounded-xl outline-none border border-transparent focus:border-primary transition-colors"
                />
              </div>
            </form>
          </div>

          {/* Fabric Select */}
          <div className="sm:col-span-3">
            <form action="/shop" method="GET">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
              <select
                name="fabric"
                defaultValue={fabricFilter}
                className="w-full py-2.5 px-3 bg-secondary text-foreground text-xs rounded-xl outline-none border border-transparent focus:border-primary transition-colors"
              >
                <option value="">Filter by Fabric</option>
                {fabrics.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {/* Sort Select */}
          <div className="sm:col-span-3">
            <form action="/shop" method="GET">
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              {fabricFilter && <input type="hidden" name="fabric" value={fabricFilter} />}
              <select
                name="sort"
                defaultValue={sortBy}
                className="w-full py-2.5 px-3 bg-secondary text-foreground text-xs rounded-xl outline-none border border-transparent focus:border-primary transition-colors"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </form>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(categorySlug || fabricFilter || searchQuery) && (
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <span>Active filters:</span>
            {categorySlug && (
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                Category: {categorySlug}
              </span>
            )}
            {fabricFilter && (
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                Fabric: {fabricFilter}
              </span>
            )}
            {searchQuery && (
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                Search: "{searchQuery}"
              </span>
            )}
            <Link href="/shop" className="text-primary hover:underline ml-auto font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Clear All
            </Link>
          </div>
        )}
      </div>

      {/* Product List */}
      <div>
        <p className="text-xs text-muted-foreground mb-4">
          Showing <span className="font-semibold text-foreground">{products.length}</span> sarees
        </p>

        {products.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
            <h3 className="font-heading text-2xl font-bold text-foreground">No Sarees Found</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto">
              We couldn't find any sarees matching your filters. Try clearing your search query or selecting another category.
            </p>
            <div className="pt-2">
              <Link href="/shop" className="btn-maroon text-xs px-6 py-2.5">
                Reset Filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
