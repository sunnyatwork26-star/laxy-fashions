# Code Review — Manual Audit Findings

**Date**: 2026-09-16
**Reviewer**: Automated Agent (Antigravity)
**Scope**: Full source tree (`src/`)

---

## Critical Bugs Found & Fixed

### 1. [FIXED] Middleware Auth Secret Mismatch
- **File**: `src/middleware.ts`
- **Severity**: Critical
- **Issue**: `getToken({ req, secret: process.env.AUTH_SECRET })` — the env var is `NEXTAUTH_SECRET`, not `AUTH_SECRET`. This caused the JWT token to never be validated correctly, potentially allowing unauthenticated access to admin routes on Vercel.
- **Fix**: Removed explicit `secret` parameter so `getToken()` auto-discovers `NEXTAUTH_SECRET`/`AUTH_SECRET`.

### 2. [FIXED] React Component Created During Render
- **File**: `src/components/storefront/ShopFilters.tsx`
- **Severity**: High
- **Issue**: `const FilterContent = () => (...)` was defined inside the render function, then used as `<FilterContent />`. This causes React to unmount/remount the component on every render, resetting all internal state (e.g., select dropdowns, focus).
- **Fix**: Converted to a JSX variable (`const filterContent = (...)`) rendered inline.

### 3. [FIXED] setState Called Synchronously in useEffect
- **File**: `src/components/storefront/Header.tsx`
- **Severity**: Medium
- **Issue**: `setMounted(true)` and `setMenuOpen(false)` called directly in effects. React 19 lint rules flag this as causing cascading renders.
- **Fix**: Replaced `mounted` state with `useRef`, replaced pathname-change effect with ref-based comparison during render.

---

## Non-Critical Issues Found & Fixed

### 4. [FIXED] Unused Imports
- `AdminSidebar.tsx`: Removed unused `ChevronRight`
- `Footer.tsx`: Removed unused `Phone`, `MapPin`
- `ProductCard.tsx`: Removed unused `ArrowRight`

### 5. [FIXED] Unescaped JSX Entities
- `not-found.tsx`: `you're` → `you&apos;re`
- `CartDrawer.tsx`: `haven't` → `haven&apos;t`

### 6. [FIXED] Incorrect Base URLs
- `sitemap.ts`: Fallback URL was `laxyfashions.com` (wrong domain) → Fixed to `laxy-fashions.vercel.app`
- `robots.ts`: Same fix
- `layout.tsx`: Added `metadataBase` to fix OG image resolution warning

### 7. [FIXED] Sitemap Missing Info Pages
- Added shipping, returns, privacy, terms, contact pages to sitemap
- Removed `cart` from sitemap (client-side only, no SEO value)

---

## Known Remaining Lint Warnings (Non-Critical)

### `@typescript-eslint/no-explicit-any` (≈20 occurrences)
- **Files**: `auth.ts`, `orderLogic.ts`, `orders.ts`, `products.ts`, admin client components
- **Assessment**: These are intentional type assertions for Prisma return types and NextAuth session extensions. Fixing them would require extensive type augmentation that provides no runtime benefit.
- **Decision**: Accepted as-is. Not a production risk.

### `react/no-unescaped-entities` in admin components
- **Assessment**: The `&ldquo;` / `&rdquo;` entities used in status history display are valid HTML entities.

### `middleware` deprecation warning
- **Assessment**: Next.js 16.3.1 deprecates the `middleware.ts` convention in favor of `proxy`. The middleware still works correctly. Migration can be done in a future update.

---

## Architecture Notes

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | Next.js 16.3.1 (App Router) | ✅ |
| Database | PostgreSQL via Neon | ✅ |
| ORM | Prisma 7.9.1 with pg adapter | ✅ |
| Auth | NextAuth v5 (JWT strategy) | ✅ |
| Storage | Vercel Blob | ✅ |
| Styling | Tailwind CSS v4 | ✅ |
| State | React Context (CartContext) | ✅ |
| Deployment | Vercel | ✅ |
