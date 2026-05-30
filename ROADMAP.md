# Practical Tracker Roadmap

Last updated: 2026-05-30

Current app version: v0.12.1

## Product direction

Practical Tracker is becoming a practical-shooting command center: match history, stage video review, expense tracking, chrono/load development, and maintenance signals in one clean workspace.

The near-term goal is to make the existing workflows trustworthy for daily use before adding heavy analytics or integrations.

## Version policy

- The app version lives in `package.json`, `package-lock.json`, and `src/lib/version.ts`.
- Every user-visible product change should bump the app version.
- The visible version badge should stay present in the app header so users know what build they are on.
- Use semantic versioning:
  - Patch: fixes, copy updates, small UI refinements.
  - Minor: new user-visible features or meaningful workflow improvements.
  - Major: breaking data model/API changes or large product resets.

## Phase 1 — Finish core UX polish

Status: complete

- [x] Premium dashboard shell and landing page.
- [x] Match hero cards with stage/video drilldown.
- [x] Chrono / load development workspace.
- [x] Maintenance workspace.
- [x] Expense analytics command center.
- [x] Add match search/filter/sort controls.
- [x] Add compact/list toggle for match history.
- [x] Standardize loading, empty, error, and success states across all tabs.
- [x] Complete mobile-first pass for match video review and forms.

Acceptance criteria:

- A shooter can quickly find a prior match, review stage videos, and add new records without UI friction.
- All major tabs feel visually consistent and have useful empty/loading states.

## Phase 2 — Make data safely editable

Status: complete

- [x] Add edit/delete support for expenses.
- [x] Add edit/delete support for chrono entries.
- [x] Add edit/delete support for maintenance entries.
- [x] Add confirmation and recovery-friendly UX for destructive actions.
- [x] Add validation messages close to the relevant fields.

Acceptance criteria:

- Users can correct mistakes without database access.
- Destructive actions are explicit and hard to trigger by accident.

## Phase 3 — Season overview

Status: complete

- [x] Add signed-in Season Overview dashboard.
- [x] Show matches shot, total rounds, total spend, average percentile, current power factor, and maintenance due signals.
- [x] Surface recent matches and stages with video.
- [x] Add recommended next action cards.

Acceptance criteria:

- The first signed-in view answers: “How am I doing, what did I spend, and what needs attention next?”

## Phase 4 — Connect the data model

Status: complete

- [x] Add equipment/firearm profiles with gun photos.
- [x] Add build parts lists with component, model, notes/source, and cost totals.
- [x] Connect stage video review cards to match context, round count, power factor, and notes.
- [x] Link matches to equipment profiles.
- [x] Link chrono/load records to equipment and matches.
- [x] Link expenses to matches/equipment when relevant.
- [x] Use match round counts to drive maintenance reminders.

Acceptance criteria:

- The app can explain relationships between performance, cost, equipment, ammo/load, and maintenance.

## Phase 5 — Scoring and analytics depth

Status: complete

- [x] Add richer stage scoring fields: time, points, hit factor, penalties, stage placement, classifier flag.
- [x] Add charts for spend, rounds, percentile, PF/velocity, and maintenance intervals.
- [x] Add monthly/quarterly/season reports.
- [x] Add “best match / worst match / most expensive month / top load” report cards.

Acceptance criteria:

- Users can review performance and spending trends instead of only individual records.

## Phase 6 — Reliability and release hardening

Status: in progress

- [x] Add automated tests for API routes and core form workflows.
- [x] Add component smoke tests for major dashboard tabs.
- [ ] Resolve dependency audit advisories in a dedicated maintenance PR. Current audit advisories require upstream/breaking package movement, so keep this in a maintenance pass instead of forcing downgrades.
- [x] Document deployment and release process.
- [x] Add import/export workflow for user data.

Acceptance criteria:

- Releases are repeatable, testable, and safer to deploy.

## Phase 7 — Cleanup and feature pass

Status: proposed

- [x] Cleanup pass: make gun build parts more editable by allowing saved part prices to be adjusted inline before saving the build.
- [ ] Cleanup pass: consolidate repeated dashboard card styles, relationship labels, and chart empty states.
- [ ] Feature pass: add PractiScore CSV import preview and confirm flow.
- [ ] Feature pass: add workbook/spreadsheet import as a separate non-overlapping flow.
- [ ] Feature pass: add iOS companion API contracts for authenticated sync.
- [ ] Feature pass: plan Bluetooth chrono capture around normalized chrono/load records.

Acceptance criteria:

- The next features build on the now-connected data model without turning imports or mobile sync into data silos.

## Recommended next PRs

1. `chore: cleanup dashboard patterns` — consolidate duplicated card, empty-state, and relationship UI helpers.
2. `feat: add PractiScore CSV import preview` — parse exported match data before any mutation.
3. `feat: add spreadsheet workbook import` — keep workbook inputs separate from PractiScore imports.
4. `feat: add iOS companion sync contracts` — define authenticated mobile sync against the main account.
