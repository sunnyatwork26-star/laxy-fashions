"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, MessageCircle, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/shop", label: "All Sarees" },
  { href: "/shop?category=silk-sarees", label: "Silk Sarees" },
  { href: "/shop?category=cotton-sarees", label: "Cotton Sarees" },
  { href: "/shop?category=designer-sarees", label: "Designer" },
  { href: "/shop?category=festive", label: "Festive" },
];

export default function Header() {
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mountedRef = useRef(false);
  const { items, setDrawerOpen } = useCart();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    mountedRef.current = true;
    const onScroll = () => setStuck(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  if (prevPathRef.current !== pathname) {
    prevPathRef.current = pathname;
    if (menuOpen) setMenuOpen(false);
  }

  const totalItems = mountedRef.current ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919876543210";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        stuck
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border/80 py-3"
          : "bg-background border-b border-border/60 py-4"
      }`}
    >
      <div className="container-laxy flex items-center justify-between gap-4">
        {/* Brand logo & title */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-primary/5 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
            <Image
              src="/logo.png"
              alt="Laxy Fashions Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-none">
              Laxy Fashions
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-sans mt-0.5">
              Handpicked Sarees
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:text-primary hover:-translate-y-0.5 ${
                pathname === link.href ? "text-primary" : "text-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
              "Hello Laxy Fashions! I have an inquiry about your sarees."
            )}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 px-3.5 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Us</span>
          </a>

          {/* Cart Trigger Button */}
          <button
            id="header-cart-btn"
            onClick={() => setDrawerOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-secondary transition-all duration-200 text-foreground hover:scale-105 active:scale-95"
            aria-label={`Shopping Cart with ${totalItems} items`}
          >
            <ShoppingBag className="w-5 h-5 text-foreground/90" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center animate-fade-in shadow-md">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-white animate-fade-in">
          <nav className="container-laxy py-4 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-wider py-2 text-foreground hover:text-primary border-b border-border/40 last:border-none"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                  "Hello Laxy Fashions! I have an inquiry about your sarees."
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 py-2.5 rounded-full"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
