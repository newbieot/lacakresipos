# Changelog

## 2026-08-29 — Pop-up Permission Gate

- Added a permission gate that reserves every tab before navigating to a tracking result.
- If any tab is blocked, all reserved test tabs are closed and bulk actions remain locked until permission verification succeeds.
- Added clear permission guidance for desktop, Android, and iPhone/iPad browsers.
- Added a mobile bottom-sheet layout with touch-friendly actions and safe-area spacing.
- Preserved pending bulk and batch requests so they continue without duplicate tracking tabs after permission is allowed.

## 2026-07-25 — Firefox Tab Order & Active Result Fix

- Opened tab slots in reverse creation order to match Firefox/Edge adjacent-tab insertion behavior.
- The final visible tab order now follows the input list from top to bottom.
- The first tracking number is opened last and explicitly focused, so its result is shown first.
- Added a version query to `assets/app.js` to prevent an older cached script from being reused after deployment.
- Applied the same sequence to full-list and batch opening.

## 2026-07-25 — Edge/Chrome Opening Sequence Fix

- Removed the reversed bulk-opening loop.
- Tracking tabs are now requested in the exact input order, from the top row downward.
- This matches Edge/Chrome behavior where each newer background tab is inserted beside the source tab and earlier tabs are pushed to the right.
- Updated the on-page guidance and success message to explain the sequence.

## 2026-07-25 — Tracking Tab Order Fix

- Fixed bulk-opening order so the first tracking number entered appears as the first result tab.
- Applied the same ordering behavior to full-list and batch opening.

## 2026-07-25 — UI/UX Redesign

- Rebuilt the interface as a responsive PosNew Hub tracking workspace.
- Added one-click opening for all tracking result tabs.
- Added a 10-result batch opener as a browser pop-up fallback.
- Added live valid and duplicate tracking-number counters.
- Added parsing for pasted data from Excel, WhatsApp, comma-separated, and whitespace-separated text.
- Added automatic uppercase normalization and duplicate removal.
- Added preview-only mode and individual tracking cards.
- Added copy-all-links fallback.
- Replaced unsafe user-generated HTML rendering with DOM text nodes.
- Added keyboard shortcut: Ctrl/Cmd + Enter to open all results.
- Added privacy messaging, accessibility improvements, SEO metadata, manifest, sitemap, and Cloudflare headers.
