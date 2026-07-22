# Guided Application UI Flow

## Entry screen

```text
WAYMARK

Applicant: [ Casey v ]
Season:    [ 2026–2027 v ]

12 remaining
6 completed

[ Continue Applications ]
[ Review Queue ]
```

## Current application screen

```text
Application 7 of 18

CAPROCK CANYONS STATE PARK
Gun Mule Deer

Applicant: Casey
Priority: A
Deadline: August 15, 2026
Fee: $3

Notes:
High-value public-land mule deer opportunity.

[ Open Application Site ]

[ Mark Applied ]
[ Skip for Now ]
[ Not Applying ]

[ Previous ]                      [ Next ]
```

## Open-link behavior

- Open the official application portal or category page in a separate tab.
- Do not automatically change status.
- Keep the current Hunt ID in the server-backed session or URL state.
- When the user returns, show the same hunt.

## Mark Applied

1. Ask for confirmation.
2. Send Hunt ID and `Applied` command.
3. Server locates the row by Hunt ID.
4. Server writes status and timestamp.
5. Server appends an audit event.
6. Client displays `Saved`.
7. Client advances to the next incomplete hunt.

## Skip for Now

- Does not mark the application complete.
- Moves the record to the end of the current session queue.
- The persistent record remains `Not Started`.
- Avoid a permanent `Skipped` status for “come back later”; reserve `Skipped` for an intentional completion state only if user testing supports it.

## Not Applying

- Requires confirmation because it removes the record from the remaining queue.
- Writes `Not Applying`.
- Appends an audit event.
- Advances to the next hunt.

## Resume behavior

The default resume target is the first record satisfying:

```text
Apply This Season = true
AND Applicant = selected applicant
AND Application Status = Not Started
ORDER BY Priority, Deadline, Hunt Area
```

The exact queue ordering is owned by sheet fields or server-side configuration, not by the client.

## Error behavior

If a save fails:

- Do not advance.
- Keep the current hunt visible.
- Show a plain-language error.
- Offer Retry.
- Never optimistically mark a hunt complete without server confirmation.
