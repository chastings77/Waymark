# Waymark

> “Set thee up waymarks…” — Jeremiah 31:21 (KJV)

Waymark is a private, mobile-first application that guides a family through public-hunt applications without losing place, duplicating work, or missing an opportunity.

## Product philosophy

**Reduce cognitive load.**

Waymark should answer three questions clearly:

1. What should I apply for next?
2. What information do I need for this application?
3. What have I already completed?

## Current milestone

### Trailhead

Trailhead establishes the product decisions, architecture, data contract, repository conventions, and user flow before application code is written.

See [docs/roadmap.md](docs/roadmap.md).

## MVP

The first usable version will:

- Read application candidates from the Hastings V5 Google Sheet.
- Filter the queue by applicant.
- Present one hunt at a time.
- Open the official application site in a separate tab.
- Mark a hunt as applied, skipped, or not applying.
- Record the completion date.
- Resume with the next incomplete hunt.
- Show completed and remaining counts.

## Non-goals for the MVP

- Logging into state systems.
- Automatically filling or submitting state applications.
- Handling payment.
- Scraping private account information.
- Replacing the planning workbook.
- Supporting every state before the first workflow is proven.

## Architecture summary

```text
Mobile browser
    |
    v
Thin Waymark client
    |
    v
Application service
    |
    v
Hunt repository contract
    |
    +--> Google Sheets repository (MVP)
    |
    +--> DBMS repository (future)
```

The sheet owns configuration and rules for the MVP. Client JavaScript remains intentionally simple.

## Repository layout

```text
Waymark/
├── docs/
│   ├── architecture.md
│   ├── coding-standards.md
│   ├── data-model.md
│   ├── glossary.md
│   ├── roadmap.md
│   ├── ui-flow.md
│   └── decisions/
├── src/
│   ├── client/
│   └── server/
├── test/
├── .gitignore
└── README.md
```

## Source workbook reviewed

Trailhead was based on:

`Hastings_Family_Hunting_Legacy_2026_2027_v5(1).xlsx`

The current authoritative hunt table is the **Master Hunt List** sheet. It contains 44 columns and approximately 294 hunt records plus the header row.

## Development workflow

The recommended development path is Google Apps Script synchronized to the repository with `clasp`. Production releases use immutable Apps Script versions and retain one stable web-app URL.

No credentials, TPWD passwords, or Google tokens belong in this repository.
