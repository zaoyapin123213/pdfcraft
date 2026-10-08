/**
 * Custom 404 page
 * Static export emits this as 404.html, which Cloudflare Pages serves
 * automatically for unknown URLs. Internal links keep visitors (and
 * crawlers) flowing to real pages instead of a dead end.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <main id="main-content" className="text-center max-w-xl">
        <p className="text-sm font-semibold text-[hsl(var(--color-primary))] mb-2">404</p>
        <h1 className="text-3xl font-bold mb-4">Page not found</h1>
        <p className="text-[hsl(var(--color-muted-foreground))] mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
          Try one of these instead:
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Error page navigation">
          <Link
            href="/en/"
            className="rounded-md bg-[hsl(var(--color-primary))] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Go to homepage
          </Link>
          <Link
            href="/en/tools/"
            className="rounded-md border border-[hsl(var(--color-border))] px-5 py-2.5 text-sm font-medium hover:bg-[hsl(var(--color-muted))] transition-colors"
          >
            Browse all PDF tools
          </Link>
          <Link
            href="/en/faq/"
            className="rounded-md border border-[hsl(var(--color-border))] px-5 py-2.5 text-sm font-medium hover:bg-[hsl(var(--color-muted))] transition-colors"
          >
            FAQ
          </Link>
        </nav>
      </main>
    </div>
  );
}
