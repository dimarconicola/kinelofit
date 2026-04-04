# AI-Assisted Calendar Ingestion

## Goal
Turn `Suggerisci calendario` into a real operational pipeline:
- submission persists immediately
- admin can review it safely
- source URLs are fetched and normalized
- AI extraction produces structured candidates
- high-confidence cases can generate an import batch automatically
- every step stays traceable and reversible

## Runtime shape
1. Public user submits `POST /api/calendar-submissions`
2. App writes a durable `calendar_submissions` row with `ingestion_status=queued`
3. App triggers `runCalendarSubmissionIngestion()`
4. Source URLs are fetched and condensed into evidence:
   - HTML title
   - meta description
   - Open Graph fields
   - JSON-LD blocks
   - visible text excerpt
   - known parser-adapter signals when available
5. Provider abstraction runs extraction:
   - default provider: OpenAI Responses API structured JSON
   - fallback provider: deterministic review-only bundle
6. Output is schema-validated
7. App writes:
   - `calendar_submission_runs`
   - `calendar_submission_candidates`
8. If confidence is high enough and import safety passes:
   - app builds CSV
   - app creates a linked `import_batch`
   - submission moves to `ingestion_status=import_created`
9. Admin reviews from `/it/admin/inbox`

## Data model
### calendar_submissions
Core intake row from the public form.

Important fields:
- `review_status`
- `ingestion_status`
- `linked_import_batch_id`

### calendar_submission_runs
One processing attempt per submission.

Fields:
- provider/model
- source evidence snapshot
- normalized output
- raw response
- confidence
- error
- created/completed timestamps

### calendar_submission_candidates
Entity-level proposals created from a run.

Entity types:
- `venue`
- `instructor`
- `session`
- `import_batch`

## Confidence model
The extraction output carries four separate confidence dimensions:
- `sourceQuality`
- `scheduleExtraction`
- `entityMatch`
- `importSafety`

Only `high_confidence_import` cases should create import batches automatically.

## Provider contract
Provider input:
- normalized submission payload
- fetched source evidence

Provider output:
- structured JSON only
- no free-form prose outside schema
- `verdict`
- `summary`
- `rationale`
- `blockingIssues`
- `confidence`
- `venue`
- `instructors`
- `sessions`

## Current v1 implementation
### What is automatic
- submission persistence
- source fetching
- evidence bundling
- AI extraction when `OPENAI_API_KEY` is configured
- deterministic fallback when AI is unavailable
- candidate persistence
- import batch creation for high-confidence cases with complete venue data
- email alerts when `ADMIN_EMAIL` + `RESEND_API_KEY` are configured
- cron reprocessing for queued/failed submissions

### What still needs deeper work
- richer venue matching against existing catalog entities
- better inference of `neighborhood_slug` when the venue is new
- stronger deterministic parsers for recurring timetable formats
- more specific batch promotion rules by category/source type
- admin UX for approving/rejecting individual candidates, not only rerun/create batch
- audit view that compares original evidence against normalized output diff-by-diff

## Environment variables
Required for full production behavior:
- `ADMIN_EMAIL` or `ADMIN_EMAILS`
- `OPENAI_API_KEY`
- `AI_PROVIDER=openai`
- `OPENAI_SUBMISSION_MODEL` optional override
- `RESEND_API_KEY` for email alerts
- `ALERT_FROM_EMAIL` optional sender override

## Admin URLs
- `/it/admin`
- `/it/admin/inbox`
- `/it/admin/imports`
- `/it/admin/sources`
- `/it/admin/freshness`

## Safety rules
- AI never writes directly into public catalog tables
- AI only creates review artifacts and optionally import batches
- public publish must still flow through existing import validation gates
- all AI output is schema-validated before use
- failed AI runs must not block successful public submission persistence

## Cron
Suggested route:
- `/api/cron/calendar-submissions`

Purpose:
- replay `queued` and `failed` submissions
- recover from transient AI/network/provider failures

## Future iteration
1. Add candidate-level moderation actions in inbox
2. Add import preview diff UI
3. Link approved import batches to actual catalog write reports
4. Add provider failover and retry policy
5. Add per-source adapter overrides before LLM fallback
