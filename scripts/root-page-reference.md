# Root page

The root URL / is served by Cloudflare Pages _redirects 200-rewrite:

    / /en/index.html 200

(pointing at the prerendered /en/index.html), because CF Pages serves a
matching static asset in preference to a 200 rewrite. Do not re-create
src/app/page.tsx - it would emit out/index.html and shadow the rewrite.

The previous client-side-redirect version lives in git history
(commit e7246a3 and earlier).
