# Bulk Tracking Antaran — PosNew Hub

Static Cloudflare Pages utility for opening PosIND delivery location and photo results for multiple tracking numbers.

## Main UX features

- Paste tracking numbers from Excel, WhatsApp, or plain text.
- Accept newline, comma, semicolon, tab, and space separators.
- Normalize uppercase values and remove duplicates.
- Open all tracking results in separate tabs with one click, requested from the top input row downward.
- Detect blocked pop-ups before navigating any tracking tab, lock bulk actions, and show desktop/Android/iOS permission guidance until a retry succeeds.
- Open results in batches of up to 10 when browsers limit pop-ups.
- Preview individual results and copy all tracking links.
- Tracking numbers are processed only in the browser.

## Deploy

No build command is required. Upload the repository to GitHub and connect it to Cloudflare Pages using the repository root as the output directory.
