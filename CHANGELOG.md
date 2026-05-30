# Changelog

All notable changes to Practical Tracker will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) principles, and the app uses semantic versioning.

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
