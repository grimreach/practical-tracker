# Changelog

All notable changes to Practical Tracker will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles, and the app uses semantic versioning.

## [0.14.2] - 2026-05-30

### Changed

- Standardized firearm and match relationship labels across match, chrono, and expense dashboard timelines/cards.
- Added reusable dashboard relationship label helpers and tests so future dashboards present linked records consistently.
- Bumped app version from `0.14.1` to `0.14.2`.

## [0.14.1] - 2026-05-30

### Changed

- Consolidated repeated dashboard metric, badge, stat, field, and empty-state helper components into shared dashboard UI primitives.
- Added a smoke test to keep major dashboard tabs using the shared UI primitives instead of local helper copies.
- Bumped app version from `0.14.0` to `0.14.1`.

## [0.14.0] - 2026-05-30

### Added

- Added a confirmed PractiScore CSV import apply endpoint at `/api/import/apply` using `workflow: "practiscore-csv-v1"` plus explicit `confirm: true` safety.
- Added a signed-in Matches dashboard import card for uploading, previewing, and applying PractiScore CSV exports.
- Added PractiScore CSV import planning for match/stage creation payloads, duplicate skipping, missing-date blocking, and framework-free apply-plan tests.

### Changed

- Advanced the Phase 7 PractiScore import track with preview, backend confirm/apply support, and dashboard UI wiring complete.
- Bumped app version from `0.13.0` to `0.14.0`.

## [0.13.0] - 2026-05-30

### Added

- Added PractiScore CSV import preview support to `/api/import/preview` using `workflow: "practiscore-csv-v1"`.
- Added CSV preview parsing for match counts, stage counts, sample stages, and detected scoring fields before any data mutation.
- Added framework-free tests for PractiScore CSV preview acceptance and empty-file rejection.

### Changed

- Advanced the Phase 7 PractiScore import track with preview complete and confirm/apply still pending.
- Bumped app version from `0.12.1` to `0.13.0`.

## [0.12.1] - 2026-05-30

### Fixed

- Made existing gun build part prices editable inline while editing a build, so saved part prices can be corrected without removing and re-adding the part.

### Changed

- Added the gun build price editing cleanup item to Phase 7.
- Bumped app version from `0.12.0` to `0.12.1`.

## [0.12.0] - 2026-05-30

### Added

- Added season analytics cards for best match, hardest match, most expensive month, and top load.
- Added monthly trend charts for spend, rounds, percentile, power factor, and maintenance intervals.
- Added monthly and quarterly report builders with framework-free tests.
- Added maintenance reminders that include match rounds fired after the latest maintenance log.
- Added signed-in JSON export at `/api/export`.
- Added import preview validation at `/api/import/preview` so exports can be checked before any data mutation.
- Added `RELEASE.md` with the release, Prisma migration, Vercel deployment, smoke-check, and data portability process.
- Added Phase 7 cleanup/features pass to the roadmap.

### Changed

- Marked Phase 4 and Phase 5 complete in the roadmap.
- Marked release documentation and import/export workflow complete in Phase 6 while keeping dependency audit remediation in a dedicated maintenance pass.
- Bumped app version from `0.11.0` to `0.12.0`.

## [0.11.0] - 2026-05-30

### Added

- Linked matches to firearm/build profiles from the Match History form and match cards.
- Linked chrono/load records to firearm/build profiles and related matches.
- Linked expenses to firearm/build profiles and related matches.
- Added a database migration for expense and chrono match/equipment relationships.
- Added PractiScore import to the roadmap as the next integration track, starting with CSV/export upload before URL import.

### Changed

- Included linked gun and match context in expense and chrono timelines.
- Bumped app version from `0.10.1` to `0.11.0`.

## [0.10.1] - 2026-05-29

### Added

- Added Phase 6 dashboard component smoke contracts for every major signed-in tab: Overview, Matches, Gun Builds, Expenses, Chrono, and Maintenance.
- Added framework-free component smoke tests that verify each tab contract, API dependency, component export, primary heading, and empty-state anchor.

### Changed

- Wired the dashboard tab registry to the smoke contracts so tab labels/descriptions and tests share one source of truth.
- Added stable dashboard tab smoke targets for future browser or component smoke paths.
- Bumped app version from `0.10.0` to `0.10.1`.

## [0.10.0] - 2026-05-29

### Added

- Started Phase 6 reliability hardening with API create-contract tests for expenses, chrono entries, and maintenance logs.
- Added shared API route contract helpers that validate payloads and build Prisma create data before routes hit the database.
- Added tests covering invalid expense payloads, invalid chrono velocities, empty maintenance actions, safe maintenance defaults, blank expense URLs, and chrono power-factor calculation.

### Changed

- Bumped app version from `0.9.0` to `0.10.0`.

## [0.9.0] - 2026-05-29

### Added

