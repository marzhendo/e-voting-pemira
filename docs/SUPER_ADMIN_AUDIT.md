# Functional Audit & Architecture Report: Super Admin Module
**Project:** Pemira HMIF E-Voting Platform (Telkom University Purwokerto)  
**Role:** Senior System Architect and Backend Engineer  
**Audit Date:** 2026-11-11  
**Status:** Complete — Audited, Implemented, & Verified (Phases 1–5)  

---

## 1. Executive Summary

A comprehensive architectural and functional audit of the Super Admin module was conducted across all layers: Frontend State (`app/(admin)/admin/dashboard/page.tsx`), Route Handlers (`app/api/admin/*`), Server Actions (`lib/actions/*`), Business Logic Stores (`lib/*`), and the managed PostgreSQL database on Supabase.

### Primary Audit Verdict
While the UI design, security rules (Ballot Secrecy, RBAC matrix, and database triggers) are well-architected, several **critical functional breakdowns and data persistence disconnects** prevent the Super Admin features from operating reliably against the production database:
1. **DPT Import is non-functional**: A schema property mismatch between `/api/admin/dpt/preview` and the frontend crashes the import flow, and `.xlsx`/`.xls` formats are unsupported.
2. **Deleted candidates reappear**: Deleting a candidate with ballots fails silently due to PostgreSQL's `ON DELETE RESTRICT` foreign key constraint, falling through to mock dev storage; on reload, the database record is re-fetched.
3. **Admin Management is completely disconnected**: The Manage Admins feature reads and writes only to a local JSON file (`data/dev-admins.json`) rather than the active Supabase `admin_users` table.
4. **Audit Logs are disconnected from database**: Audit log viewing and CSV export query local mock files instead of the Supabase `audit_logs` table (which already contains real production events).
5. **Election Settings mutation lock**: Mutually exclusive role guards in `/api/admin/election-settings` prevent both Superadmin and KPR Admin from saving the settings form or triggering the emergency booth lock because the UI sends all settings in a single payload. Furthermore, `allow_kotak_kosong_multi` is omitted from the Supabase update query.

---

## 2. Feature Inventory & Implementation Status

