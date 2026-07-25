# Waymark Sprint 2 — Hunt Selection

Open `src/client/index.html` in Chrome.

## Included
- 479 applicant-specific application records generated from V5
- Casey = Adult rows
- Jeremiah = Youth rows
- Search, applicant/priority/status filters, and sorting
- Select one, many, or all visible rows
- Start the Sprint 1 application wizard with selected rows
- Previous Hunt, Skip, Applied, session resume, and CSV updates
- V5 source row included in the wizard and CSV

## Data note
The browser version reads `sample-data.js`, which was generated from the V5 Master Hunt List. It does not yet read an `.xlsx` file directly or write to Google Sheets.

## Temporary exports
Store downloaded update reports under:
`data/application-updates/`

The CSV is a temporary bridge until the Google Apps Script integration.
