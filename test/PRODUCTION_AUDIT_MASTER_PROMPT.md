# 🔥 PRODUCTION-LEVEL PROJECT AUDIT, TESTING & HARDENING — REUSABLE MASTER PROMPT

> **What this is**: A complete, copy-paste-ready prompt you can give to any AI coding assistant (Antigravity, Cursor, Claude, Copilot, etc.) to perform a full production audit on ANY Next.js/React/Node.js project. This was battle-tested on the Laxy Fashions project and every single step here was actually executed and verified.

---

## HOW TO USE THIS PROMPT

1. **Copy everything below the line** (from "BEGIN PROMPT" to "END PROMPT")
2. **Replace the placeholder values** marked with `{{PLACEHOLDER}}` with your actual project details
3. **Paste it into your AI coding assistant**
4. **Let it execute** — it will work through every phase systematically

---

## ────────────── BEGIN PROMPT ──────────────

---

# FULL PRODUCTION AUDIT, TESTING & HARDENING

## PROJECT DETAILS
- **Repository**: {{YOUR_GITHUB_REPO_URL}}
- **Production URL**: {{YOUR_DEPLOYED_URL}}
- **Framework**: {{Next.js / React / Node.js / etc.}}
- **Database**: {{PostgreSQL / MongoDB / MySQL / etc.}}
- **ORM**: {{Prisma / Drizzle / TypeORM / etc.}}
- **Auth**: {{NextAuth / Clerk / Auth.js / Firebase Auth / etc.}}
- **Deployment**: {{Vercel / AWS / Railway / Netlify / etc.}}
- **CodeRabbit API Key** (optional): {{YOUR_KEY — will be used as env var only, never committed}}

---

## ABSOLUTE OPERATING RULES

### TERMINAL ONLY — NO BROWSER AUTOMATION
All investigation, testing, verification, deployment checks, and project analysis must be performed through:
- Terminal / Shell commands
- Git CLI
- Package manager CLI (npm/pnpm/yarn)
- Framework CLI (next/vite)
- Database CLI (prisma/psql)
- HTTP tools (curl / PowerShell Invoke-WebRequest)
- CodeRabbit MCP / code-review-graph (if available)

**DO NOT** use Playwright, Puppeteer, Selenium, browser-use, or any browser automation.

### SECURITY
- **NEVER** write API keys, passwords, secrets, or tokens to any file, report, or git commit
- Use environment variables only
- Verify `.gitignore` covers all `.env*` files before any git operations
- Run a secrets scan before every push

### ALL ARTIFACTS IN `test/` DIRECTORY
Every report, test result, and audit document must be created inside the project's `test/` directory:
```
test/
├── README.md
├── analysis/
│   └── code-review.md
├── security/
│   └── security-audit.md
├── test-results/
│   ├── build-results.md
│   └── http-smoke-test.md
├── deployment/
│   └── deployment-check.md
├── coderabbit/
│   └── README.md
└── handover/
    └── FINAL_HANDOVER_REPORT.md
```

---

## PHASE 1: ENVIRONMENT DISCOVERY & MAPPING

### 1.1 Project Structure Analysis
```bash
# Map the entire project structure
find . -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' | head -100

# Check framework version
cat package.json | grep -E "next|react|vue|angular|express"

# Check all dependencies
cat package.json

# Check TypeScript config
cat tsconfig.json

# Check deployment config
cat vercel.json 2>/dev/null || cat netlify.toml 2>/dev/null || cat Dockerfile 2>/dev/null

# Check environment setup
cat .env.example 2>/dev/null || cat .env.sample 2>/dev/null
cat .gitignore | grep -i env
```

### 1.2 Database Schema Analysis
```bash
# For Prisma projects
cat prisma/schema.prisma

# Check migrations
ls prisma/migrations/

# For raw SQL
cat schema.sql 2>/dev/null
```

### 1.3 Auth Configuration
```bash
# Find auth files
find src -name "auth*" -o -name "middleware*" -o -name "proxy*" | head -20

# Check auth providers
grep -r "providers" src/lib/auth* 2>/dev/null
grep -r "NextAuth\|Clerk\|Firebase" src/ --include="*.ts" --include="*.tsx" -l
```