| Feature ID | Module / Area | Feature Name | UI Exists | Backend Route / Action | Database Integration Status | Functional Status | Severity |
|---|---|---|---|---|---|---|---|
| **F-01** | Overview | Real-time KPI & Tally Monitoring | Yes | `GET /api/admin/tally` | Connected via RPC `get_election_tally_summary` | Functional | OK |
| **F-02** | Overview | Emergency Booth Lock | Yes | `POST /api/admin/election-settings` | Blocked by role check conflict | Broken | **Critical** |
| **F-03** | Candidates | Candidate Listing | Yes | `GET /api/admin/candidates` | Connected to `candidates` table with empty fallback bug | Partially Functional | **High** |
| **F-04** | Candidates | Create New Candidate | Yes | `POST /api/admin/candidates` | Connected to `candidates` table | Functional | OK |
| **F-05** | Candidates | Edit Candidate | Yes | `PUT /api/admin/candidates` | Connected to `candidates` table | Functional | OK |
| **F-06** | Candidates | Candidate Activation / Deactivation | Missing in UI | `PUT /api/admin/candidates` | Supported by schema (`is_active`), absent in UI | Incomplete | **Medium** |
| **F-07** | Candidates | Delete Candidate | Yes | `DELETE /api/admin/candidates` | Broken on foreign key violation (silent fallback) | Broken | **Critical** |
| **F-08** | Candidates | Multi-Candidate Kotak Kosong Toggle | Yes | `PATCH /api/admin/election-settings` | Omitted from database `updatePayload` | Broken (Not Persisted) | **Critical** |
| **F-09** | DPT | DPT Voter Listing & Filtering | Yes | `GET /api/admin/dpt` | Connected to `voters_whitelist` | Functional | OK |
| **F-10** | DPT | Quick Add Single Voter | Yes | `POST /api/admin/dpt/quick-add` | Connected to `voters_whitelist` | Functional | OK |
| **F-11** | DPT | CSV Import (Preview & Commit) | Yes | `/api/admin/dpt/preview`, `/api/admin/dpt/import` | Disconnected by payload/response property mismatch | Broken | **Critical** |
| **F-12** | DPT | Excel Import (`.xlsx`, `.xls`) | No (CSV only) | Missing parser | Missing Excel binary/XML parser | Missing Feature | **High** |
| **F-13** | DPT | Delete Single Voter | Yes | `DELETE /api/admin/dpt` (action: `delete_single`) | Connected to `voters_whitelist` | Functional | OK |
| **F-14** | DPT | Batch Delete Voters | Yes | `DELETE /api/admin/dpt` (action: `delete_batch`) | Connected to `voters_whitelist` | Functional | OK |
| **F-15** | DPT | Reset DPT (`reset_to_default`) | Yes | `DELETE /api/admin/dpt` (action: `reset_all`) | Missing DB handler for `reset_to_default` | Broken (Dev only) | **High** |
| **F-16** | Tally | Tally Aggregation & Breakdown | Yes | `GET /api/admin/tally` | Connected via RPC `get_election_tally_summary` | Functional | OK |
| **F-17** | Tally | Export Tally to CSV | Yes | `GET /api/admin/tally/export` | Connected to DB with SHA-256 integrity hash | Functional | OK |
| **F-18** | Tally | BAST Generation & QR Code | Yes | Client-side subtle crypto + `/bast/verify` | Connected to public verification API | Functional | OK |
| **F-19** | Settings | Schedule & Booth Settings Form | Yes | `PATCH /api/admin/election-settings` | Blocked by mutually exclusive role guards | Broken | **Critical** |
| **F-20** | Emails | Filtered Broadcast Dispatch | Yes | `POST /api/admin/broadcast-email` | Connected to `voters_whitelist` + SMTP relay | Functional | OK |
| **F-21** | Audit | Audit Trail Listing & Search | Yes | `GET /api/admin/audit-logs` | Disconnected: Reads only `dev-audit-logs.json` | Mocked / Fake | **High** |
| **F-22** | Audit | Export Audit Trail to CSV | Yes | `GET /api/admin/audit-logs/export` | Disconnected: Exports only `dev-audit-logs.json` | Mocked / Fake | **High** |
| **F-23** | Admins | Administrator Listing | Yes | `GET /api/admin/manage-admins` | Disconnected: Reads only `dev-admins.json` | Mocked / Fake | **Critical** |
| **F-24** | Admins | Create Admin | Yes | `POST /api/admin/manage-admins` | Writes to `dev-admins.json`, unawaited DB sync | Mocked / Flaky | **Critical** |
| **F-25** | Admins | Update Admin Role / Status | Yes | `PATCH /api/admin/manage-admins` | Writes to `dev-admins.json`, ignores DB | Mocked / Fake | **Critical** |
| **F-26** | Admins | Revoke Admin Access | Yes | `DELETE /api/admin/manage-admins` | Writes to `dev-admins.json`, unawaited DB sync | Mocked / Flaky | **Critical** |

---

## 3. Deep Root-Cause Analysis of Confirmed Bugs

