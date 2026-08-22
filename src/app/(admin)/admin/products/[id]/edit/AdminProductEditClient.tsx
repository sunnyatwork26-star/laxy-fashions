"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Loader2, Upload, X, Star, Save, Archive,
} from "lucide-react";
import { createProduct, updateProduct, archiveProduct, uploadProductImage } from "@/server/actions/products";
import { slugify } from "@/lib/orderLogic";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId?: string | null;
  fabric?: string | null;
  occasion: string[];
  basePrice: number;
  salePrice?: number | null;
  sku: string;
  status: string;
  stock: number;
  images: string[];
  featured: boolean;
}

interface Props {
  product: Product | null;
  categories: Category[];
  isNew: boolean;
}

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  fabric: "",
  occasion: "",
  basePrice: "",
  salePrice: "",
  sku: "",
  stock: "0",
  status: "ACTIVE",
  featured: false,
  images: [] as string[],
};

const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const FABRICS = ["Silk", "Cotton", "Chiffon", "Linen", "Net", "Banarasi", "Chanderi", "Georgette"];
const OCCASIONS = ["Festive", "Wedding", "Casual", "Work", "Puja"];

export default function AdminProductEditClient({ product, categories, isNew }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(() => {
    if (product) {
      return {
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        categoryId: product.categoryId ?? "",
        fabric: product.fabric ?? "",
        occasion: Array.isArray(product.occasion)
          ? product.occasion.join(", ")
          : "",
        basePrice: String(product.basePrice),
        salePrice: product.salePrice ? String(product.salePrice) : "",
        sku: product.sku,
        stock: String(product.stock),
        status: product.status,
        featured: product.featured,
        images: product.images as string[],
      };
    }
    return EMPTY;
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length || !product?.id) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadProductImage(product.id, fd);
        if (res.ok && res.url) urls.push(res.url);
      }
      set("images", [...form.images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) =>
    set("images", form.images.filter((_, i) => i !== idx));

  const moveImage = (idx: number, dir: number) => {
    const arr = [...form.images];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    set("images", arr);
  };

  const handleSave = () => {
    setError("");
    setSaved(false);
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.basePrice || Number(form.basePrice) <= 0) {
      setError("Enter a valid base price.");
      return;
    }
    if (!form.sku.trim()) { setError("SKU is required."); return; }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId || null,
      fabric: form.fabric.trim() || undefined,
      occasion: form.occasion
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      basePrice: Number(form.basePrice),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      sku: form.sku.trim(),
      stock: Number(form.stock) || 0,
      status: form.status,
      featured: form.featured,
      images: form.images,
    };

    startTransition(async () => {
      const res = isNew
        ? await createProduct(payload)
        : await updateProduct(product!.id, payload);

      if (!res.ok) {
        setError(res.error ?? "Could not save product.");
        toast.error(res.error ?? "Could not save product.");
        return;
      }

      setSaved(true);
      toast.success(isNew ? "Product created!" : "Product saved.");
      if (isNew && (res as any).product?.id) {
        router.push(`/admin/products/${(res as any).product.id}/edit`);
      }
    });
  };

  const handleArchive = () => {
    if (isNew) return;
    if (!confirm("Archive this product? It will no longer be shown to customers.")) return;
    startTransition(async () => {
      const res = await archiveProduct(product!.id);
      if (res.ok) {
        toast.success("Product archived.");
        router.push("/admin/products");
      }
    });
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors";

  const Field = ({
    label,
    children,
    hint,
  }: {
    label: string;
    children: React.ReactNode;
    hint?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-foreground/70 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="p-5 sm:p-8 max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Products
      </Link>
      <h1 className="font-heading text-3xl text-accent">
        {isNew ? "New product" : "Edit product"}
      </h1>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 rounded-lg bg-emerald-900/20 border border-emerald-700/30 px-3 py-2.5 text-sm text-emerald-400">
          Saved successfully.
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Images */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg mb-3">Images</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.images.map((img, i) => (
              <div
                key={i}
                className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-secondary border border-border"
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded-full bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5" />
                    Cover
                  </span>
                )}
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={() => moveImage(i, -1)}
                    className="p-1 bg-background/80 rounded text-xs"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => moveImage(i, 1)}
                    className="p-1 bg-background/80 rounded text-xs"
                  >
                    →
                  </button>
                  <button
                    onClick={() => removeImage(i)}
                    className="p-1 bg-background/80 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || isNew}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
              title={isNew ? "Save the product first to upload images" : ""}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-xs text-center px-1">
                {isNew ? "Save first" : "Add images"}
              </span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            JPEG, PNG or WebP · max 8MB · first image is the cover.
          </p>
        </div>

        {/* Basic info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg mb-1">Basic info</h2>
          <Field label="Product name *">
            <input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!form.slug) set("slug", slugify(e.target.value));
              }}
              placeholder="e.g. Banarasi Silk Saree — Vermilion"
              className={inputCls}
            />
          </Field>
          <Field label="URL slug" hint="Auto-generated from name. Must be lowercase with hyphens.">
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="banarasi-silk-vermilion"
              className={inputCls}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the saree — weave, fabric, occasion, special details…"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputCls}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Fabric">
              <select
                value={form.fabric}
                onChange={(e) => set("fabric", e.target.value)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {FABRICS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Occasion(s)"
              hint="Comma-separated, e.g. Festive, Wedding"
            >
              <input
                value={form.occasion}
                onChange={(e) => set("occasion", e.target.value)}
                placeholder="Festive, Wedding"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Pricing & inventory */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg mb-1">Pricing & inventory</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Base price (₹) *">
              <input
                type="number"
                min="1"
                value={form.basePrice}
                onChange={(e) => set("basePrice", e.target.value)}
                placeholder="12500"
                className={inputCls}
              />
            </Field>
            <Field label="Sale price (₹)" hint="Leave empty if not on sale.">
              <input
                type="number"
                min="1"
                value={form.salePrice}
                onChange={(e) => set("salePrice", e.target.value)}
                placeholder="10000"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="SKU *" hint="Unique product code.">
              <input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="BSS-VRM-001"
                className={inputCls}
              />
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-heading text-lg mb-1">Publishing</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Featured">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-foreground/80">
                  Show on homepage / featured section
                </span>
              </label>
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pb-8">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground btn-press disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          {!isNew && (
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/50 text-destructive px-6 py-3 text-sm hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
