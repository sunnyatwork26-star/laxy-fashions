"use client";

import { createContext, useContext, useMemo } from "react";
import { whatsappUrl } from "@/lib/orderLogic";

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  announcementText: string;
  announcementEnabled: boolean;
  freeShippingThreshold: number;
  codEnabled: boolean;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Laxy Fashions",
  storeTagline: "Handcrafted Luxury Sarees",
  supportEmail: "admin@laxyfashions.com",
  supportPhone: "919876543210",
  whatsappNumber: "919876543210",
  announcementText: "Complimentary Express Shipping Across India",
  announcementEnabled: true,
  freeShippingThreshold: 0,
  codEnabled: true,
};

interface StoreSettingsContextValue {
  settings: StoreSettings;
  getWhatsAppUrl: (message: string) => string;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  settings: DEFAULT_STORE_SETTINGS,
  getWhatsAppUrl: (msg: string) => whatsappUrl(msg, DEFAULT_STORE_SETTINGS.whatsappNumber),
});

export function StoreSettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<StoreSettings> | null;
}) {
  const mergedSettings: StoreSettings = useMemo(() => {
    return {
      ...DEFAULT_STORE_SETTINGS,
      ...(initialSettings || {}),
    };
  }, [initialSettings]);

  const value = useMemo(() => {
    return {
      settings: mergedSettings,
      getWhatsAppUrl: (message: string) =>
        whatsappUrl(message, mergedSettings.whatsappNumber),
    };
  }, [mergedSettings]);

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_STORE_SETTINGS,
      getWhatsAppUrl: (msg: string) =>
        whatsappUrl(msg, DEFAULT_STORE_SETTINGS.whatsappNumber),
    };
  }
  return context;
}