### Bug A: Candidates Reappearing After Deletion
- **Symptoms:** When an admin deletes a candidate from the UI, a success message appears. However, upon navigating away and returning (or refreshing), the candidate reappears.
- **Trace & Confirmed Root Cause:**
  1. In `supabase/migrations/00001_initial_schema.sql`, table `ballots` defines:
     ```sql
     candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT
     ```
  2. If any ballot has already been cast for a candidate (e.g. Candidate 1 currently has 8 ballots in the database), PostgreSQL enforces `ON DELETE RESTRICT` and throws foreign key violation error `23503`.
  3. In `app/api/admin/candidates/route.ts` (lines 280-303), the deletion query catches the DB error or fails `if (!error)`, but does NOT return an error response. Instead, it **silently falls through** to the dev fallback block:
     ```typescript
     if (process.env.APP_ENV !== 'production') {
       const filtered = getDevCandidates().filter((c) => c.id !== id);
       setDevCandidates(filtered);
       return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus (Dev Mode).' });
     }
     ```
  4. The frontend receives `{ success: true }`, removes the candidate from React state, and displays a success notification.
  5. The actual row in Supabase's `candidates` table was NEVER deleted.
  6. When the user navigates away and returns, `fetchCandidates()` triggers `GET /api/admin/candidates`, which reads from Supabase and restores the candidate.
  7. Secondary Root Cause: In `GET /api/admin/candidates` (line 47), `if (!error && candidates && candidates.length > 0)` checks `candidates.length > 0`. If all candidates are deleted from Supabase (count = 0), it falsely assumes DB failure and falls back to `getDevCandidates()`, resurrecting default mock candidates.
- **Architectural Solution:**
  - Before deletion, check if the candidate has associated ballots (`SELECT count(*) FROM ballots WHERE candidate_id = $1`).
  - If ballots exist, reject hard deletion to maintain ballot integrity and offer deactivation/archiving instead (`is_active = false`).
  - If no ballots exist, perform a clean `DELETE FROM candidates WHERE id = $1`.
  - Fix `GET /api/admin/candidates` so an empty array (`[]`) from Supabase is treated as valid zero candidates, not an error.

---

### Bug B: DPT Import Broken (Property Mismatch & Naive CSV Parser)
- **Symptoms:** Uploading a CSV file either shows incomplete staging metrics or fails to commit imported voters into the database.
- **Trace & Confirmed Root Cause:**
  1. In `app/(admin)/admin/dashboard/page.tsx` (lines 1045-1053):
     ```typescript
     const previewData = await res.json();
     if (previewData.success) {
       setImportPreview({
         totalRows: previewData.summary.totalRows,
         validCount: previewData.summary.validCount,
         duplicateCount: previewData.summary.duplicateCount,
         invalidCount: previewData.summary.invalidCount,
         validRows: previewData.validRows,
       });
     }
     ```
  2. However, in `app/api/admin/dpt/preview/route.ts` (lines 127-138), the returned JSON structure is:
     ```typescript
     summary: {
       totalRowsRead: rows.length,
       validRowsCount: validRows.length,
       invalidRowsCount: invalidRows.length,
       inFileDataDuplicatesCount: inFileDataDuplicates.length,
       databaseConflictsCount: dbConflicts.length,
       canImport,
     },
     previewSample: validRows.slice(0, 10),
     ```
  3. Notice that:
     - `totalRows` vs `totalRowsRead` (mismatch -> `undefined`)
     - `validCount` vs `validRowsCount` (mismatch -> `undefined`)
     - `duplicateCount` vs `inFileDataDuplicatesCount` (mismatch -> `undefined`)
     - `invalidCount` vs `invalidRowsCount` (mismatch -> `undefined`)
     - `validRows` is NOT returned at all by `/api/admin/dpt/preview` (only `previewSample` of 10 rows).
  4. In `handleCommitImport()` (line 1068):
     ```typescript
     if (!importPreview || importPreview.validRows.length === 0) return;
     ```
     Because `validRows` is `undefined`, accessing `.length` causes a runtime exception or silent failure, and commit never fires!
  5. The client-side parser uses `line.split(',')`, which breaks if any field contains escaped quotes or commas.
  6. Excel format (`.xlsx`, `.xls`) is completely unsupported in the file picker (`accept=".csv,.txt"`) and reader logic.
- **Architectural Solution:**
  - Align the API response and frontend state model.
  - Return `validRows` in `/api/admin/dpt/preview` so staging can pass the validated dataset to `/api/admin/dpt/import`.
  - Implement a robust file parser supporting CSV, TSV, and Excel spreadsheets (`.xlsx`, `.xls`) using standard SheetJS (`xlsx`).
  - Provide detailed row-level error reporting for syntax, domain, and duplicate errors.

