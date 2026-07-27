# Waymark Sprint 4 — Data Integrity

Branch: `feature/sprint-4-data-integrity`

## Included

- Persistent, immutable `Hunt ID` values stored in **Master Hunt List**.
- Saves locate hunts by Hunt ID, not by visible row number.
- Repeatable migration through `setupWaymarkSheet()`.
- Duplicate and missing Hunt ID validation through `validateWaymarkData()`.
- Youth applicant fee rule: Jeremiah's application fee is always `$0.00` in Waymark; the spreadsheet value is preserved.
- `Waymark Application Log` audit sheet for every save.
- `Waymark Last Updated` and `Waymark Updated By` columns.
- Existing applicant-specific save verification and legacy-column synchronization retained.

## Deploy / migrate

1. Create and switch to the Sprint 4 branch using the Git commands below.
2. Copy the files in `src/server` into the Apps Script project.
3. In the Apps Script editor, run `setupWaymarkSheet()` once and authorize it.
4. Inspect the result in the execution log. It reports added columns and the count of assigned IDs.
5. Run `validateWaymarkData()`; it must return `ok: true`.
6. Deploy a new test version of the web app.
7. Test Casey and Jeremiah saves on a copy of the live spreadsheet.
8. Sort or move rows, reload Waymark, and verify the same hunt is updated.
9. Confirm Jeremiah fees display as `$0.00`, including rows whose spreadsheet fee is `$3.00`.
10. Confirm saves append a row to `Waymark Application Log`.

## Important migration behavior

`setupWaymarkSheet()` never replaces an existing Hunt ID. New IDs are assigned only to blank Hunt ID cells. Therefore, changing an area's display name or sorting rows does not change identity.

The client still receives `sourceRow` for display and CSV export, but the server ignores it when saving.

## Git commands

```bash
git switch main
git pull --ff-only
git switch -c feature/sprint-4-data-integrity
```

Older Git alternative:

```bash
git checkout main
git pull --ff-only
git checkout -b feature/sprint-4-data-integrity
```
