# Waymark Roadmap

Waymark uses hiking language for product milestones while retaining conventional semantic versions for releases.

## Trailhead — Foundation

**Purpose:** Make implementation predictable before writing application code.

Deliverables:

- Product name and philosophy.
- MVP scope and non-goals.
- Repository conventions.
- Architecture.
- Data-model review.
- Repository boundary.
- Guided-flow specification.
- Coding standards.
- Architectural decision records.
- Test and production environment plan.

Exit criteria:

- Another developer can explain the product and architecture from the repository alone.
- The V5 source fields are documented.
- Hunt ID strategy is approved.
- The MVP queue and status transitions are unambiguous.

## First Waymark — Read the trail

**Goal:** Prove that the app can read and display hunt records.

Deliverables:

- Apps Script project scaffold.
- Google Sheets repository read path.
- Applicant and season selection.
- Mobile hunt-card view.
- Queue count and ordering.
- Development deployment using a copied workbook.

Release target: `v0.1.0`

## Second Waymark — Guided queue

**Goal:** Complete the wizard experience without live writeback.

Deliverables:

- Previous and next navigation.
- Resume behavior.
- Open official application link.
- Skip-for-now session behavior.
- Empty and completed states.

Release target: `v0.2.0`

## Third Waymark — Leave a mark

**Goal:** Safely update the sheet.

Deliverables:

- Mark Applied.
- Mark Not Applying.
- Date and user stamping.
- Hunt ID lookup.
- Application audit log.
- Save confirmation and retry behavior.

Release target: `v0.3.0`

## Field Test — Real application batch

**Goal:** Use Waymark for a small, real group of applications.

Deliverables:

- Test with Caprock-area hunts or another controlled set.
- Record friction and defects.
- Fix iPad/Brave issues.
- Validate that no applications are lost or duplicated.
- Confirm that the process is meaningfully less painful.

Release target: `v0.4.0`

## Base Camp — MVP release

**Goal:** Dependable use for the complete application season.

Possible additions only when proven necessary:

- Confirmation number entry.
- Application-cost totals.
- Deadline warnings.
- Better queue filters.
- Session summary.

Release target: `v1.0.0`

## Beyond Base Camp

Potential directions:

- Additional states.
- Point-purchase workflows.
- DBMS persistence.
- Family accounts and roles.
- Draw-result tracking.
- Annual rollover.
- State adapters.
- Packing, scouting, and hunt-journal integration.

These are not commitments until MVP use reveals the true constraint.
