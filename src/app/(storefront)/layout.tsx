import { CartProvider } from "@/context/CartContext";
import { StoreSettingsProvider } from "@/context/StoreSettingsContext";
import { getPublicStoreSettings } from "@/server/actions/settings";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import CartDrawer from "@/components/storefront/CartDrawer";
import { Toaster } from "sonner";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicStoreSettings();

  return (
    <StoreSettingsProvider initialSettings={settings}>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </div>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(228 26% 9%)",
              border: "1px solid hsl(228 18% 18%)",
              color: "hsl(32 30% 92%)",
            },
          }}
        />
      </CartProvider>
    </StoreSettingsProvider>
  );
}