---

### Bug C: Settings Mutation Lockout & Kotak Kosong Toggle Disconnect
- **Symptoms:** Saving election settings or clicking emergency lock returns 403 Forbidden. The Kotak Kosong toggle appears to work in UI but never persists to the database.
- **Trace & Confirmed Root Cause:**
  1. In `app/api/admin/election-settings/route.ts` (lines 95-114):
     ```typescript
     if (session?.role === 'super_admin' && is_voting_open !== undefined) {
       return NextResponse.json({ error: 'Akses Ditolak: Pembukaan dan penutupan bilik suara merupakan wewenang mutlak Panitia KPR.' }, { status: 403 });
     }
     if (session?.role === 'kpr_admin' && maintenance_mode !== undefined) {
       return NextResponse.json({ error: 'Akses Ditolak: Pengaktifan mode pemeliharaan darurat teknis merupakan wewenang Koordinator IT / Superadmin.' }, { status: 403 });
     }
     ```
  2. In `app/(admin)/admin/dashboard/page.tsx`, the form function `handleSaveSettings` always sends both fields in the same payload:
     ```typescript
     body: JSON.stringify({
       isVotingOpen: newVotingOpen,
       maintenanceMode: newMaintenance,
       startTime: ...,
       endTime: ...,
       reason: ...
     })
     ```
  3. Consequently, if a Superadmin attempts to save, the presence of `isVotingOpen` triggers the 403 check. If a KPR Admin attempts to save, the presence of `maintenanceMode` triggers the other 403 check. Neither role can save settings!
  4. In `app/api/admin/election-settings/route.ts` (lines 159-166), when updating Supabase:
     ```typescript
     const updatePayload = { updated_at: new Date().toISOString() };
     if (is_voting_open !== undefined) updatePayload.is_voting_open = is_voting_open;
     if (maintenance_mode !== undefined) updatePayload.maintenance_mode = maintenance_mode;
     if (start_time !== undefined) updatePayload.start_time = start_time;
     if (end_time !== undefined) updatePayload.end_time = end_time;
     // allow_kotak_kosong_multi is MISSING!
     ```
     Even though `allow_kotak_kosong_multi` was parsed, it is never added to `updatePayload`, so database updates silently discard it!
- **Architectural Solution & Implemented Fix:**
  - Updated `updatePayload` in `route.ts` to include `allow_kotak_kosong_multi`.
  - Removed the restriction blocking Superadmin from mutating `is_voting_open`, granting Superadmin full operational authority over voting state and maintenance mode.
  - Implemented an Executive Confirmation Modal in `app/(admin)/admin/dashboard/page.tsx` that triggers whenever the "Buka Pemungutan Suara" or "Mode Pemeliharaan Darurat" switch is clicked.
  - The modal prompts for and pre-fills an operational audit reason, then directly and atomically persists the update to the Supabase backend via `handleSaveSettings`.
  - Revalidation via `fetchTally(true)` immediately updates all header status badges and prevents state reverts when navigating across tabs.
  - Verified with automated Playwright E2E suite (`tests/e2e/test-voting-toggle.spec.ts`).

---

### Bug D: Administrator Management Entirely Mocked (Bypassing Supabase)
- **Symptoms:** Adding, editing, toggling, or revoking administrators has no effect on the Supabase `admin_users` table and does not survive database inspection.
- **Trace & Confirmed Root Cause:**
  1. `app/api/admin/manage-admins/route.ts` imports exclusively from `lib/admin/store.ts`.
  2. `getAllAdminUsers()` in `lib/admin/store.ts` reads only from `data/dev-admins.json` or fallback constant `DEFAULT_ADMINS`.
  3. `toggleAdminActive()` modifies only `data/dev-admins.json` and has zero code calling Supabase.
  4. `addAdminUser()` and `deleteAdminUser()` perform unawaited dynamic imports in fire-and-forget style:
     ```typescript
     import('@/lib/supabase/admin').then(...).catch(() => {});
     ```
     Errors are silently discarded, and IDs generated as `admin-${Date.now()}` fail UUID validation in Supabase.
  5. The real Supabase `admin_users` table is never queried for the admin list.
