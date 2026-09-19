"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Auth Guard ─────────────────────────────────────────────────────────────
async function requireAdmin(ownerOnly = false) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
  });
  if (!admin || admin.status !== "ACTIVE") throw new Error("Unauthorized");
  if (ownerOnly && admin.role !== "OWNER") throw new Error("Forbidden: Owner access required");
  return admin;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────
const storeSettingsSchema = z.object({
  storeName: z.string().min(2).max(100),
  storeTagline: z.string().max(200).optional().default(""),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(10).max(15),
  whatsappNumber: z.string().min(10).max(15),
  announcementText: z.string().max(300).optional().default(""),
  announcementEnabled: z.boolean().default(true),
  freeShippingThreshold: z.number().min(0).default(0),
  orderPrefix: z.string().min(1).max(10).default("LF"),
  lowStockThreshold: z.number().int().min(1).max(100).default(3),
  codEnabled: z.boolean().default(true),
});

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional().or(z.literal("")),
});

// ─── Get Public Store Settings (For Storefront, no auth required) ────────────
export async function getPublicStoreSettings() {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      return {
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
    }

    return {
      storeName: setting.storeName,
      storeTagline: setting.storeTagline,
      supportEmail: setting.supportEmail,
      supportPhone: setting.supportPhone,
      whatsappNumber: setting.whatsappNumber,
      announcementText: setting.announcementText,
      announcementEnabled: setting.announcementEnabled,
      freeShippingThreshold: Number(setting.freeShippingThreshold),
      codEnabled: setting.codEnabled,
    };
  } catch (error) {
    return {
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
  }
}

// ─── Get Store Settings (Admin authenticated) ───────────────────────────────
export async function getStoreSettings() {
  await requireAdmin();
  let setting = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });

  if (!setting) {
    setting = await prisma.storeSetting.create({
      data: {
        id: "default",
        storeName: "Laxy Fashions",
        storeTagline: "Handcrafted Luxury Sarees",
        supportEmail: "admin@laxyfashions.com",
        supportPhone: "919876543210",
        whatsappNumber: "919876543210",
        announcementText: "Complimentary Express Shipping Across India",
        announcementEnabled: true,
        freeShippingThreshold: 0,
        orderPrefix: "LF",
        lowStockThreshold: 3,
        codEnabled: true,
      },
    });
  }

  return {
    ...setting,
    freeShippingThreshold: Number(setting.freeShippingThreshold),
  };
}

// ─── Update Store Settings ───────────────────────────────────────────────────
export async function updateStoreSettings(rawInput: unknown) {
  const admin = await requireAdmin(true); // Owner only
  const parsed = storeSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const data = parsed.data;

  const updated = await prisma.storeSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...data,
      freeShippingThreshold: data.freeShippingThreshold,
    },
    update: {
      ...data,
      freeShippingThreshold: data.freeShippingThreshold,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");

  return {
    ok: true,
    settings: {
      ...updated,
      freeShippingThreshold: Number(updated.freeShippingThreshold),
    },
  };
}

// ─── Update Admin Profile & Password ─────────────────────────────────────────
export async function updateAdminProfile(rawInput: unknown) {
  const admin = await requireAdmin();
  const parsed = profileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, email, currentPassword, newPassword } = parsed.data;

  // If changing email, ensure uniqueness
  if (email.toLowerCase() !== admin.email.toLowerCase()) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return { ok: false, error: "An admin with this email already exists." };
    }
  }

  // If changing password, verify current password
  let newHash: string | undefined = undefined;
  if (newPassword && newPassword.trim().length >= 6) {
    if (!currentPassword) {
      return { ok: false, error: "Current password is required to set a new password." };
    }
    const matches = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!matches) {
      return { ok: false, error: "Current password does not match." };
    }
    newHash = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      name,
      email: email.toLowerCase(),
      ...(newHash ? { passwordHash: newHash } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
    },
  });

  revalidatePath("/admin/settings");
  return { ok: true, admin: updated };
}

// ─── Get All Staff Admins (Owner only) ────────────────────────────────────────
export async function getStaffAdmins() {
  await requireAdmin(true);
  return prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

// ─── Create New Staff Admin (Owner only) ──────────────────────────────────────
export async function createStaffAdmin(rawInput: unknown) {
  await requireAdmin(true);
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["OWNER", "STAFF"]).default("STAFF"),
  });

  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { ok: false, error: "Admin with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.adminUser.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  revalidatePath("/admin/settings");
  return { ok: true, admin: created };
}

// ─── Toggle Admin Status (Owner only) ─────────────────────────────────────────
export async function toggleAdminStatus(targetAdminId: string, newStatus: "ACTIVE" | "INACTIVE") {
  const admin = await requireAdmin(true);
  if (admin.id === targetAdminId) {
    return { ok: false, error: "You cannot deactivate your own owner account." };
  }

  await prisma.adminUser.update({
    where: { id: targetAdminId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
