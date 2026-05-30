# Practical Tracker Memory

This file records durable project context and conventions for contributors and future AI sessions. It should stay compact and factual. Temporary task progress belongs in issues, PRs, or the changelog instead.

## Product identity

- Practical Tracker is an open-source match tracker for practical shooting competitors.
- The product should feel like a clean shooter command center, not a generic CRUD dashboard.
- Core workflows: matches, stage review videos, expenses, chrono/load development, and maintenance.

## Design conventions

- Use a premium dark/neutral dashboard aesthetic inspired by Linear-style clarity: restrained typography, calm surfaces, subtle borders, and focused information hierarchy.
- Keep main list views scannable. Move dense secondary detail into drilldowns or focused panels.
- For match history, the main view should prioritize hero cards and stats; stage lists and embedded videos belong in the match detail view.
- Preserve useful operational signals at the top of each workspace with summary cards.
- Maintain strong mobile usability because match notes and videos may be captured or reviewed at the range.

## Engineering conventions

- Next.js App Router project under `src/app`.
- Prisma schema lives in `prisma/schema.prisma`.
- Shared constants live in `src/lib/constants.ts`.
- App version lives in three places and must stay synchronized:
  - `package.json`
  - `package-lock.json`
  - `src/lib/version.ts`
- User-visible product changes should bump the app version and add a `CHANGELOG.md` entry.
- The visible app version badge should remain in the UI.
- Avoid unrelated dependency churn in UI/product PRs.
- Do not run `npm audit fix --force` as part of feature work; handle breaking dependency fixes separately.

## Current known audit context

`npm audit --audit-level=moderate` has shown existing moderate advisories involving `@hono/node-server` through Prisma dev tooling and `postcss` through Next. The suggested force fixes are breaking and should be handled in a dedicated dependency maintenance PR.

## Release checklist

Before opening or merging a product PR:

1. Update the version when the change is user-visible.
2. Add or update `CHANGELOG.md`.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Run `npm audit --audit-level=moderate` and document known advisories if they remain.
6. Confirm Vercel preview/deployment status after pushing.
