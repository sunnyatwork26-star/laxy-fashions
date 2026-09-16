"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/orderLogic";
import type { ProductStatus } from "@prisma/client";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

// ─── Auth guard helper ────────────────────────────────────────────────────────
async function requireAdmin(ownerOnly = false) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
  });
  if (!admin || admin.status !== "ACTIVE") throw new Error("Unauthorized");
  if (ownerOnly && admin.role !== "OWNER") throw new Error("Forbidden");
  return admin;
}

// ─── Get all products ─────────────────────────────────────────────────────────
export async function getProducts(filters?: {
  status?: string;
  categoryId?: string;
  q?: string;
}) {
  return prisma.product.findMany({
    where: {
      status: filters?.status
        ? (filters.status as ProductStatus)
        : { not: "ARCHIVED" },
      categoryId: filters?.categoryId || undefined,
      OR: filters?.q
        ? [
            { name: { contains: filters.q, mode: "insensitive" } },
            { sku: { contains: filters.q, mode: "insensitive" } },
            { fabric: { contains: filters.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

// ─── Get single product by slug ───────────────────────────────────────────────
export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

// ─── Create product ───────────────────────────────────────────────────────────
export async function createProduct(rawInput: unknown) {
  await requireAdmin();
  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", issues: parsed.error.flatten() };
  }
  const data = parsed.data;
  const slug = data.slug || slugify(data.name);

  // Ensure slug is unique
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false, error: "A product with this slug already exists." };
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      fabric: data.fabric ?? null,
      occasion: data.occasion ?? [],
      basePrice: data.basePrice,
      salePrice: data.salePrice ?? null,
      sku: data.sku,
      status: data.status as ProductStatus,
      stock: data.stock,
      images: data.images ?? [],
      featured: data.featured,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePath("/shop");
  return { ok: true, product };
}

// ─── Update product ───────────────────────────────────────────────────────────
export async function updateProduct(id: string, rawInput: unknown) {
  const admin = await requireAdmin();
  const parsed = productSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", issues: parsed.error.flatten() };
  }
  const data = parsed.data;

  // Only OWNER can change price
  if (admin.role === "STAFF") {
    // Reject price changes for staff
    const existing = await prisma.product.findUnique({ where: { id } });
    if (existing) {
      if (
        Number(data.basePrice) !== Number(existing.basePrice) ||
        (data.salePrice ?? null) !== (existing.salePrice ? Number(existing.salePrice) : null)
      ) {
        return { ok: false, error: "Staff cannot change prices." };
      }
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      fabric: data.fabric ?? null,
      occasion: data.occasion ?? [],
      basePrice: data.basePrice,
      salePrice: admin.role === "OWNER" ? (data.salePrice ?? null) : undefined,
      sku: data.sku,
      status: data.status as ProductStatus,
      stock: data.stock,
      images: data.images ?? [],
      featured: data.featured,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePath("/shop");
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, product };
}

// ─── Archive product (soft delete) ───────────────────────────────────────────
export async function archiveProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/shop");
  return { ok: true, product };
}

// ─── Update stock manually ────────────────────────────────────────────────────
export async function updateStock(
  productId: string,
  newStock: number,
  note?: string
) {
  const admin = await requireAdmin(true); // OWNER only
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: "Product not found." };

  const diff = newStock - product.stock;

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    }),
    prisma.inventoryMovement.create({
      data: {
        productId,
        type: "MANUAL_ADJUSTMENT",
        quantity: diff,
        referenceType: "MANUAL",
        referenceId: admin.id,
        createdByAdminId: admin.id,
        note: note ?? "Manual stock adjustment",
      },
    }),
  ]);

  return { ok: true };
}

// ─── Upload product image ─────────────────────────────────────────────────────
export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  await requireAdmin();
  const file = formData.get("file") as File;
  if (!file) return { ok: false, error: "No file provided." };

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG and WebP images are allowed." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 8MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `products/${productId}/${Date.now()}.${ext}`;

  const blob = await put(safeName, file, { access: "public" });

  return { ok: true, url: blob.url };
}

// ─── Get categories ───────────────────────────────────────────────────────────
export async function getCategories(activeOnly = false) {
  return prisma.category.findMany({
    where: activeOnly ? { status: "ACTIVE" } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}
