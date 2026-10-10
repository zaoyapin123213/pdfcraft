# Root page

The root URL / is served by a Cloudflare Pages _redirects rule:

    / /en/ 301

Why a 301 (changed 2026-10-10 from a 200-rewrite `/ /en/index.html 200`):
an edge-cached copy of the old 200 shell kept being served after its JS
chunks were gone from newer deployments, showing users a blank page for
up to the 7-day s-maxage. A 301 is fail-safe: even a stale cached copy
of the redirect still sends visitors to /en/, which always works.

Do not re-create src/app/page.tsx - it would emit out/index.html, and
CF Pages serves a matching static asset in preference to _redirects
rules, which would shadow the 301.

Incident notes: if the root ever serves stale content again, purge the
Cloudflare zone cache (dashboard > Caching > Configuration > Purge
Everything) - the apex domain is proxied (orange cloud) through the
zone, so zone cache sits in front of Pages.

Previous versions live in git history (client-side redirect: e7246a3
and earlier; 200-rewrite: 07895db).
