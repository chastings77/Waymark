# Architecture

## Context

Waymark is a guided workflow layered over an existing hunting-planning workbook. The workbook remains useful for strategy, research, history, budgets, and family records. Waymark provides the operational application-season experience.

## Architectural goals

- Work well from an iPad browser.
- Preserve the Google Sheet as the editable source of truth during the MVP.
- Keep business-rule data out of client JavaScript.
- Update records by stable Hunt ID, never by visible row number.
- Allow the sheet repository to be replaced by a DBMS later.
- Avoid automating login, payment, or final submission.
- Preserve a reviewable history of status changes.

## Logical components

### Client

Responsibilities:

- Render the queue and current hunt.
- Request data from the server.
- Open official state links.
- Send explicit status-change commands.
- Display progress, errors, and save confirmation.

The client does not determine eligibility, priority, deadlines, fees, or which hunts belong in the queue.

### Application service

Responsibilities:

- Request the application queue.
- Validate allowed status transitions.
- Advance to the next eligible record.
- Record application events.
- Return client-safe view models.

### Hunt repository contract

Initial operations:

```text
getApplicationQueue(applicant, season)
getHunt(huntId)
updateApplicationStatus(command)
appendApplicationEvent(event)
```

### Google Sheets repository

Responsibilities:

- Read the operational data table.
- Map sheet rows into domain records.
- Find records by Hunt ID.
- Write only approved operational columns.
- Append audit events.

### Future DBMS repository

A future implementation may use PostgreSQL, SQLite, Firestore, or another DBMS while preserving the application-service contract.

## Deployment

```text
GitHub repository
      |
      | clasp push
      v
Google Apps Script project
      |
      +--> Development deployment / test sheet
      |
      +--> Production versioned deployment / live sheet
```

Production should use a stable deployment URL. A release creates a new Apps Script version and updates the existing production deployment.

## Security and privacy

- Deploy initially for Casey’s Google account only.
- Execute as the authenticated owner.
- Store no hunting-site credentials.
- Do not commit `.clasp.json` when it contains project-specific identifiers unless the repository remains private and that decision is explicit.
- Use Apps Script properties for environment-specific spreadsheet IDs.
- Never accept a row number from the client as the identity of a hunt.

## Reliability

- Every write is keyed by Hunt ID.
- The server rereads the record before updating it.
- Writes are limited to operational fields.
- Every status change creates an audit event.
- Development uses a copy of the live sheet.
- The UI displays save success before advancing.
