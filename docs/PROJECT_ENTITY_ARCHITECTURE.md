# Project Entity Architecture

## Goal

ProjectSignal must reason about **projects**, not isolated source records.

A permit, tender, planning publication and news article can describe the same physical construction project. The Project Entity layer clusters those records into one canonical object with a timeline and source provenance.

## Runtime flow

1. `/api/live-projects` ingests and normalises public NL/BE signals.
2. `/api/projects` receives the active customer product profile.
3. `lib/project-entity.ts` clusters similar records into canonical projects using:
   - country
   - normalised project title
   - token overlap / Jaccard similarity
   - buyer/account similarity
   - containment checks for longer project names
4. Each canonical project gets:
   - stable heuristic ID
   - current stage
   - best known account
   - product matches
   - opportunity score
   - data-confidence score
   - timeline of source records
   - source provenance
5. The UI shows canonical projects instead of duplicate raw notices.
6. Opening a project launches Project Dossier 2.0 and then account enrichment.

## Important limitation

Entity resolution is currently deterministic/rule-based. It intentionally prefers false negatives over dangerous over-merging. As more structured addresses, coordinates and project organisations become available, those signals should be added to the matching model.

## Optional persistence

The application works without a database. In that mode `/api/projects` returns `persistence.enabled=false` and projects are rebuilt from live sources on every refresh.

To persist canonical projects and signals:

1. Create a Supabase/Postgres project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or prefix it with `NEXT_PUBLIC_`.

The server then upserts:

- `projects`
- `project_signals`

The schema also includes foundations for the next sprint:

- `organizations`
- `project_stakeholders`

## Next entity-resolution upgrades

Priority order:

1. address and postcode extraction
2. coordinates / parcel IDs
3. developer/owner/architect identity
4. temporal consistency
5. fuzzy multilingual aliases
6. persistent canonical aliases / manual merge-split controls
7. embedding-based similarity only as a secondary signal, never as the sole merge criterion

## Definition of done for this sprint

- Main pipeline reads `/api/projects`, not raw `/api/live-projects` records.
- Raw signals are grouped into project entities.
- Project list shows signal count and source count.
- Project Dossier shows timeline + original source links.
- Data-confidence is distinct from opportunity score.
- Database schema exists and persistence works automatically when env credentials are configured.