### 1.4 Route Inventory
```bash
# List all routes (Next.js App Router)
find src/app -name "page.tsx" -o -name "route.ts" | sort

# List all server actions
find src -name "*.ts" | xargs grep -l "use server" 2>/dev/null

# List all API routes
find src/app/api -type f 2>/dev/null | sort
```

**Document everything you find in `test/analysis/code-review.md`.**

---

## PHASE 2: STATIC ANALYSIS & LINTING

### 2.1 TypeScript Strict Check
```bash
# Run TypeScript compiler in check mode
npx tsc --noEmit 2>&1

# Or via the framework's build
npm run build 2>&1
```

**Goal**: 0 TypeScript errors. Fix every error found.

### 2.2 ESLint Analysis
```bash
# Run linter
npm run lint 2>&1

# If no lint script, run directly
npx eslint src/ --ext .ts,.tsx 2>&1
```

**Fix categories (in priority order)**:
1. **Critical**: React bugs (component created during render, setState in useEffect, missing keys)
2. **High**: Unused imports, unreachable code, missing return types
3. **Medium**: Unescaped JSX entities, console.log statements
4. **Low**: `@typescript-eslint/no-explicit-any` — fix with proper type declarations

### 2.3 Fix `any` Types — The Right Way

**DO NOT** just suppress `any` warnings. Fix them properly:

#### Step 1: Create Type Augmentation Files
For NextAuth/Auth.js projects, create `src/types/next-auth.d.ts`:
```typescript
import { AdminRole } from "@prisma/client"; // or your enum

declare module "next-auth" {
  interface User {
    id: string;
    role: AdminRole;
  }
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      name: string;
      email: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
  }
}
```

#### Step 2: Replace `as any` in Auth Callbacks
```typescript
// BEFORE (bad):
token.role = (user as any).role;
(session.user as any).role = token.role;

// AFTER (good — with type augmentation above):
token.role = user.role;
session.user.role = token.role;
```

#### Step 3: Replace `as any` in Prisma Operations
```typescript
// BEFORE:
status: data.status as any

// AFTER:
import type { ProductStatus } from "@prisma/client";
status: data.status as ProductStatus
```

#### Step 4: Fix Catch Blocks
```typescript
// BEFORE:
catch (e: any) { return e.message; }

// AFTER:
catch (e: unknown) { return e instanceof Error ? e.message : "Unknown error"; }
```

#### Step 5: Fix Generic Constraints
```typescript
// BEFORE:
function serialize<T extends Record<string, any>>(p: T): T

// AFTER:
interface SerializableProduct {
  basePrice?: unknown;
  salePrice?: unknown;
  [key: string]: unknown;
}
function serialize<T extends SerializableProduct>(p: T): T
```

---

## PHASE 3: SECURITY AUDIT

### 3.1 Secrets Scan
```bash
# Check git history for accidentally committed secrets
git log --all --full-history -- "*.env" "*.pem" "*.key" "*.secret"

# Search for hardcoded credentials in source
grep -rn "password\|secret\|api_key\|apikey\|token" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".d.ts" | grep -v "test"

# Verify .gitignore
cat .gitignore | grep -i "env\|secret\|key"

# Check what's currently tracked
git ls-files | grep -i "env\|secret\|key"
```

### 3.2 Authentication Audit
Check these items and document in `test/security/security-audit.md`:

| Check | How to Verify |
|-------|---------------|
| Password hashing | Look for bcrypt/argon2/scrypt in auth code |
| JWT secret | Verify NEXTAUTH_SECRET/AUTH_SECRET is set in production |
| Session strategy | JWT vs database sessions — document which |
| Login validation | Zod/yup schema on credentials |
| Protected routes | Middleware/proxy checks on admin routes |
| Rate limiting | Check if login has brute-force protection |

### 3.3 Authorization Audit
```bash
# Find all server actions and check for auth guards
grep -rn "requireAdmin\|auth()\|getServerSession" src/server/ --include="*.ts"

# Check if public actions properly skip auth
grep -rn "use server" src/ --include="*.ts" -A 5
```

