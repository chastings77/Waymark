# ADR-002: Sheet owns MVP rules

- Status: Accepted
- Date: 2026-07-21

## Decision

Google Sheets owns hunt configuration and rule data during the MVP.

## Consequences

Priority, applicant, season, deadline, fee, eligibility indicators, URLs, and queue inclusion are data rather than client code.

A future DBMS may replace Sheets without changing the client workflow.
