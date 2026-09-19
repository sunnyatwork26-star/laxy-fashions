"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getPublicStoreSettings } from "@/server/actions/settings";

export default function AnnouncementBar() {
  const [settings, setSettings] = useState<{
    announcementText?: string;
    announcementEnabled?: boolean;
  }>({
    announcementText: "Complimentary Express Shipping Across India",
    announcementEnabled: true,
  });

  useEffect(() => {
    let mounted = true;
    getPublicStoreSettings()
      .then((data) => {
        if (mounted && data) {
          setSettings(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!settings.announcementEnabled || !settings.announcementText) {
    return null;
  }

  return (
    <aside aria-label="Announcement" className="bg-primary text-primary-foreground py-2 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 relative z-50 border-b border-primary-foreground/10 animate-fade-in">
      <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse shrink-0" />
      <span>{settings.announcementText}</span>
    </aside>
  );
}