### 3.4 Input Validation Audit
```bash
# Find all Zod/validation schemas
grep -rn "z.object\|z.string\|z.number" src/ --include="*.ts" | head -20

# Check server actions validate input
grep -rn "safeParse\|parse(" src/server/ --include="*.ts"
```

### 3.5 SQL Injection / XSS Audit
```bash
# Check for raw SQL (dangerous)
grep -rn "raw\|sql\`\|query(" src/ --include="*.ts" | grep -v "node_modules"

# Check for dangerouslySetInnerHTML (XSS risk)
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"

# Check URL construction
grep -rn "encodeURIComponent\|encodeURI" src/ --include="*.ts" --include="*.tsx"
```

---

## PHASE 4: ADD RATE LIMITING

### 4.1 Create In-Memory Rate Limiter
Create `src/lib/rateLimit.ts`:
```typescript
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  entry.attempts += 1;

  if (entry.attempts > maxAttempts) {
    return { allowed: false, remaining: 0, resetInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.attempts,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
```

### 4.2 Integrate into Auth
In your auth `authorize()` callback:
```typescript
const limit = checkRateLimit(`login:${email.toLowerCase()}`);
if (!limit.allowed) {
  throw new Error(`Too many login attempts. Try again in ${limit.resetInSeconds} seconds.`);
}
// ... validate credentials ...
// On success:
resetRateLimit(`login:${email.toLowerCase()}`);
```

---

## PHASE 5: MIDDLEWARE → PROXY MIGRATION (Next.js 16+)

### 5.1 Check if Migration Needed
```bash
npm run build 2>&1 | grep -i "middleware.*deprecated\|proxy"
```

### 5.2 Manual Migration
1. Rename `src/middleware.ts` → `src/proxy.ts`
2. Rename exported function: `export function middleware(...)` → `export function proxy(...)`
3. Keep the `config` export unchanged
4. Delete the old `src/middleware.ts`

### 5.3 Verify
```bash
npm run build 2>&1 | grep -i "proxy\|middleware"
# Should show "ƒ Proxy (Middleware)" with NO deprecation warning
```

---

## PHASE 6: AUTOMATED TESTING

### 6.1 Install Vitest
```bash
npm install -D vitest --legacy-peer-deps
npm install -D vite --legacy-peer-deps  # peer dependency
```

