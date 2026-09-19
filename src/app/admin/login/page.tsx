"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Fetch CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData?.csrfToken;

      // 2. Perform direct POST to credentials callback with X-Auth-Return-Redirect
      const body = new URLSearchParams({
        csrfToken: csrfToken || "",
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: callbackUrl || "/admin",
        json: "true",
      });

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: body.toString(),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data?.url && data.url.includes("error="))) {
        let errorMsg = "Invalid email or password.";
        if (data?.url) {
          try {
            const parsedUrl = new URL(data.url, window.location.origin);
            const errParam = parsedUrl.searchParams.get("error");
            if (errParam && errParam !== "CredentialsSignin") {
              errorMsg = "Login failed. Please check credentials or try again later.";
            }
          } catch {
            // fallback to default
          }
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Success — redirect immediately to admin dashboard
      const target = data?.url || callbackUrl || "/admin";
      window.location.href = target;
    } catch (err) {
      console.error("Direct login error, trying fallback:", err);
      try {
        const fallbackRes = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
          callbackUrl,
        });

        if (fallbackRes?.error) {
          setError(
            fallbackRes.error === "CredentialsSignin"
              ? "Invalid email or password."
              : "Login failed. Please verify credentials or try again later."
          );
        } else if (fallbackRes?.url || fallbackRes?.ok) {
          window.location.href = fallbackRes.url || callbackUrl || "/admin";
        }
      } catch {
        setError("Something went wrong. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-secondary px-3 py-3 text-sm outline-none focus:border-primary transition-colors pl-10";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-5">
            <LogIn className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-3xl text-foreground">
            Laxy Admin
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in to manage orders and products.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-7">
          {error && (
            <div className="mb-5 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-foreground/70 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@laxyfashions.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-foreground/70 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground btn-press disabled:opacity-60 mt-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
