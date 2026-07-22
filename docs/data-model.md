# Data Model

## Existing V5 workbook

The workbook currently contains 29 sheets. Waymark’s first data source is the **Master Hunt List**, which contains 44 columns.

The existing columns are:

| # | Column |
|---:|---|
| 1 | Applied |
| 2 | Priority |
| 3 | Species Group |
| 4 | Hunt Area |
| 5 | Region |
| 6 | Hunt Category |
| 7 | Adult |
| 8 | Youth |
| 9 | Application Deadline |
| 10 | Hunt Window |
| 11 | Application Fee |
| 12 | Estimated Permit Fee |
| 13 | Permits/Groups |
| 14 | Applicants Last Year |
| 15 | Draw Odds |
| 16 | Approx Miles from Amarillo |
| 17 | Drive Zone |
| 18 | Camping Notes |
| 19 | Backpack Rating |
| 20 | Past Drawn by Hastings |
| 21 | Notes |
| 22 | Source URL |
| 23 | Odds Score |
| 24 | Distance Score |
| 25 | Youth Fit Score |
| 26 | Camping Score |
| 27 | Backpack Score |
| 28 | Past Draw Bonus |
| 29 | Hastings Score |
| 30 | Estimated Total If Drawn |
| 31 | Deadline Month |
| 32 | Applicant(s) |
| 33 | Date Applied |
| 34 | TPWD Confirmation # |
| 35 | Draw Status |
| 36 | Draw Result Date |
| 37 | Harvest/Outcome |
| 38 | Post-Hunt Notes |
| 39 | Official Category Link |
| 40 | TPWD Area / Brochure Search |
| 41 | TPWD Apply Portal |
| 42 | Google Maps |
| 43 | Preference Adjustment |
| 44 | Priority Reason |

## Required MVP addition

### Hunt ID

A new stable identifier is required.

Recommended format:

```text
TX-2026-AMD-BIG-BEND-RANCH-SP
```

However, IDs must remain stable across edits. Once assigned, an ID must not be regenerated merely because a display name changes.

Recommended properties:

- String.
- Unique.
- Required.
- Immutable after creation.
- Never derived at runtime by the client.
- State-prefixed so the system can expand beyond Texas.

## Operational fields

The MVP should write only these fields:

| Field | Purpose |
|---|---|
| Apply This Season | Include the record in the guided queue |
| Applicant | Person whose queue contains the application |
| Application Status | Not Started, Applied, Skipped, Not Applying |
| Date Applied | Server timestamp when marked Applied |
| Confirmation Number | Deferred from the first thin slice unless needed |
| Last Updated | Server timestamp |
| Updated By | Authenticated account |
| Hunt ID | Lookup only; never changed during normal operation |

The workbook already has several equivalent columns. Trailhead should decide whether to add normalized operational columns to **Master Hunt List** or create a dedicated **Waymark Data** sheet.

## Recommended MVP data boundary

Create a dedicated sheet named:

```text
Waymark Data
```

It should contain one row per application opportunity and only the fields needed by the application.

Advantages:

- The application does not depend on all 44 planning columns.
- The planning workbook can evolve without breaking the app.
- Field names and validation can be normalized.
- A future database migration is easier.

The sheet may initially be populated from Master Hunt List, but the MVP should avoid complex bidirectional formulas until the write path is proven.

## Proposed Waymark Data schema

| Field | Type | Required | Written by app |
|---|---|---:|---:|
| Hunt ID | string | Yes | No |
| Season | string | Yes | No |
| State | string | Yes | No |
| Hunt Area | string | Yes | No |
| Hunt Category | string | Yes | No |
| Species Group | string | Yes | No |
| Applicant | string | Yes | Yes |
| Priority | string | Yes | No |
| Application Deadline | date | Yes | No |
| Application Fee | number | No | No |
| Apply This Season | boolean | Yes | Yes |
| Application Status | enum | Yes | Yes |
| Date Applied | datetime | No | Yes |
| Official Details URL | URL | No | No |
| Apply Portal URL | URL | Yes | No |
| Notes | string | No | No |
| Last Updated | datetime | No | Yes |
| Updated By | string | No | Yes |

## Status values

```text
Not Started
Applied
Skipped
Not Applying
```

“Started” is intentionally omitted from the first MVP unless real use proves it is necessary.

## Audit sheet

Create a separate sheet:

```text
Waymark Application Log
```

Suggested fields:

```text
Event ID
Timestamp
Hunt ID
Applicant
Old Status
New Status
Confirmation Number
Updated By
Notes
```
