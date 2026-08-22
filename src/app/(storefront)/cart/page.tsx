"use client";

import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/orderLogic";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-laxy py-16 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Explore our handpicked collection of Banarasi, Kanjivaram, and Chanderi sarees.
        </p>
        <div className="pt-2">
          <Link href="/shop" className="btn-maroon text-xs px-7 py-3">
            Browse Saree Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-laxy py-10 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="eyebrow">Shopping Bag</span>
          <h1 className="font-heading text-4xl font-bold text-foreground mt-1">
            Review Your Items ({items.reduce((s, i) => s + i.quantity, 0)})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex gap-4 sm:gap-6 items-center"
            >
              {/* Thumbnail */}
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-heading font-bold text-xl text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {item.name}
                </Link>
                <p className="text-sm font-semibold text-primary">
                  {formatINR(item.price)}
                </p>

                {/* Quantity Controller */}
                <div className="pt-3 flex items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-border bg-secondary">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-card rounded-full"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-card rounded-full"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="text-right shrink-0">
                <span className="font-heading font-bold text-xl text-foreground">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-foreground border-b border-border pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-700">Free Delivery</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-baseline">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-heading text-3xl font-bold text-primary">
                {formatINR(subtotal)}
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/checkout"
              className="w-full btn-maroon py-3.5 text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-center text-muted-foreground">
              No online payment required. Order is confirmed manually on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
