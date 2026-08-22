import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <p className="font-heading text-8xl text-foreground/10 leading-none">404</p>
          <div className="h-px w-16 bg-border mx-auto" />
        </div>
        <div className="space-y-3">
          <h1 className="font-heading text-3xl text-foreground">Page not found</h1>
          <p className="text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground btn-press"
          >
            Go home
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-border px-6 py-2.5 text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            Browse sarees
          </Link>
        </div>
      </div>
    </div>
  );
}
