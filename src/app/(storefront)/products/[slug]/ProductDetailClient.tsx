"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react";
import { formatINR, buildWhatsAppMessage, whatsappUrl } from "@/lib/orderLogic";
import { useCart } from "@/context/CartContext";
import { useStoreSettings } from "@/context/StoreSettingsContext";
import { toast } from "sonner";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    fabric?: string | null;
    occasion: string[];
    basePrice: unknown;
    salePrice?: unknown;
    sku: string;
    stock: number;
    status: string;
    images: unknown;
    category?: { name: string; slug: string } | null;
  };
}

export default function ProductDetailClient({ product }: ProductDetailProps) {
  const { addItem, setDrawerOpen } = useCart();
  const { getWhatsAppUrl } = useStoreSettings();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const basePriceNum = Number(product.basePrice);
  const salePriceNum = product.salePrice ? Number(product.salePrice) : null;
  const price =
    salePriceNum && salePriceNum > 0 && salePriceNum < basePriceNum
      ? salePriceNum
      : basePriceNum;
  const onSale = price !== basePriceNum;
  const outOfStock = product.stock <= 0 || product.status !== "ACTIVE";

  const images = (Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ["/products/banarasi-red.png"]) as string[];

  const currentImage = images[selectedImageIndex] || images[0];

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: price,
      image: currentImage,
      stock: product.stock,
      quantity,
    });
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: price,
      image: currentImage,
      stock: product.stock,
      quantity,
    });
    setDrawerOpen(true);
  };

  // WhatsApp quick inquire link using dynamic store settings
  const waDirectMessage = buildWhatsAppMessage({
    orderNumber: "INQUIRY",
    customerName: "Customer",
    items: [{ quantity, productNameSnapshot: product.name, unitPriceSnapshot: price }],
    total: price * quantity,
  });
  const waLink = getWhatsAppUrl(waDirectMessage);

  return (
    <div className="container-laxy py-10 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-primary transition-colors">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-secondary border border-border/80 shadow-md">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
            {onSale && (
              <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                Sale
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-primary shadow-sm scale-105"
                      : "border-border/60 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="90px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Title & SKU */}
          <div className="space-y-2 border-b border-border pb-5">
            <div className="flex items-center gap-2">
              {product.fabric && (
                <span className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
                  {product.fabric}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-primary">
              {formatINR(price)}
            </span>
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatINR(basePriceNum)}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          <div>
            {outOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            ) : product.stock <= 3 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Hurry! Only {product.stock} units left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> In Stock & Ready for Dispatch
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Quantity Selector */}
          {!outOfStock && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Quantity
              </label>
              <div className="inline-flex items-center rounded-full border border-border bg-secondary p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card transition-colors text-foreground"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card transition-colors text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-full btn-maroon py-3.5 text-sm font-semibold shadow-md disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Shopping Bag</span>
            </button>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border-1.5 border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 py-3.5 text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire & Buy Directly on WhatsApp</span>
            </a>
          </div>

          {/* Store Guarantees */}
          <div className="border-t border-border pt-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>100% Quality Inspected before dispatch</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span>Free Express Delivery across India</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <RotateCcw className="w-4 h-4 text-primary shrink-0" />
              <span>Easy Return / Replacement assistance via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
