# CLAUDE.md

Personal fitness tracker (Strava replacement) for a handful of users. Next.js 16 App Router + Turso (libSQL). Built lazy on purpose: smallest thing that works, no speculative abstractions.

## Commands

```bash
pnpm dev                          # dev server (needs .env.local, see .env.example)
pnpm build                        # production build
pnpm test                         # node:test suite in test/
pnpm add-user <name> <password>   # create an account (no signup page, on purpose)
```

## Architecture

- `src/lib/db.ts` — libSQL client + all queries as plain async functions. Schema is created via `CREATE TABLE IF NOT EXISTS` on first query (no migrations — schema changes to existing tables need a manual `turso db shell` step). Every activity/shoe row has a `user_id`; **every query filters by it**. The sport enum is enforced by a DB CHECK constraint, not app code.
- `src/lib/actions.ts` — all mutations as server actions. Pages are server components; forms are plain `<form action={...}>` with native inputs. No API routes, no client fetch.
- `src/features/<name>/` — each screen's UI + data fetching as a server component (`@layer pages` module css alongside); `src/app/**/page.tsx` files are thin route wrappers (route config, params) that render the feature. `src/components/` is only for shared components (`@layer components`). Base table styling is global element CSS in `globals.css`; feature css holds only deltas.
- **Auth**: stateless. Cookie = `<userId>.<hmac(userId, SESSION_SECRET)>` (`src/lib/auth.ts`, Web Crypto so it runs in the edge proxy). `src/proxy.ts` redirects everything but `/login` when it doesn't verify. Passwords are scrypt-hashed in `src/lib/password.ts` (node-only — never import it from `proxy.ts` or client code). Rotating `SESSION_SECRET` = global logout.
- **FIT upload** (`src/lib/fit.ts`): fit-file-parser already converts GPS semicircles to degrees (`formatByType` handles `sint32`) — do NOT convert again, only round. Beware: `lengthUnit: 'km'` also converts altitude/ascent to km (multiply back ×1000). Routes are downsampled to ≤500 points, stored as JSON on the activity, rendered by `route-svg` as a plain SVG polyline (no map library, deliberate). Session metrics (ascent, calories, HR, cadence — run/walk cadence doubled from Garmin's per-leg value) and per-record series (alt/hr/pace/cad, ≤200 points) are stored as display-only JSON in the `metrics`/`series`/`laps` columns and charted by the `sparkline` component; pace is always derived (`duration_min / distance_km`), never stored.
- **Gear**: shoes and watches live in one table (historically named `shoes`, discriminated by `kind`). Shoes are assigned via `shoe_id` (run/walk), watches via `watch_id` (any sport); both reassignable from the activity detail page.

## Styling (same convention as ../blog-26)

- `src/styles/globals.css`: `@layer reset, preflight, global, pages, components, overrides;` first line; grayscale tokens only — no accent color, no shadows, no gradients; system font stack.
- **globals.css must be the first import in `src/app/layout.tsx`** (before any component import) — layer order is fixed by first occurrence, so if a component's module css loads first, `components` sorts before `global` and the reset's `* { margin: 0 }` silently beats component margins.
- Co-located `*.module.css` per component wrapped in `@layer components { }`; page styles in `@layer pages { }`. No Tailwind, no UI library.
- kebab-case files and folders under `src/`.

## Environment

Four vars, documented in `.env.example`. Local dev can use `TURSO_DATABASE_URL=file:data/tracker.db` (offline, gitignored). Production (Vercel) uses the remote Turso URL + auth token.
