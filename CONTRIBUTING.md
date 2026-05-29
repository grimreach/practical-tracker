# Contributing to Practical Tracker

Thanks for wanting to help build this. A few ground rules to keep the codebase clean and the PRs fast to review.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/practical-tracker
cd practical-tracker
npm install
cp .env.example .env.local   # fill in your dev credentials
npm run db:push
npm run dev
```

## Branch naming

```
feature/practiscore-import
fix/chrono-pf-calculation
chore/update-dependencies
docs/add-api-examples
```

## Pull Request checklist

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] New API routes validated with Zod
- [ ] No secrets or `.env` files committed
- [ ] PR description explains what it does and why

## What we're looking for

- New discipline support with correct scoring rules
- Import/export integrations (Practiscore CSV is the big one)
- UI improvements that don't bloat the bundle
- Mobile experience improvements
- New chart types or stat cards on the dashboard
- Bug fixes with a clear repro case in the PR description

## What we'll decline

- Dependencies that duplicate existing functionality
- Features that only apply to one person's very specific setup
- UI rewrites without prior discussion in an Issue

## Questions?

Open an Issue and tag it `question`. We're friendly.