### 6.2 Create `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### 6.3 Add Test Scripts to `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run"
  }
}
```

### 6.4 What to Test (Priority Order)

#### Priority 1: Pure Business Logic (no mocking needed)
Test functions that take input and return output with no side effects:
- Price calculations (formatting, discounts, tax)
- Phone/email normalization
- Slug generation
- Status/state machine transitions
- Validation schemas (Zod/Yup)
- Date formatting
- Cart total calculations

#### Priority 2: State Machines & Workflows
Test every valid and invalid state transition:
```typescript
describe("canTransition", () => {
  it("allows PENDING → CONFIRMED", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
  });
  it("disallows DELIVERED → anything", () => {
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });
  it("handles unknown status gracefully", () => {
    expect(canTransition("UNKNOWN", "PENDING")).toBe(false);
  });
});
```

#### Priority 3: Validation Schemas
Test both valid and invalid inputs:
```typescript
describe("checkoutSchema", () => {
  it("accepts valid checkout data", () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  it("rejects invalid pincode", () => {
    const result = checkoutSchema.safeParse({ ...validData, pincode: "123" });
    expect(result.success).toBe(false);
  });
});
```

#### Priority 4: Rate Limiter
```typescript
describe("checkRateLimit", () => {
  it("allows up to maxAttempts", () => { ... });
  it("blocks after exceeded", () => { ... });
  it("tracks keys independently", () => { ... });
  it("resets after resetRateLimit()", () => { ... });
});
```

### 6.5 Run Tests
```bash
npx vitest run 2>&1
# Target: ALL tests pass, 0 failures
```

---

## PHASE 7: CODERABBIT INTEGRATION (Optional but Recommended)

### 7.1 What CodeRabbit Does
CodeRabbit is an AI code review tool that:
- **SaaS Mode**: Automatically reviews Pull Requests on GitHub (uses API key `cr-XXXX...`)
- **MCP Mode (code-review-graph)**: Runs locally, uses Tree-sitter to build a structural AST knowledge graph of your codebase

### 7.2 Set Up `.coderabbitignore`
Create `.coderabbitignore` at project root:
```
node_modules/
.next/
.git/
dist/
coverage/
test/
prisma/migrations/
public/
```

### 7.3 Use CodeRabbit MCP (if available)
```
# Build the code graph
build_or_update_graph_tool(repo_root="path/to/project", full_rebuild=true, postprocess="minimal")

# Get architecture overview
get_architecture_overview_tool(repo_root="path/to/project")

# Get review context for specific files
get_review_context_tool(repo_root="path/to/project", changed_files=["src/lib/auth.ts"])

# Find large functions that need refactoring
find_large_functions_tool(repo_root="path/to/project", min_lines=50)
```

### 7.4 If Graph Build Times Out
The MCP has a 3-minute timeout. For large repos, it may time out. Alternatives:
1. Add `.coderabbitignore` to exclude heavy directories
2. Use the SaaS PR review instead (push code → open PR → CodeRabbit reviews automatically)
3. Fall back to manual review + ESLint + TypeScript

---

## PHASE 8: HTTP SMOKE TESTING (Production)

### 8.1 Test All Critical Endpoints
```powershell
# PowerShell
$urls = @(
  '{{YOUR_URL}}/',
  '{{YOUR_URL}}/shop',
  '{{YOUR_URL}}/cart',
  '{{YOUR_URL}}/admin/login',
  '{{YOUR_URL}}/admin',
  '{{YOUR_URL}}/robots.txt',
  '{{YOUR_URL}}/sitemap.xml',
  '{{YOUR_URL}}/api/auth/providers',
  '{{YOUR_URL}}/nonexistent-page'
)

foreach ($url in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method GET -MaximumRedirection 0 -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    "✅ $($r.StatusCode) $url"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code) { "✅ $code $url (redirect)" } else { "❌ ERR $url" }
  }
}
```

```bash
# Bash/Linux/Mac alternative
for url in "/" "/shop" "/admin" "/robots.txt" "/sitemap.xml" "/api/auth/providers"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "{{YOUR_URL}}${url}")
  echo "$code $url"
done
```

### 8.2 Verify Auth Protection
```bash
# /admin should redirect (301/302/307) when not authenticated
curl -s -o /dev/null -w "%{http_code}" {{YOUR_URL}}/admin
# Expected: 307

# /admin/login should return 200
curl -s -o /dev/null -w "%{http_code}" {{YOUR_URL}}/admin/login
# Expected: 200
```

### 8.3 Check SEO Files
```bash
# robots.txt should block admin routes
curl -s {{YOUR_URL}}/robots.txt

# sitemap.xml should contain product URLs
curl -s {{YOUR_URL}}/sitemap.xml | head -50
```

### 8.4 Check Deployment Headers
```bash
curl -sI {{YOUR_URL}}/ | grep -i "server\|x-vercel\|x-powered\|strict-transport"
```

---

## PHASE 9: SEO & METADATA FIX

### 9.1 Check These Files
```bash
# layout.tsx — must have metadataBase
grep -rn "metadataBase" src/app/layout.tsx

# sitemap.ts — must use production URL
cat src/app/sitemap.ts

# robots.ts — must block admin/api routes
cat src/app/robots.ts
```

### 9.2 Fix metadataBase (Next.js)
```typescript
// In src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://{{YOUR_DOMAIN}}"),
  title: "...",
  // ...
};
```

### 9.3 Fix Sitemap
- Use production URL, not localhost
- Include all public pages and product pages
- Exclude cart, checkout, admin, API routes
- Set appropriate `changefreq` and `priority`

### 9.4 Fix robots.txt
```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /cart
Sitemap: https://{{YOUR_DOMAIN}}/sitemap.xml
```

---

## PHASE 10: ERROR BOUNDARIES & LOADING STATES

### 10.1 Add Error Boundaries
Create `error.tsx` for each route group:
```typescript
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try Again</button>
    </div>
  );
}
```

### 10.2 Add Loading Skeletons
Create `loading.tsx` for each route group with skeleton UI that matches the page layout.

---

## PHASE 11: BUILD, VERIFY & PUSH

### 11.1 Final Verification Checklist
```bash
# 1. Run all tests
npx vitest run

