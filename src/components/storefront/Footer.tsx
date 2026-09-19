"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShieldCheck, Heart, Phone, Mail } from "lucide-react";
import { useStoreSettings } from "@/context/StoreSettingsContext";

export default function Footer() {
  const { settings, getWhatsAppUrl } = useStoreSettings();
  const waUrl = getWhatsAppUrl(`Hello ${settings.storeName}! I have an inquiry about your saree collection.`);

  // Format phone display nicely
  const displayPhone = settings.supportPhone || settings.whatsappNumber || "919876543210";
  const formattedPhone = displayPhone.startsWith("91") && displayPhone.length === 12
    ? `+91 ${displayPhone.slice(2, 7)} ${displayPhone.slice(7)}`
    : displayPhone;

  return (
    <footer className="bg-card border-t border-border mt-auto pt-12 pb-8">
      <div className="container-laxy">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border">
          {/* Brand & About */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-primary/5 flex items-center justify-center p-1">
                <Image
                  src="/logo.png"
                  alt={`${settings.storeName} Logo`}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {settings.storeName}
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {settings.storeTagline || "Curated collection of authentic Indian sarees — Banarasi, Kanjivaram, Chanderi, and Linen. Handpicked for weddings, festivals, and special moments."}
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-full transition-colors w-fit"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{formattedPhone}</span>
              </a>
              {settings.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{settings.supportEmail}</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="font-heading text-lg font-semibold text-foreground">Categories</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/shop?category=silk-sarees" className="hover:text-primary transition-colors">
                  Silk Sarees (Banarasi & Kanjivaram)
                </Link>
              </li>
              <li>
                <Link href="/shop?category=cotton-sarees" className="hover:text-primary transition-colors">
                  Chanderi & Handloom Cotton
                </Link>
              </li>
              <li>
                <Link href="/shop?category=designer-sarees" className="hover:text-primary transition-colors">
                  Designer & Georgette Sarees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=festive" className="hover:text-primary transition-colors">
                  Festive & Wedding Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-heading text-lg font-semibold text-foreground">Customer Care</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping & Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors">
                  Returns & Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-3">
            <h4 className="font-heading text-lg font-semibold text-foreground">Why {settings.storeName}</h4>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>100% Verified Quality & Direct WhatsApp Support</span>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Zero Online Payment Risk — Pay after Order Confirmation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> for Indian Saree Lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
