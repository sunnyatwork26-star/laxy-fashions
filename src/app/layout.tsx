import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Laxy Fashions — Handpicked Sarees",
    template: "%s | Laxy Fashions",
  },
  description:
    "Laxy Fashions — Handpicked Indian sarees. Festive, wedding, and everyday sarees. Order online and confirm directly on WhatsApp.",
  keywords: ["sarees", "Indian sarees", "festive sarees", "wedding sarees", "Laxy Fashions", "Banarasi silk", "Kanjivaram"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Laxy Fashions",
    title: "Laxy Fashions — Handpicked Sarees",
    description: "Handpicked Indian sarees. Order online and confirm directly on WhatsApp.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7A1E1E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