# 2. Run TypeScript check
npx tsc --noEmit

# 3. Run production build
npm run build

# 4. Verify no secrets staged
git diff --cached --name-only | grep -i "env\|secret\|key\|token"

# 5. Check git status
git status

# 6. Commit
git add -A
git commit -m "audit: production hardening — tests, security, type safety, rate limiting"

# 7. Push
git push origin main
```

### 11.2 Post-Push Verification
```bash
# Wait 2 minutes for deployment, then:

# Check deployment is live
curl -sI {{YOUR_URL}}/ | grep -i "date\|x-vercel-cache"

# Run smoke tests again
# (repeat Phase 8)
```

---

## PHASE 12: FINAL HANDOVER REPORT

Create `test/handover/FINAL_HANDOVER_REPORT.md` with:

1. **Project summary** — repo URL, production URL, tech stack
2. **Bugs found & fixed** — severity, description, file, fix
3. **Security audit results** — table of all checks and results
4. **Test results** — number of tests, pass/fail, test file locations
5. **Build results** — TypeScript errors, route count, warnings
6. **HTTP smoke test results** — table of all endpoints and status codes
7. **Deployment verification** — headers, cache status, HTTPS
8. **Remaining issues** — anything not fixed and why
9. **Handover status** — READY or NOT READY with clear reason

---

## TOOLS & TECHNIQUES REFERENCE

| Tool | Purpose | How It Was Used |
|------|---------|-----------------|
| **npm run build** | TypeScript + production compilation | Verify 0 TS errors, check route generation |
| **npm run lint / ESLint** | Static analysis | Find React bugs, unused imports, type issues |
| **Vitest** | Unit testing framework | 70 tests across business logic, validation, rate limiting |
| **PowerShell Invoke-WebRequest** | HTTP testing | Smoke test all production endpoints without browser |
| **curl -sI** | Header inspection | Verify Vercel deployment, HTTPS, cache headers |
| **git log / git ls-files** | Secret scanning | Verify no credentials in git history |
| **grep -rn** | Code search | Find `as any`, `dangerouslySetInnerHTML`, hardcoded secrets |
| **CodeRabbit MCP (code-review-graph)** | AST-based code analysis | Tree-sitter graph build for architectural review |
| **Zod schemas** | Input validation | Verify all server actions validate input |
| **NextAuth type augmentation** | Type safety | Eliminate `as any` in auth callbacks |
| **In-memory rate limiter** | Brute-force protection | 5 attempts/15min on admin login |

---

## WHAT THIS AUDIT DOES NOT COVER

Be honest about limitations:
- **Load testing** — Use k6/Artillery for that
- **Penetration testing** — Use OWASP ZAP or hire a security firm
- **Visual regression testing** — Use Chromatic/Percy
- **E2E browser testing** — Use Playwright (was excluded from this audit by design)
- **Mobile responsiveness** — Requires manual browser testing
- **Accessibility (a11y)** — Use axe-core or Lighthouse
- **Performance profiling** — Use Lighthouse CI or Web Vitals

---

## ────────────── END PROMPT ──────────────

---

## QUICK-START VERSION (Condensed)

If you want a shorter version to paste quickly:

```
PRODUCTION AUDIT for [PROJECT_NAME]:
1. Map project structure, framework, DB, auth, routes
2. Run build + lint → fix all TypeScript errors and critical React bugs
3. Fix all `as any` types with proper type declarations
4. Security audit: secrets scan, auth check, input validation, SQL injection, XSS
5. Add rate limiting on login (5 attempts/15min)
6. Migrate middleware.ts → proxy.ts (Next.js 16)
7. Install Vitest, write unit tests for: business logic, validation schemas, rate limiter
8. HTTP smoke test all production endpoints (no browser)
9. Fix SEO: metadataBase, sitemap, robots.txt
10. Add error boundaries + loading skeletons
11. Build → test → commit → push → verify deployment
12. Generate FINAL_HANDOVER_REPORT.md in test/handover/

All artifacts in test/ directory. Terminal only. No browser automation. Never commit secrets.
```
