"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/orderLogic";
import { createOrder } from "@/server/actions/orders";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    addressLine: "",
    area: "",
    landmark: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    note: "",
  });

  if (items.length === 0) {
    return (
      <div className="container-laxy py-16 text-center space-y-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs text-muted-foreground">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link href="/shop" className="btn-maroon text-xs px-6 py-2.5 inline-block">
          Explore Collection
        </Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((fe) => ({ ...fe, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        addressLine: form.addressLine,
        area: form.area,
        landmark: form.landmark || undefined,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        note: form.note || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const res = await createOrder(payload);

      if (!res.ok) {
        setError(res.error);
        if (res.fields) setFieldErrors(res.fields);
        toast.error(res.error);
        setLoading(false);
        return;
      }

      // Success
      clearCart();
      toast.success("Order submitted successfully!");
      router.push(`/order/${res.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      toast.error("Checkout failed.");
      setLoading(false);
    }
  };

  return (
    <div className="container-laxy py-10 space-y-8">
      <div className="border-b border-border pb-4">
        <span className="eyebrow">Checkout</span>
        <h1 className="font-heading text-4xl font-bold text-foreground mt-1">
          Delivery Details
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your name and address below to place your order. No online payment required.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form fields */}
        <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-foreground border-b border-border pb-3">
            Contact & Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                required
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="e.g. Ananya Sharma"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
              {fieldErrors.customerName && (
                <span className="text-[11px] text-destructive mt-1 block">
                  {fieldErrors.customerName}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Mobile Number (WhatsApp) *
              </label>
              <input
                required
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
              {fieldErrors.phone && (
                <span className="text-[11px] text-destructive mt-1 block">
                  {fieldErrors.phone}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Door / Building / Street Address *
            </label>
            <input
              required
              type="text"
              name="addressLine"
              value={form.addressLine}
              onChange={handleChange}
              placeholder="e.g. Flat 4B, Lotus Apartments, 12th Main Road"
              className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
            />
            {fieldErrors.addressLine && (
              <span className="text-[11px] text-destructive mt-1 block">
                {fieldErrors.addressLine}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Area / Colony *
              </label>
              <input
                required
                type="text"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="e.g. Anna Nagar"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
              {fieldErrors.area && (
                <span className="text-[11px] text-destructive mt-1 block">
                  {fieldErrors.area}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Landmark (Optional)
              </label>
              <input
                type="text"
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                placeholder="e.g. Opp. City Bank"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                City *
              </label>
              <input
                required
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Chennai"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                State *
              </label>
              <input
                required
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="e.g. Tamil Nadu"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Pincode *
              </label>
              <input
                required
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="600001"
                className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
              {fieldErrors.pincode && (
                <span className="text-[11px] text-destructive mt-1 block">
                  {fieldErrors.pincode}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Special Note / Custom Instructions (Optional)
            </label>
            <textarea
              name="note"
              rows={2}
              value={form.note}
              onChange={handleChange}
              placeholder="e.g. Gift wrapping request or specific delivery timing"
              className="w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <h2 className="font-heading text-2xl font-bold text-foreground border-b border-border pb-3">
            Items in Order ({items.length})
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-border/40 pr-1">
            {items.map((item) => (
              <div key={item.productId} className="pt-3 first:pt-0 flex gap-3 items-center">
                <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-secondary shrink-0 border">
                  <Image src={item.image} alt={item.name} fill sizes="60px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-semibold text-sm text-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatINR(item.price)}
                  </p>
                </div>
                <span className="font-bold text-xs text-foreground">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-foreground">Total Payable</span>
              <span className="font-heading text-3xl font-bold text-primary">
                {formatINR(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ✓ Free delivery included across India
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-maroon py-4 text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <span>Place Order & Confirm on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Zero online payment risk — Pay after verification</span>
          </div>
        </div>
      </form>
    </div>
  );
}
