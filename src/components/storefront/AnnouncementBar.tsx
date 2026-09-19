"use client";

import { Sparkles } from "lucide-react";
import { useStoreSettings } from "@/context/StoreSettingsContext";

export default function AnnouncementBar() {
  const { settings } = useStoreSettings();

  if (!settings.announcementEnabled || !settings.announcementText) {
    return null;
  }

  return (
    <aside
      aria-label="Announcement"
      className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 relative z-50 border-b border-primary-foreground/10 animate-fade-in"
    >
      <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse shrink-0" />
      <span>{settings.announcementText}</span>
    </aside>
  );
}
