"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  productId: string;
  name: string;
  productName: string;
  slug: string;
  sku?: string;
  price: number;
  unitPrice: number;
  image: string;
  stock?: number;
  quantity: number;
}

export interface AddItemInput {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  image: string;
  stock?: number;
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: AddItemInput) => void;
  add: (
    product: {
      id: string;
      name: string;
      slug: string;
      sku?: string;
      basePrice: number;
      salePrice?: number | null;
      images?: string[];
    },
    quantity?: number
  ) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "laxy_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (input: AddItemInput) => {
    const qty = input.quantity ?? 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === input.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === input.productId
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: input.productId,
          name: input.name,
          productName: input.name,
          slug: input.slug,
          sku: input.sku ?? "",
          price: input.price,
          unitPrice: input.price,
          image: input.image,
          stock: input.stock ?? 10,
          quantity: qty,
        },
      ];
    });
    setDrawerOpen(true);
  };

  const add = (
    product: {
      id: string;
      name: string;
      slug: string;
      sku?: string;
      basePrice: number;
      salePrice?: number | null;
      images?: string[];
    },
    quantity = 1
  ) => {
    const unitPrice =
      product.salePrice != null &&
      product.salePrice > 0 &&
      product.salePrice < product.basePrice
        ? product.salePrice
        : product.basePrice;

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: unitPrice,
      image: product.images?.[0] ?? "/products/banarasi-red.png",
      quantity,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const count = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.price ?? i.unitPrice) * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        addItem,
        add,
        updateQuantity,
        setQty: updateQuantity,
        removeItem,
        clearCart,
        clear: clearCart,
        drawerOpen,
        isDrawerOpen: drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
