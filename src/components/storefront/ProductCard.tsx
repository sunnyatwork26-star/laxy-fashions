"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/orderLogic";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: unknown;
    salePrice?: unknown;
    fabric?: string | null;
    stock: number;
    status: string;
    images: unknown;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const basePriceNum = Number(product.basePrice);
  const salePriceNum = product.salePrice ? Number(product.salePrice) : null;
  const price =
    salePriceNum && salePriceNum > 0 && salePriceNum < basePriceNum
      ? salePriceNum
      : basePriceNum;
  const onSale = price !== basePriceNum;
  const outOfStock = product.stock <= 0 || product.status !== "ACTIVE";
  const images = (Array.isArray(product.images) ? product.images : []) as string[];
  const coverImage = images[0] || "/products/banarasi-red.png";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: price,
      image: coverImage,
      stock: product.stock,
      quantity: 1,
    });
  };

  return (
    <div className="group rounded-2xl border border-border/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Image container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-[3/4] overflow-hidden bg-secondary block">
        <Image
          src={coverImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {onSale && (
            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              {Math.round(((basePriceNum - price) / basePriceNum) * 100)}% Off
            </span>
          )}
          {product.fabric && (
            <span className="bg-white/90 backdrop-blur-md text-foreground text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full shadow-sm border border-border/40">
              {product.fabric}
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-white text-foreground font-semibold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-primary">
                {formatINR(price)}
              </span>
              {onSale && (
                <span className="text-xs text-muted-foreground line-through font-normal">
                  {formatINR(basePriceNum)}
                </span>
              )}
            </div>
            {product.stock > 0 && product.stock <= 3 && (
              <span className="text-[10px] text-amber-700 font-semibold">
                Only {product.stock} left
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="p-2.5 rounded-full bg-secondary hover:bg-primary hover:text-white text-foreground transition-colors disabled:opacity-40 disabled:hover:bg-secondary disabled:hover:text-foreground shrink-0"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
