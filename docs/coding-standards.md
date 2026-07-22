# Coding Standards

## Principles

- Prefer clarity over cleverness.
- Keep client JavaScript thin.
- Put data access behind repository functions.
- Use explicit commands for writes.
- Treat Hunt ID as the only record identity.
- Fail visibly and preserve user position.
- Add features only when they reduce cognitive load.

## JavaScript

- Use modern JavaScript supported by Google Apps Script V8.
- Use `const` by default and `let` only when reassignment is required.
- Avoid `var`.
- Use camelCase for variables and functions.
- Use PascalCase for classes and constructor functions.
- Use SCREAMING_SNAKE_CASE only for true constants.
- Avoid magic strings; centralize status values.
- Keep functions small and single-purpose.
- Return plain serializable objects across the Apps Script client/server boundary.
- Do not pass raw sheet ranges or row numbers to the client.

## Errors

- Throw errors with context on the server.
- Convert server errors to plain-language messages at the UI boundary.
- Do not swallow exceptions.
- Never advance the wizard after a failed write.

## Data writes

- Locate by Hunt ID.
- Validate Hunt ID uniqueness.
- Validate status values.
- Re-read current status before writing.
- Write the smallest possible cell range.
- Append an audit event after a successful update.
- Make repeated identical commands safe where practical.

## HTML and CSS

- Mobile-first.
- Large tap targets.
- High contrast.
- No horizontal scrolling in the wizard.
- Use semantic elements.
- Do not depend on hover.
- Keep the primary action visually obvious.
- Do not overload each screen with spreadsheet detail.

## Tests

Initial test priorities:

1. Hunt ID lookup.
2. Duplicate Hunt ID detection.
3. Queue ordering.
4. Status transition validation.
5. Correct row update after sheet sorting.
6. Audit-log append.
7. Failed write does not advance client state.

## Comments

Comment why, not what. Use documentation for architectural intent and code comments for non-obvious constraints.
