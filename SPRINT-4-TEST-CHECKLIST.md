# Sprint 4 Test Checklist

## Migration
- [ ] Run `setupWaymarkSheet()` on a copy of the live workbook.
- [ ] Confirm `Hunt ID`, `Waymark Last Updated`, and `Waymark Updated By` exist.
- [ ] Confirm all populated hunt rows have a Hunt ID.
- [ ] Run `setupWaymarkSheet()` a second time and confirm no existing IDs change.
- [ ] Run `validateWaymarkData()` and confirm `ok: true`.

## Stable identity
- [ ] Load Waymark and note a hunt's Hunt ID.
- [ ] Sort or move that hunt's spreadsheet row.
- [ ] Reload Waymark and save the hunt.
- [ ] Confirm the intended hunt—not the old row position—was updated.
- [ ] Rename the hunt area and confirm its stored Hunt ID remains unchanged.

## Applicant fees
- [ ] Open a Jeremiah hunt whose sheet fee is `$3.00`.
- [ ] Confirm Waymark displays `$0.00`.
- [ ] Confirm selected-hunt totals use `$0.00`.
- [ ] Confirm Casey still sees the spreadsheet fee.
- [ ] Confirm the spreadsheet's original fee cell is unchanged.

## Saves and audit
- [ ] Save Applied for Casey.
- [ ] Save Applied for Jeremiah.
- [ ] Save Skipped for either applicant.
- [ ] Confirm applicant-specific columns are correct.
- [ ] Confirm legacy columns remain synchronized.
- [ ] Confirm every save appends one audit-log row.
- [ ] Confirm the audit row includes Hunt ID, applicant, old/new status, timestamp, and user.

## Failure handling
- [ ] Temporarily duplicate a Hunt ID and confirm loading/validation fails clearly.
- [ ] Remove a Hunt ID and confirm `setupWaymarkSheet()` restores it.
- [ ] Submit a stale/nonexistent Hunt ID and confirm no row is changed.
