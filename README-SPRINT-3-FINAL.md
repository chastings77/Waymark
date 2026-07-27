# Sprint 3 Final — Verified Google Sheets Saves

This patch completes Sprint 3 on the `google-sheets-integration` branch.

## Important fixes

- Every application save now returns a server-generated receipt.
- The client verifies Hunt ID, source row, applicant, status, date, and confirmation number before advancing.
- The wizard cannot show the completion screen until every selected record has a confirmed save receipt.
- Completion shows the Google Sheet row for every confirmed application.
- `Styles.html` and `Client.html` include their required `<style>` and `<script>` wrappers.

## Update Apps Script

Use the exact-file clipboard method:

```bash
pbcopy < src/server/Client.html
pbcopy < src/server/SpreadsheetRepository.gs
pbcopy < src/server/Styles.html
pbcopy < src/server/Index.html
```

Paste each into the matching Apps Script file, save, then deploy a **New version** from **Deploy → Manage deployments**.

## Test before merge

Select four mixed Cross Bar records and process all four in one session. The final screen must list four checkmarks and four spreadsheet row numbers. Confirm all four applicant-specific records in the sheet before merging.
