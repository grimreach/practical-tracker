# Practical Tracker Release Process

Use this checklist for every production release.

## 1. Prepare the branch

- Confirm the intended branch and deployment target.
- Run `git status --short --branch` and keep the diff reviewable.
- For user-visible changes, bump all version surfaces:
  - `package.json`
  - `package-lock.json`
  - `src/lib/version.ts`
  - `CHANGELOG.md`

## 2. Database / Prisma

- If `prisma/schema.prisma` or `prisma/migrations/**` changed, production needs:

  ```bash
  npx prisma migrate deploy
  ```

- If no Prisma schema or migration changed, no DB push is needed.
- Do not use `prisma db push` for production when migrations exist.
- For local schema checks run:

  ```bash
  npx prisma validate
  npx prisma generate
  ```

## 3. Quality gate

Run the full gate before tagging or merging:

```bash
npm test
npm run lint
npm run build
git diff --check
```

For Prisma work also run:

```bash
npx prisma validate
npx prisma generate
```

## 4. Deploy on Vercel

- Production updates through the Vercel-connected branch, a manual redeploy, or `vercel --prod`.
- A local `git pull` does not update production by itself.
- Confirm the visible app badge matches the release version.

## 5. Smoke check

After deploy:

- Sign in.
- Confirm the dashboard header/version badge loads.
- Confirm Overview, Matches, Gun Builds, Expenses, Chrono, and Maintenance tabs load.
- If Overview shows `Could not load season overview data.`, check the failed route in browser Network or Vercel Function logs:
  - `/api/matches?limit=200`
  - `/api/expenses`
  - `/api/chrono`
  - `/api/maintenance`

## 6. Data portability

- `/api/export` downloads the signed-in user's Practical Tracker JSON export.
- `/api/import/preview` validates an export payload and returns counts without mutating data.
- Keep import apply/confirm separate from preview so user data is never changed blindly.