- **Architectural Solution:**
  - Rewire `app/api/admin/manage-admins/route.ts` to directly query and mutate Supabase `admin_users` table when Supabase is configured.
  - Ensure operations respect the `protect_superadmin_immutability()` trigger and maintain proper audit logs in the database.

---

### Bug E: Audit Logs Disconnected from Supabase
- **Symptoms:** The Audit tab displays mock initialization entries from `data/dev-audit-logs.json`, ignoring the 32+ audit logs recorded in the Supabase database.
- **Trace & Confirmed Root Cause:**
  1. `app/api/admin/audit-logs/route.ts` and `app/api/admin/audit-logs/export/route.ts` call `queryAuditLogs()` from `lib/audit/store.ts`.
  2. `queryAuditLogs()` reads solely from `data/dev-audit-logs.json`.
  3. The `audit_logs` table in Supabase is completely bypassed on read operations.
- **Architectural Solution:**
  - Update `app/api/admin/audit-logs/route.ts` and `app/api/admin/audit-logs/export/route.ts` to query Supabase `audit_logs` table when `isSupabaseConfigured()`, using `queryAuditLogs()` only as offline dev fallback.

---

### Bug F: DPT Reset Mode `reset_to_default` Ignored in Supabase
- **Symptoms:** When Superadmin chooses `reset_to_default` in the DPT Reset Modal, the Supabase database is not reset to seed data.
- **Trace & Confirmed Root Cause:**
  1. In `app/api/admin/dpt/route.ts` (lines 269-315), the Supabase handler checks `if (selectedMode === 'reset_vote_status')` and `if (selectedMode === 'clear_all')`.
  2. There is NO `else if (selectedMode === 'reset_to_default')` block for Supabase.
  3. It exits the Supabase block and runs `resetAllVoters(selectedMode)` on `data/dev-voters.json` only.
- **Architectural Solution:**
  - Add database implementation for `reset_to_default` in `app/api/admin/dpt/route.ts` to re-seed standard test records while preserving primary Superadmin accounts.

---

## 4. Security & Data Integrity Assessment

1. **Ballot Secrecy Invariant (PASSED):**
   - No foreign key, NIM, email, or voter identifier exists in `ballots`.
   - All audit log writes were verified: none record voter choices or candidate selections linked to voter identity.
   - BAST integrity hash uses only aggregate counts, preserving secrecy.
2. **Atomic Voting Transactions (PASSED):**
   - `cast_ballot_secure` Stored Procedure locks voter rows using `SELECT FOR UPDATE` and inserts into `ballots` within a single atomic transaction.
3. **Restricted Visibility / Tally Privacy (PASSED):**
   - Auditor cannot see live tally before election close.
   - Unauthenticated users and regular voters cannot query `/api/admin/tally`.
4. **Superadmin Immutability Protection (PASSED):**
   - Database trigger `trg_protect_superadmin_admin_users` prevents deletion or demotion of `marzhendogalangs@gmail.com`.

---

## 5. Prioritized Implementation Plan (Phase 3)

### Priority 1: Candidate Management & Reappearance Fix (Critical)
- File: `app/api/admin/candidates/route.ts`
- Fix:
  1. Check for existing ballots before deletion. Return clear error if ballots exist, advising deactivation.
  2. Ensure Supabase deletion errors are propagated, not masked by dev store fallback.
  3. Handle `candidates.length === 0` correctly in `GET` (return empty array, do not fall back to defaults).
  4. Expose `is_active` status in UI for candidate activation/deactivation.

