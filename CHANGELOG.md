# Changelog

All notable changes to Practical Tracker will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles, and the app uses semantic versioning.

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
