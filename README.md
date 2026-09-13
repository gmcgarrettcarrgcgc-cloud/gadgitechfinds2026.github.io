# GadgiTech / Income Utopia — Storefront Site Export

This is a snapshot of the live production site currently deployed on Vercel
(project "g", aliased to incomeutopia.com / www.incomeutopia.com), exported
so it can be merged into the permanent build repo.

## What's in here

- `index.html` — main hub/landing page (storefront)
- `shop.html` — product shop page
- `hub.html` — password-gated Command Hub (untouched by the changes below —
  no Google sign-in / cart script loaded here on purpose)
- `auth-widget.js` — Google Sign-In (Supabase Auth) + shopping cart widget,
  loaded on public storefront pages only
- `cookie-consent.js` — cookie consent banner
- `privacy.html`, `terms.html`, `refund.html` — legal pages
- `organic.html` — organic promo post content
- `pricing-kit.html` — product detail page for the Pricing Confidence Kit

## Recent changes (2026-09-13)

1. **Google Sign-In on storefront** — Public pages (index.html, shop.html,
   etc.) now show a "Sign in with Google" button via Supabase Auth. Signing
   in as the owner email (gmcgarrettcarr.gc.gc@gmail.com) auto-redirects to
   `/hub.html`. Everyone else gets a normal signed-in state so their cart
   can sync across devices. `hub.html` itself was NOT changed — it keeps its
   existing password/key gate only.
2. **Working shopping cart** — `window.gtCart` (get/add/removeAt/clear) is
   now wired to real "+ Cart" buttons on every fixed-price product across
   `shop.html` and `index.html`. A cart pill (top-right, "🛒 Cart N") and a
   dropdown panel (line items, qty, running total, per-item "Buy this →"
   Stripe link, remove buttons, "Clear cart") give it an actual UI — it had
   no UI at all before. Cart persists in `localStorage` and syncs to a
   Supabase `carts` table for signed-in users.
   - Note: there is no multi-item Stripe Checkout Session backend yet —
     each product still checks out through its own individual Stripe
     Payment Link. The cart panel says this plainly. Wiring a real combined
     checkout would need a small serverless function (e.g. a Vercel
     Function) that creates a Stripe Checkout Session from the cart's line
     items — flagged here as the next real upgrade, not yet built.
   - Products intentionally left OUT of "+ Cart" (variable pricing / no
     single Stripe URL): GadgiTech Insider subscription, and all Printify
     apparel tiles.
3. **Bugfix** — `shop.html`'s "Buy" and "Details" links for `invoice-pack`
   and `jobsite-log` were swapped/broken (Buy pointed at a dead self
   anchor; Details pointed at the Stripe link). Both now point at the
   correct Stripe Payment Link.

## Infrastructure this depends on

- **Supabase** project `gjyisxcrvknsqyzseost` — `carts` table
  (`user_id uuid PK`, `items jsonb`, `updated_at timestamptz`) with RLS so
  each user only sees their own cart. Publishable key is embedded in
  `auth-widget.js` (safe to expose — it's the anon/publishable key, RLS
  does the actual access control).
- **Vercel** project `g` (team `ga-dgi-tec-hs-arc-hi-tec-ture`), aliased to
  `incomeutopia.com` / `www.incomeutopia.com`. Deploys are a flat static
  file set — no build step, no framework. **Important if you deploy this
  elsewhere:** whatever tool you deploy with must push the COMPLETE file
  set every time; a partial deploy silently drops any file left out from
  production.
- Stripe Payment Links (no Stripe backend/webhook currently) for individual
  product checkout.

## Merging into your other repo

This repo has its own git history starting fresh (no shared history with
your existing build repo), so a normal `git merge` will show everything as
new/conflicting. Simplest approaches:

- **Cherry-pick the files you want**: copy whichever of these files are
  newer/better into your existing repo and commit there, OR
- **Merge histories with `--allow-unrelated-histories`**:
  ```
  cd /path/to/your/existing-repo
  git remote add site-export /path/to/this/repo   # or the .bundle file
  git fetch site-export
  git merge site-export/main --allow-unrelated-histories
  ```
  then resolve any file conflicts against whatever's already in your repo.

No GitHub push was done from this session — there's no valid GitHub token
available in this environment, so this repo/bundle is handed to you as a
file to pull into your own repo locally instead of pushed directly.
