# ADR-004: Replaceable repository

- Status: Accepted
- Date: 2026-07-21

## Decision

Application services access hunt data through a repository boundary.

## Rationale

The Google Sheet is appropriate for the MVP and iPad workflow, but persistence may later move to a DBMS. Data access must not be scattered throughout UI or workflow code.
