# Waymark Sprint 3 — Google Sheets Integration

Sprint 3 turns the Sprint 2 browser prototype into a Google Apps Script web app. The hunt list is read live from the **Master Hunt List** sheet, and each wizard action is written back before Waymark advances.

## What Sprint 3 saves

Waymark automatically adds these columns to the right side of **Master Hunt List** the first time it runs:

- Casey Application Status
- Casey Date Applied
- Casey Confirmation #
- Jeremiah Application Status
- Jeremiah Date Applied
- Jeremiah Confirmation #

This is necessary because one Master List row can represent both an adult and a youth application. Casey can therefore be marked Applied while Jeremiah remains Not Started or Skipped.

The existing shared columns are also maintained:

- **Applied** becomes `Yes` only after every eligible applicant on that row is Applied.
- **Date Applied** receives the latest applicant application date after all eligible applicants are Applied.
- **TPWD Confirmation #** combines the named applicant confirmations after all eligible applicants are Applied.

## Recommended setup: spreadsheet-bound Apps Script

1. Upload or convert the V5 workbook into Google Sheets.
2. Confirm the tab is named exactly `Master Hunt List`.
3. In that Google Sheet, open **Extensions → Apps Script**.
4. Add the following project files from `src/server/`:

   - `Code.gs`
   - `SpreadsheetRepository.gs`
   - `Index.html`
   - `Styles.html`
   - `Client.html`
   - `appsscript.json`

5. In Apps Script, open **Project Settings** and enable **Show "appsscript.json" manifest file in editor** if needed.
6. Replace the generated manifest with the included `appsscript.json`.
7. Save the project.
8. Run `setupWaymarkSheet` once from the Apps Script editor.
9. Approve the Google Sheets permission request.
10. Confirm the six applicant-specific columns appeared on the right side of the Master Hunt List.

## Deploy the web app

1. Click **Deploy → New deployment**.
2. Choose **Web app**.
3. Description: `Waymark Sprint 3`.
4. Execute as: **Me**.
5. Who has access: choose the narrowest option that lets Casey and Jamie use it. For a personal Google account, this is usually **Anyone with a Google account**.
6. Click **Deploy** and approve permissions.
7. Open the provided web-app URL.

Use the deployed URL instead of opening `src/client/index.html`. Apps Script web apps require a `doGet()` entry point and use asynchronous `google.script.run` calls to communicate with server functions.

## Test before real applications

Use one unimportant or already-completed record first:

1. Select one hunt.
2. Start Applying.
3. Enter a recognizable test confirmation such as `WAYMARK-TEST`.
4. Click **Save Applied & Next**.
5. Verify the applicant-specific status, date, and confirmation were written to the expected Master List row.
6. Change the record back in the sheet if it was only a test.

## Updating the deployment after future code changes

Apps Script web-app deployments do not automatically use every saved code edit.

1. Save the changed Apps Script files.
2. Open **Deploy → Manage deployments**.
3. Edit the Waymark deployment.
4. Choose **New version**.
5. Deploy again.

The web-app URL normally remains the same.

## Source folders

- `src/server/` — deployable Google Apps Script application
- `src/client/` — local placeholder and retained sample data from Sprint 2
- `data/application-updates/` — optional downloaded session reports/backups