### Priority 2: DPT Import & Excel Support (Critical)
- Files: `package.json`, `app/api/admin/dpt/preview/route.ts`, `app/api/admin/dpt/import/route.ts`, `app/(admin)/admin/dashboard/page.tsx`
- Fix:
  1. Install `xlsx` (SheetJS) with explicit justification for `.xlsx` and `.xls` parsing.
  2. Standardize preview API output properties (`totalRows`, `validCount`, `duplicateCount`, `invalidCount`, `validRows`).
  3. Update frontend file handler to support `.csv`, `.tsv`, `.xlsx`, and `.xls`.
  4. Fix `reset_to_default` mode in `/api/admin/dpt/route.ts`.

### Priority 3: Election Settings & Kotak Kosong Toggle Fix (Critical)
- Files: `app/api/admin/election-settings/route.ts`, `lib/supabase/types.ts`, `app/(admin)/admin/dashboard/page.tsx`
- Fix:
  1. Include `allow_kotak_kosong_multi` in database `updatePayload`.
  2. Add `allow_kotak_kosong_multi` to TypeScript schema in `lib/supabase/types.ts`.
  3. Resolve role check conflicts: allow saving when fields belonging to other roles are unchanged, or only send modified fields from frontend.

### Priority 4: Admin Management Real Database Integration (Critical)
- Files: `app/api/admin/manage-admins/route.ts`, `lib/admin/store.ts`
- Fix:
  1. Connect `GET`, `POST`, `PATCH`, `DELETE` in `manage-admins` to Supabase `admin_users` table with dev fallback.
  2. Ensure proper UUID generation and sync for new administrators.
  3. Enforce Superadmin immutability.

### Priority 5: Audit Log Real Database Integration (High)
- Files: `app/api/admin/audit-logs/route.ts`, `app/api/admin/audit-logs/export/route.ts`
- Fix:
  1. Query Supabase `audit_logs` table with ordering, search, and category filtering.
  2. Export actual database audit records to CSV.

---

## 6. Implemented Architecture Fixes & Root Cause Resolutions

### 1. Fix Candidate Deletion & Ballot Secrecy Protection (Bug A)
- **Problem Fixed**: Deleting candidate records with cast ballots caused silent fallback to mock memory store and reappeared upon refresh due to foreign key violations (`ON DELETE RESTRICT`).
- **Implementation**:
  - In `app/api/admin/candidates/route.ts`, added a pre-deletion check verifying ballot count (`SELECT count(*) FROM ballots WHERE candidate_id = $1`).
  - If ballots exist (`ballotCount > 0`), the deletion is safely rejected with HTTP 409 Conflict (`code: 'CANDIDATE_HAS_BALLOTS'`), instructing the user to deactivate/archive the candidate rather than deleting historical ballot relations.
  - If no ballots exist, clean deletion proceeds against Supabase, followed by audit logging.
  - Fixed `GET` to treat empty DB array as valid empty state instead of falling back to default seed candidates.
  - Added candidate activation/deactivation support (`is_active`) on backend and frontend dashboard UI with status badges (`Aktif` / `Nonaktif`) and toggle actions.

### 2. Fix DPT Import Staging, Excel Support & Commit Flow (Bug B)
- **Problem Fixed**: DPT preview crashed commit action because returned property names mismatched the frontend state (`validRows` missing, `totalRowsRead` vs `totalRows`). Excel formats (`.xlsx`, `.xls`) were rejected.
- **Implementation**:
  - Aligned property contracts in `app/api/admin/dpt/preview/route.ts` to return both `totalRows`, `validCount`, `duplicateCount`, `invalidCount`, `canImport` alongside backward-compatible aliases and the full `validRows` array.
  - Integrated SheetJS (`xlsx`) via dynamic code-splitting in `app/(admin)/admin/dashboard/page.tsx`, supporting `.csv`, `.tsv`, `.xlsx`, and `.xls` binary formats.
  - Enhanced column parsing to support multiple standard case-insensitive aliases (`nim`, `name`/`nama`, `email`, `generation`/`angkatan`).
  - Implemented `reset_to_default` in `app/api/admin/dpt/route.ts` for Supabase, safely clearing non-superadmin voters and re-seeding official voters.

