# Waymark — Application Queue Sprint

This sprint is a browser-only prototype of Waymark's guided hunting-application queue.

## Run it

No installation is required.

1. Copy the contents of `src/client/` into your repository's existing `src/client/` folder.
2. Double-click `src/client/index.html`.
3. The page should open in Safari or Chrome.

You may also drag `index.html` directly into a browser window.

## Included behavior

- Applicant and season selection.
- Server-style queue filtering using sample data.
- Queue ordering by priority, deadline, and hunt area.
- One current hunt at a time.
- Official-details and application-portal links.
- Mark a hunt Applied, Skipped, or Not Applying.
- Progress display.
- Sample changes saved in browser local storage.
- Reset sample data.
- Responsive layout for desktop and iPad browsers.

## Important limitations

This sprint does not connect to Google Sheets and does not deploy to Google Apps Script.

The sample data lives in `sample-data.js`. Status changes are stored only in the current browser's local storage.

The existing server files may remain in `src/server/`, but they are not used by this browser-only prototype.

## Suggested review questions

- Is the current-hunt screen showing the right information?
- Are Applied, Skip, and Not Applying the correct first actions?
- Is the queue ordering understandable?
- Should the user see one hunt at a time or more context?
- What information from the workbook is missing from the current card?