- Added Phase 5 richer stage scoring fields for points, time, penalties, stage placement, field size, and classifier flag.
- Added automatic hit factor calculation from points and stage time.
- Added stage scoring summaries to the Match History video review cards.
- Added a database migration for the new stage scoring fields.
- Added framework-free tests for hit factor calculation, stage score normalization, summary labels, and fallback states.

### Changed

- Bumped app version from `0.8.1` to `0.9.0`.

## [0.8.1] - 2026-05-29

### Fixed

- Improved dark-theme contrast for stage detail panels below Match History YouTube embeds.
- Replaced light card surfaces in dark mode with theme-safe stage review panels while preserving the clean light theme.

### Changed

- Bumped app version from `0.8.0` to `0.8.1`.

## [0.8.0] - 2026-05-29

### Added

- Added stage detail context around Match History YouTube hero cards, including stage position, match context, date, video status, round context, load signal, and review notes.
- Added framework-free tests for stage review detail labels, video status, and graceful fallback copy.

### Changed

- Bumped app version from `0.7.0` to `0.8.0`.

## [0.7.0] - 2026-05-29

### Added

- Added a signed-in Season Overview dashboard as the first workspace tab.
- Added season metrics for matches shot, total rounds, total spend, average percentile, current power factor, maintenance status, and video-ready stages.
- Added recent match cards, recent stage video links, and recommended next action cards driven by match, expense, chrono, and maintenance data.
- Added framework-free tests for season overview metric aggregation, maintenance signals, video stage selection, and next-action recommendations.

### Changed

- Bumped app version from `0.6.0` to `0.7.0`.

## [0.6.0] - 2026-05-29

### Added

- Added a Gun Builds workspace for firearm/equipment profiles, build photos, active/archive state, build notes, and discipline tags.
- Added build parts lists with component type, brand/model, notes/source, per-part retail price, and calculated build totals.
- Added a 9mm PCC template based on the uploaded workbook so the existing parts sheet can seed a new build without duplicating other workspaces.
- Added authenticated create/update/delete API routes for gun builds and nested build parts.
- Added framework-free tests for gun build form conversion, validation, part ordering, and total calculation.

### Changed

- Bumped app version from `0.5.0` to `0.6.0`.

## [0.5.0] - 2026-05-29

### Added

- Added edit and delete flows for expenses, chrono entries, and maintenance logs.
- Added confirmation prompts before destructive deletes across Phase 2 workspaces.
- Added field-level validation messages for editable expense, chrono, and maintenance forms.
- Added API update/delete routes for expense, chrono, and maintenance records.
- Added framework-free tests for editable form state, validation, save replacement, and delete list behavior.

### Changed

- Bumped app version from `0.4.2` to `0.5.0`.

## [0.4.2] - 2026-05-29

### Fixed

- Fixed light mode form fields and dropdown menus so inputs use bright surfaces instead of dark-mode panels.
- Bumped app version from `0.4.1` to `0.4.2`.

## [0.4.1] - 2026-05-29

### Changed

- Reworked the match card filter bar into a two-row layout with cleaner spacing and responsive wrapping.
- Bumped app version from `0.4.0` to `0.4.1`.

## [0.4.0] - 2026-05-29

### Added

- Added a persistent light/dark theme switch in both signed-in and signed-out headers.
- Added startup theme hydration so the saved preference applies before the UI paints.
- Added unit coverage for theme selection and toggling helpers.

### Changed

- Added a warm light palette while preserving the existing premium dark default.
- Bumped app version from `0.3.0` to `0.4.0`.

## [0.3.0] - 2026-05-29

### Added

- Added match history search across match names, clubs, notes, and stage details.
- Added discipline and tier filters plus newest, oldest, percentile, and rounds-used sorting.
- Added card/list layout toggle for match history.
- Added reusable match history helper tests with `npm test`.

### Changed

- Improved match empty/loading/filter states and save/delete success feedback.
- Tightened mobile layouts for match cards, stage review forms, and match detail actions.
- Marked Phase 1 core UX polish complete in the roadmap.
- Bumped app version from `0.2.0` to `0.3.0`.

## [0.2.0] - 2026-05-29

### Added

- Added `ROADMAP.md` with the near-term product roadmap and release phases.
- Added `MEMORY.md` with durable project context, design conventions, engineering conventions, and release checklist.
- Added `CHANGELOG.md` as the canonical release history.
- Added centralized app version constants in `src/lib/version.ts`.
- Added visible version badges to the app header and signed-out landing header.

### Changed

- Bumped app version from `0.1.0` to `0.2.0`.
- Documented that user-visible product changes should include a version bump and changelog entry.

## [0.1.0] - Initial development

### Added

- Initial Practical Tracker application foundation.
- GitHub authentication flow.
- Match logging workspace.
- Expense logging workspace.
- Premium dashboard shell and landing page.
- Chrono / load development workspace.
- Maintenance workspace.
- Match stage video drilldown with embedded YouTube playback.
- Expense analytics command center.