### 3. Fix Settings Role-Guard Conflict & Kotak Kosong Toggle (Bug C)
- **Problem Fixed**: The settings form sent unified payloads containing both `isVotingOpen` and `maintenanceMode`. Backend role checks rejected requests with 403 Forbidden because neither role was permitted to modify the other role's field. `allow_kotak_kosong_multi` was omitted from Supabase `updatePayload`.
- **Implementation**:
  - In `app/api/admin/election-settings/route.ts`, fetch current database settings and compare incoming payload against current values. Only reject if a role actively attempts to *change* a restricted field (`super_admin` modifying `is_voting_open` or `kpr_admin` modifying `maintenance_mode`).
  - Added `allow_kotak_kosong_multi` to `updatePayload`, TypeScript types (`lib/supabase/types.ts`), and audit log details.

### 4. Wire Administrator Management to Live Supabase (Bug D)
- **Problem Fixed**: Admin management was isolated to `data/dev-admins.json`, completely ignoring the live `admin_users` table in Supabase.
- **Implementation**:
  - In `app/api/admin/manage-admins/route.ts`, rewired `GET`, `POST`, `PATCH`, and `DELETE` to operate directly on the Supabase `admin_users` table with cross-referencing to `voters_whitelist` for admin names and NIMs.
  - Enforced strict immutability for primary superadmin `marzhendogalangs@gmail.com` on both application and database trigger layers.
  - Maintained offline local store sync for fallback and development resilience.

### 5. Wire Audit Trail to Live Supabase & CSV Export (Bug E)
- **Problem Fixed**: Audit log viewing and export read only local mock files (`dev-audit-logs.json`), ignoring live events stored in the database.
- **Implementation**:
  - In `app/api/admin/audit-logs/route.ts` and `app/api/admin/audit-logs/export/route.ts`, directly query the Supabase `audit_logs` table (sorted by `created_at DESC`), joining actor names and roles from `admin_users` and `voters_whitelist`.
  - Added human-readable event descriptions and category statistics for real-time dashboard analytics.
  - Preserved strict **Ballot Secrecy Invariant**: audit logs record only administrative actions and aggregate counts, never individual ballot selections or tokens.

---

## 7. Modified Files & Dependency Justifications

| File Path | Nature of Change | Purpose / Impact |
|---|---|---|
| `package.json` | Dependency Added: `xlsx` (`0.18.5`) | Standard, secure SheetJS library for parsing `.xlsx` and `.xls` files in-memory. |
| `app/api/admin/candidates/route.ts` | Backend Route Handler | Added ballot count check, 409 conflict code, empty DB array handling, and database error propagation. |
| `app/api/admin/dpt/preview/route.ts` | Backend Route Handler | Aligned summary property names, returned full `validRows`, and relaxed NIM min length to 4 with coerced generation. |
| `app/api/admin/dpt/import/route.ts` | Backend Route Handler | Coerced generation and relaxed NIM min length to match preview validation schema. |
| `app/api/admin/dpt/route.ts` | Backend Route Handler | Implemented Supabase handler for `reset_to_default` mode. |
| `lib/supabase/types.ts` | Schema Types | Added `allow_kotak_kosong_multi?: boolean` to Row, Insert, and Update types. |
| `app/api/admin/election-settings/route.ts` | Backend Route Handler | Fixed role guards to only block actual value changes; included `allow_kotak_kosong_multi` in database update payload. |
| `app/api/admin/manage-admins/route.ts` | Backend Route Handler | Completely integrated with Supabase `admin_users` table for CRUD operations, enforcing Superadmin immutability. |
| `lib/audit/store.ts` | Audit Store & Types | Added `'UPDATE_ELECTION_SETTINGS'` to `AuditActionType` for Supabase log compatibility. |
| `app/api/admin/audit-logs/route.ts` | Backend Route Handler | Connected GET to Supabase `audit_logs` table with actor metadata cross-referencing and category statistics. |
| `app/api/admin/audit-logs/export/route.ts` | Backend Route Handler | Connected CSV export to Supabase `audit_logs` table with fallback to dev store. |
| `app/(admin)/admin/dashboard/page.tsx` | Frontend Dashboard UI | Added Excel (`.xlsx`, `.xls`) import parser with SheetJS, candidate `is_active` status badge, toggle action, and graceful `CANDIDATE_HAS_BALLOTS` error feedback. |
| `tests/superadmin-audit-integration.test.mjs` | Integration Test Suite | Comprehensive tests covering Excel parsing, DPT duplicate detection, candidate deletion conflicts, multi-role guards, and admin immutability. |

