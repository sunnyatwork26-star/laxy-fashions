"use client";

import { useState, useTransition } from "react";
import {
  Store,
  Megaphone,
  CreditCard,
  Lock,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MessageCircle,
  Truck,
  ShieldCheck,
  UserPlus,
  Power,
  Sparkles,
  ExternalLink,
  Info,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  updateStoreSettings,
  updateAdminProfile,
  createStaffAdmin,
  toggleAdminStatus,
} from "@/server/actions/settings";
import { formatINR } from "@/lib/orderLogic";

interface StoreSettingsData {
  id: string;
  storeName: string;
  storeTagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  announcementText: string;
  announcementEnabled: boolean;
  freeShippingThreshold: number;
  orderPrefix: string;
  lowStockThreshold: number;
  codEnabled: boolean;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StaffAdmin {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface Props {
  initialSettings: StoreSettingsData;
  currentUser: CurrentUser;
  initialStaff: StaffAdmin[];
  isOwner: boolean;
}

type TabType = "store" | "announcement" | "commerce" | "security" | "staff";

export default function AdminSettingsClient({
  initialSettings,
  currentUser,
  initialStaff,
  isOwner,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("store");
  const [isPending, startTransition] = useTransition();

  // Store Settings Form State
  const [storeSettings, setStoreSettings] = useState<StoreSettingsData>(initialSettings);
  const [storeMsg, setStoreMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile / Password State
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Staff State
  const [staffList, setStaffList] = useState<StaffAdmin[]>(initialStaff);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"STAFF" | "OWNER">("STAFF");
  const [staffMsg, setStaffMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle Store Settings Save
  const handleSaveStoreSettings = () => {
    setStoreMsg(null);
    startTransition(async () => {
      try {
        const res = await updateStoreSettings({
          storeName: storeSettings.storeName,
          storeTagline: storeSettings.storeTagline,
          supportEmail: storeSettings.supportEmail,
          supportPhone: storeSettings.supportPhone,
          whatsappNumber: storeSettings.whatsappNumber,
          announcementText: storeSettings.announcementText,
          announcementEnabled: storeSettings.announcementEnabled,
          freeShippingThreshold: Number(storeSettings.freeShippingThreshold) || 0,
          orderPrefix: storeSettings.orderPrefix.trim().toUpperCase() || "LF",
          lowStockThreshold: Number(storeSettings.lowStockThreshold) || 3,
          codEnabled: storeSettings.codEnabled,
        });

        if (res.ok && res.settings) {
          setStoreSettings(res.settings as StoreSettingsData);
          setStoreMsg({ type: "success", text: "Store settings saved to database successfully." });
        } else {
          setStoreMsg({ type: "error", text: res.error || "Failed to update settings." });
        }
      } catch (err: any) {
        setStoreMsg({ type: "error", text: err.message || "An unexpected error occurred." });
      }
    });
  };

  // Handle Profile & Password Save
  const handleSaveProfile = () => {
    setProfileMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateAdminProfile({
          name: profileName,
          email: profileEmail,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        });

        if (res.ok) {
          setProfileMsg({ type: "success", text: "Admin profile updated successfully." });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          setProfileMsg({ type: "error", text: res.error || "Failed to update profile." });
        }
      } catch (err: any) {
        setProfileMsg({ type: "error", text: err.message || "An unexpected error occurred." });
      }
    });
  };

  // Handle Add Staff
  const handleCreateStaff = () => {
    setStaffMsg(null);
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      setStaffMsg({ type: "error", text: "Please fill in all staff fields." });
      return;
    }

    startTransition(async () => {
      try {
        const res = await createStaffAdmin({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          role: newStaffRole,
        });

        if (res.ok && res.admin) {
          setStaffList((prev) => [
            ...prev,
            {
              id: res.admin!.id,
              name: res.admin!.name,
              email: res.admin!.email,
              role: res.admin!.role as "OWNER" | "STAFF",
              status: res.admin!.status as "ACTIVE" | "INACTIVE",
              lastLoginAt: null,
              createdAt: new Date(),
            },
          ]);
          setNewStaffName("");
          setNewStaffEmail("");
          setNewStaffPassword("");
          setShowAddStaff(false);
          setStaffMsg({ type: "success", text: `Staff admin ${res.admin!.name} created.` });
        } else {
          setStaffMsg({ type: "error", text: res.error || "Failed to create staff admin." });
        }
      } catch (err: any) {
        setStaffMsg({ type: "error", text: err.message || "An unexpected error occurred." });
      }
    });
  };

  // Handle Toggle Staff Status
  const handleToggleStaff = (staffId: string, currentStatus: "ACTIVE" | "INACTIVE") => {
    setStaffMsg(null);
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    startTransition(async () => {
      try {
        const res = await toggleAdminStatus(staffId, newStatus);
        if (res.ok) {
          setStaffList((prev) =>
            prev.map((s) => (s.id === staffId ? { ...s, status: newStatus } : s))
          );
          setStaffMsg({
            type: "success",
            text: `Staff member is now ${newStatus.toLowerCase()}.`,
          });
        } else {
          setStaffMsg({ type: "error", text: res.error || "Action failed." });
        }
      } catch (err: any) {
        setStaffMsg({ type: "error", text: err.message || "An unexpected error occurred." });
      }
    });
  };

  const navTabs = [
    { id: "store", label: "Store & WhatsApp", icon: Store },
    { id: "announcement", label: "Announcement Bar", icon: Megaphone },
    { id: "commerce", label: "Commerce Rules", icon: CreditCard },
    { id: "security", label: "Profile & Security", icon: Lock },
    ...(isOwner ? [{ id: "staff", label: "Staff & Roles", icon: Users }] : []),
  ] as const;

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Store Settings
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Dynamic DB Config
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure live storefront rules, branding, WhatsApp integration, and admin privileges.
          </p>
        </div>

        {/* Global Action / Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-border/80 bg-card text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected to Neon DB
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Configuration
          </p>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setStoreMsg(null);
                  setProfileMsg(null);
                  setStaffMsg(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  {tab.label}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 opacity-60 ${active ? "text-primary-foreground" : ""}`} />
              </button>
            );
          })}

          {/* Quick Helper Box */}
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 mt-6 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Info className="h-3.5 w-3.5 text-primary" />
              Real-time Sync
            </div>
            <p className="leading-relaxed text-[11px]">
              Changes made here are persisted in PostgreSQL and revalidated instantly across the storefront.
            </p>
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: STORE & WHATSAPP */}
          {activeTab === "store" && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-border/40 pb-4">
                <h2 className="font-heading text-xl font-bold text-foreground">Store & WhatsApp Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Brand name, customer support touchpoints, and instant WhatsApp chat routing.
                </p>
              </div>

              {storeMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    storeMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800"
                  }`}
                >
                  {storeMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {storeMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                    placeholder="e.g. Laxy Fashions"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Store Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={storeSettings.storeTagline}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeTagline: e.target.value })}
                    placeholder="e.g. Handcrafted Luxury Sarees"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Support Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={storeSettings.supportEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                    placeholder="e.g. support@laxyfashions.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Support Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={storeSettings.supportPhone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, supportPhone: e.target.value })}
                    placeholder="e.g. 919876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      WhatsApp Ordering & Helpline Number
                    </label>
                    <span className="text-[11px] text-muted-foreground">Country code included (e.g. 919876543210)</span>
                  </div>
                  <input
                    type="text"
                    value={storeSettings.whatsappNumber}
                    onChange={(e) => setStoreSettings({ ...storeSettings, whatsappNumber: e.target.value })}
                    placeholder="919876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />

                  {/* WhatsApp Direct Test Box */}
                  <div className="mt-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600/15 flex items-center justify-center text-emerald-700">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-emerald-900 font-medium">
                        Live link: <code className="font-mono text-[11px] font-bold">wa.me/{storeSettings.whatsappNumber || "919876543210"}</code>
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/${storeSettings.whatsappNumber}?text=Hi%20${encodeURIComponent(storeSettings.storeName)}%2C%20I%20have%20an%20order%20inquiry`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Test Link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving changes..." : "Save Store Details"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENT BAR */}
          {activeTab === "announcement" && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-border/40 pb-4">
                <h2 className="font-heading text-xl font-bold text-foreground">Announcement Bar Configuration</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Top promotional ribbon visible across every page of your storefront.
                </p>
              </div>

              {storeMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    storeMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800"
                  }`}
                >
                  {storeMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {storeMsg.text}
                </div>
              )}

              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  Live Storefront Preview
                </label>
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2 overflow-hidden">
                  {storeSettings.announcementEnabled ? (
                    <div className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-center text-xs font-medium tracking-wide shadow-xs flex items-center justify-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                      <span>{storeSettings.announcementText || "Complimentary Express Shipping Across India"}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-card p-3 text-center text-xs text-muted-foreground">
                      Announcement Bar is currently disabled (hidden from storefront)
                    </div>
                  )}
                  <div className="px-2 py-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Header Navigation Container (Preview)</span>
                    <span className="font-semibold text-foreground">{storeSettings.storeName}</span>
                  </div>
                </div>
              </div>

              {/* Announcement Enable Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-secondary/20">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-foreground">Enable Announcement Ribbon</div>
                  <div className="text-xs text-muted-foreground">
                    Toggle visibility of the top banner on all storefront pages
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.announcementEnabled}
                    onChange={(e) =>
                      setStoreSettings({ ...storeSettings, announcementEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Announcement Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                  Banner Text Message
                </label>
                <textarea
                  rows={2}
                  value={storeSettings.announcementText}
                  onChange={(e) =>
                    setStoreSettings({ ...storeSettings, announcementText: e.target.value })
                  }
                  placeholder="e.g. Complimentary Express Shipping Across India on All Orders"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  Keep it punchy (under 120 characters recommended for mobile devices).
                </p>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Announcement Settings"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCE RULES */}
          {activeTab === "commerce" && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-border/40 pb-4">
                <h2 className="font-heading text-xl font-bold text-foreground">Commerce & Inventory Rules</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shipping thresholds, order prefix formatting, low stock alert triggers, and payment methods.
                </p>
              </div>

              {storeMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    storeMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800"
                  }`}
                >
                  {storeMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {storeMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Free Shipping Threshold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    Free Shipping Order Minimum (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={storeSettings.freeShippingThreshold}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          freeShippingThreshold: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Set to <code className="font-mono font-bold">0</code> for free shipping on all orders.
                  </p>
                </div>

                {/* Low Stock Alert Threshold */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Low Stock Threshold (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={storeSettings.lowStockThreshold}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        lowStockThreshold: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Products with stock at or below this number trigger low-stock alerts.
                  </p>
                </div>

                {/* Order ID Prefix */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    Order Number Prefix
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={storeSettings.orderPrefix}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        orderPrefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background font-mono text-sm uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Example format: <span className="font-mono font-bold">{storeSettings.orderPrefix || "LF"}-1042</span>
                  </p>
                </div>

                {/* COD Toggle */}
                <div className="flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-foreground">Cash on Delivery (COD)</div>
                      <div className="text-[11px] text-muted-foreground">Enable COD at checkout</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeSettings.codEnabled}
                        onChange={(e) =>
                          setStoreSettings({ ...storeSettings, codEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2">
                    {storeSettings.codEnabled ? "✓ COD is active on checkout" : "✕ COD is currently disabled"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveStoreSettings}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save Commerce Rules"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & SECURITY */}
          {activeTab === "security" && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground">Admin Profile & Security</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Update your account name, login email, and change your password securely.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {profileMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800"
                  }`}
                >
                  {profileMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {profileMsg.text}
                </div>
              )}

              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Login Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Change Password Section */}
              <div className="pt-6 border-t border-border/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Change Password</h3>
                  <span className="text-[11px] text-muted-foreground">(Leave blank to keep unchanged)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Updating..." : "Update Profile & Security"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF & ROLES (OWNER ONLY) */}
          {activeTab === "staff" && isOwner && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">Team & Staff Access</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage accounts, roles, and grant access to order fulfillment staff.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStaff(!showAddStaff)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shadow-primary/20"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {showAddStaff ? "Cancel" : "Add Staff Member"}
                </button>
              </div>

              {staffMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    staffMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-800"
                  }`}
                >
                  {staffMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {staffMsg.text}
                </div>
              )}

              {/* Add Staff Form Accordion */}
              {showAddStaff && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <UserPlus className="h-4 w-4" />
                    New Staff Administrator Account
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Full Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="e.g. priya@laxyfashions.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Initial Password</label>
                      <input
                        type="password"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Role Permission</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as "STAFF" | "OWNER")}
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="STAFF">STAFF (Orders & Inventory)</option>
                        <option value="OWNER">OWNER (Full Administrative Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCreateStaff}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {isPending ? "Creating..." : "Confirm & Create Account"}
                    </button>
                  </div>
                </div>
              )}

              {/* Staff Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden divide-y divide-border/50">
                {staffList.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                        {member.name ? member.name[0].toUpperCase() : "A"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{member.name}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/60">
                            {member.role}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              member.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {member.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleStaff(member.id, member.status)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                            member.status === "ACTIVE"
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {member.id === currentUser.id && (
                        <span className="text-[11px] font-medium text-muted-foreground px-2 py-1 bg-secondary/50 rounded-lg">
                          Current Session
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
