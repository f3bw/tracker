# tracker

Personal fitness log — a minimal, self-hosted Strava replacement. Log activities manually or import Garmin FIT files (with GPS route preview), track shoe mileage, see simple stats. Multi-user with password login.

Next.js · Turso (SQLite) · CSS Modules · no UI libraries.

## Setup

```bash
pnpm install
cp .env.example .env.local        # fill in the values
pnpm add-user <name> <password>   # create your account
pnpm dev
```

For offline local dev, `.env.local` can use `TURSO_DATABASE_URL=file:data/tracker.db` with no auth token.

## Deploy (Vercel + Turso)

1. `turso db create tracker`, then `turso db show tracker --url` and `turso db tokens create tracker`
2. Push to GitHub, import the repo in Vercel
3. Set env vars in Vercel: `SESSION_SECRET` (`openssl rand -hex 32`), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
4. Create accounts locally with `pnpm add-user` (with `.env.local` pointed at the remote db), then log in from any device — sessions last 90 days

## Your data

- **Export**: `/export` (linked from the stats page) downloads all your activities and gear as JSON.
- **Original FIT files** are kept alongside imported activities — download them from the activity page. Nothing is locked into this app's schema.
- **Backups are your job**: `turso db shell tracker .dump > backup.sql` on a cron, or grab the JSON export periodically.

## Notes

- Accounts are created via CLI only; there is no public signup.
- Login is rate-limited (5 failures → 1 minute lockout).
- No schema migrations: new tables appear automatically, but changing an existing table means altering it yourself in `turso db shell`.
- `pnpm test` runs the small node:test suite.