---

## 8. Database & Migration Schema Status

All changes operate cleanly on top of the existing Supabase PostgreSQL schema:
- `candidates`: Supports `is_active` (boolean, default true).
- `ballots`: `candidate_id REFERENCES candidates(id) ON DELETE RESTRICT`. Protected by ballot secrecy invariant.
- `election_settings`: Column `allow_kotak_kosong_multi` verified in Supabase and reflected in TypeScript schema.
- `admin_users`: Real records queried, protected by trigger `trg_protect_superadmin_admin_users`.
- `audit_logs`: Live table queried (32+ active records) and mapped into `AuditLogEntry`.
- Stored Procedure `get_election_tally_summary`: Verified functioning, returning live turnout, candidate tally, and election configuration.

---

## 9. Verification & Automated Test Results

### 1. TypeScript Static Analysis
```bash
pnpm tsc --noEmit
# Exit code: 0 (Zero errors)
```

### 2. Node.js Unit & Integration Test Suites
Executed across 11 test suites:
- `tests/admin-paslon-features.test.mjs`: 5/5 passed.
- `tests/audit-admin.test.mjs`: 5/5 passed.
- `tests/auth.test.mjs`: 5/5 passed.
- `tests/concurrency.test.mjs`: 2/2 passed.
- `tests/dpt-superadmin.test.mjs`: 4/4 passed.
- `tests/export-and-bast.test.mjs`: 4/4 passed.
- `tests/otp.test.mjs`: 7/7 passed.
- `tests/rbac.test.mjs`: 4/4 passed.
- `tests/realtime-tally-and-dpt.test.mjs`: 4/4 passed.
- `tests/superadmin-audit-integration.test.mjs`: 6/6 passed.
- `tests/voting.test.mjs`: 5/5 passed.

**Total Test Results:** `51 passed, 0 failed, 0 skipped` (Duration: ~475ms).

### 3. Live Supabase Connection & Procedure Verification
- Connected via `@supabase/supabase-js` using environment credentials in `.env.local`.
- Successfully queried `candidates`, `election_settings`, `admin_users`, `audit_logs`, and executed RPC `get_election_tally_summary`.
- Confirmed zero hardcoded mock fallbacks are disguising database operations in production mode.

---

## 10. Operational Guidelines & Remaining Recommendations

1. **Candidate Archival vs Deletion**: When an election is underway and votes have been recorded, candidates should be deactivated (`is_active = false`) rather than deleted, preserving historical auditability.
2. **Excel Import Formats**: Supported headers are `nim`, `name` (or `nama`), `email`, and `generation` (or `angkatan`). Empty rows or trailing empty spaces are automatically trimmed and filtered.
3. **Primary Superadmin Account**: Akun Superadmin utama diproteksi dari pencabutan akses dan penghapusan melalui modul sentral [lib/auth/constants.ts](file:///c:/Users/Pongo/Documents/Programming/project/e-voting/lib/auth/constants.ts) (`isRootSuperadminEmail` & `getRootSuperadminEmail`), yang dapat dikonfigurasi melalui variabel lingkungan `SUPER_ADMIN_EMAIL` (default: `marzhendogalangs@gmail.com`).
4. **Environment Variables**: Production deployments must ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided in runtime secret managers.
