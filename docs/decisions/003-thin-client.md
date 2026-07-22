# ADR-003: Thin client

- Status: Accepted
- Date: 2026-07-21

## Decision

Client-side JavaScript is intentionally simple.

## Responsibilities

- Render server-provided records.
- Send user commands.
- Navigate the current queue.
- Display progress and errors.
- Open external links.

## Exclusions

The client does not calculate eligibility, priority, deadlines, or application cost and does not identify records by row number.
