"use client";

import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/orderLogic";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartDrawer() {
  const { items, updateQuantity, removeItem, isDrawerOpen, setDrawerOpen, subtotal } =
    useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-border animate-fade-in">
          {/* Drawer Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-xl font-bold text-foreground">
                Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body — Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-border/60">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Your bag is empty
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Looks like you haven&apos;t added any sarees to your shopping bag yet.
                </p>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="btn-maroon text-xs px-6 py-2.5"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="pt-4 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="90px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="font-heading font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {formatINR(item.price)}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border border-border bg-secondary">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-card rounded-full"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-card rounded-full"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-xs text-foreground">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-border bg-card space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Estimated Total</span>
                <span className="font-heading text-2xl font-bold text-foreground">
                  {formatINR(subtotal)}
                </span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full btn-maroon py-3 text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full inline-flex items-center justify-center text-xs font-semibold text-primary hover:underline py-2"
                >
                  View Shopping Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
