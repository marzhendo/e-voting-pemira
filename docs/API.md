# API Specification — E-Voting Pemira HMIF

| Metadata | Value |
|---|---|
| Document | API Specification |
| Project | E-Voting Pemira HMIF |
| Version | 0.1.0 |
| Status | Draft — Requires Technical and Security Review |
| Basis | PRD v1.0.0, UI.md, ARCHITECTURE.md, DATABASE.md, and project context provided in the conversation |
| Last updated | 2026-10-31 |

> **Status convention**
>
> - **Specified**: explicitly supported by the current PRD or project context.
> - **Proposed**: a practical API design proposal, not yet an approved project decision.
> - **TBD**: information is missing and must be decided before implementation or release.

---

## 1. Purpose

This document describes the API boundary for E-Voting Pemira HMIF. It identifies the operations required by the product, the data each operation is allowed to expose, the expected authorization boundary, and unresolved contract decisions.

The API must preserve the product's core guarantees:

1. One-Man-One-Vote.
2. Ballot secrecy: a stored ballot must not identify the voter.
3. Vote casting must be atomic.
4. Candidate tally must remain private while voting is active.
5. Only eligible voters may access the ballot flow.
6. Administrative operations must be restricted to authorized roles.

This document is a contract inventory and draft design. It does **not** claim that every proposed route or payload has already been implemented.

## 2. Technical context and conventions

### 2.1 Project context

The project context supplied so far identifies the following technologies:

- Next.js App Router and TypeScript.
- Supabase with PostgreSQL.
- Microsoft Entra ID for institutional authentication.
- MSAL / Azure identity integration.
- Zod for validation at Server Action and Route Handler boundaries.
- Playwright for end-to-end testing.
- pnpm as the package manager.

The repository's current route tree, `AGENTS.md`, and `SKILLS.md` have not been verified in this documentation pass. Therefore, the route names below must not be treated as a verified reflection of the codebase.

### 2.2 API implementation styles

Next.js supports both Server Actions and Route Handlers. The PRD does not define which operation must use which transport.

**Proposed convention:**

- Use Server Actions for UI-bound mutations where a browser page invokes an application operation directly.
- Use Route Handlers for explicit HTTP interfaces, exports, integration boundaries, and endpoints that require direct HTTP status semantics.
- Keep authorization, validation, and application rules in server-side services. A Server Action is not a security boundary by itself.
- Do not expose Supabase service-role credentials or privileged database operations to the browser.

The project must approve this convention before endpoint-level implementation is considered final.

### 2.3 General conventions

| Concern | Draft convention | Status |
|---|---|---|
| Data format | JSON for request/response bodies unless file transfer is required | Proposed |
| Character encoding | UTF-8 | Proposed |
| Authentication | Validated server-side session derived from Microsoft Entra ID | Specified at product level; implementation details TBD |
| Authorization | Role and eligibility checks on the server | Required; exact role model TBD |
| Validation | Zod at external input boundaries | Project context |
| Time | Store and compare timestamps consistently; display in election's configured timezone | Timezone policy TBD |
| Errors | Stable machine-readable error code plus safe message | Proposed |
| Secrets | Never return access tokens, service-role keys, or internal credentials | Required security control |

## 3. Actors and authorization

| Actor | Expected access | Restrictions |
|---|---|---|
| Unauthenticated visitor | Sign-in entry point and public election/candidate information, if enabled | Cannot access voter status or ballot operations |
| Authenticated student | Own eligibility/status and ballot flow when eligible | Cannot access another voter's record or candidate tally |
| KPR / election operator | Election administration and operational monitoring | Exact permissions must be defined |
| Admin | DPT and election administration, according to assigned permission | Must not gain ballot-to-voter linkage |
| Superadmin | Explicitly privileged override operations | Every override must be authorized and audited |

**TBD:** The PRD names KPR/Admin and mentions a superadmin manual override, but does not provide a complete role-permission matrix. The application must not infer that every admin has every permission.

### 3.1 Authorization rules

1. Authentication proves the identity of the signed-in account; it does not by itself prove DPT eligibility.
2. DPT eligibility must be checked against the authoritative whitelist.
3. A voter may only read their own eligibility and participation status.
4. A normal student must receive HTTP 403 from `GET /api/admin/tally` (the endpoint explicitly referenced by the PRD).
5. Admin access must be checked server-side on every protected operation.
6. The client must never be trusted to supply an arbitrary NIM as proof of the caller's identity.
7. The browser must not receive direct access to privileged database credentials or unrestricted table access.

## 4. Operation inventory

The table below is the current API surface inventory. Only `/api/admin/tally` is explicitly named in the PRD. Other route names are proposals to help implementation planning.

| ID | Operation | Proposed transport / route | Caller | Status |
|---|---|---|---|---|
| API-01 | Start / complete Entra sign-in and establish session | Auth provider callback / NextAuth or MSAL integration boundary | Visitor | Provider flow specified; exact route TBD |
| API-02 | Read current user's eligibility and vote status | Server Action or `GET /api/voter/me` | Authenticated student | Proposed |
| API-03 | Read active candidates and election availability | Server Action or `GET /api/election` | Authenticated student | Required by UI; route proposed |
| API-04 | Cast a ballot | Server Action or `POST /api/ballots` | Eligible student | Required; route proposed |
| API-05 | Read vote receipt | Server Action or `GET /api/voter/receipt` | Authenticated student | Receipt screen specified; retrieval contract TBD |
| API-06 | Preview DPT import | Server Action or `POST /api/admin/dpt/preview` | Authorized admin | Required workflow; route proposed |
| API-07 | Commit DPT import | Server Action or `POST /api/admin/dpt/import` | Authorized admin | Required workflow; route proposed |
| API-08 | Search / inspect DPT records | Server Action or `/api/admin/dpt/*` | Authorized admin | Admin workflow implied; exact operations TBD |
| API-09 | Update election settings / voting window | Server Action or `PATCH /api/admin/election-settings` | Authorized operator | Required; route proposed |
| API-10 | Read private candidate tally | `GET /api/admin/tally` | Authorized admin | Route explicitly named in PRD |
| API-11 | Read turnout / generation aggregates | Server Action or `GET /api/admin/turnout` | Authorized admin | Required by PRD; route proposed |
| API-12 | Export election report | Server Action or `GET /api/admin/reports/*` | Authorized admin | PDF/Excel required; route proposed |
| API-13 | Record administrative audit event | Internal server-side service | System / authorized actor | Required concept; interface TBD |

The operation inventory is not an assertion that all operations must become public HTTP endpoints. Some may remain server-only application services.

## 5. Voter-facing contracts

### 5.1 Identity and voter mapping

**Specified behavior**

- The voter signs in through Microsoft Entra SSO.
- The application obtains an institutional identity claim, such as email or `preferred_username`.
- The identity is matched against `voters_whitelist`.
- A user not present in the DPT is denied access to the voting flow.
- A voter whose `has_voted` flag is already true must not be allowed to cast another vote.

**Security requirement**

The NIM used by the ballot transaction must be derived from a validated identity-to-DPT mapping performed on the server. It must not be accepted as an arbitrary client-controlled value.

**TBD — identity mapping contract**

The PRD mentions email / `preferred_username` and a possible NIM pattern in the email, but does not define a canonical parsing and verification rule. Before implementation, decide:

- Which Entra claim is authoritative.
- Whether NIM is extracted from the email address or obtained from a trusted directory attribute.
- How aliases, changed email addresses, missing claims, and duplicate mappings are handled.
- Whether the allowed email domain is enforced and where.

### 5.2 Read voter status

**Proposed operation:** `GET /api/voter/me`

Purpose: return only the current authenticated user's eligibility and participation state.

**Proposed response shape:**

```json
{
  "eligible": true,
  "hasVoted": false,
  "votingAvailable": true
}
```

This shape is illustrative, not approved. The response must not expose another voter's NIM, email, name, or voting status.

Possible outcomes:

| Condition | Proposed behavior |
|---|---|
| No valid session | 401 Unauthorized |
| Identity cannot be mapped to DPT | Return a safe ineligible state or 403; exact UX contract TBD |
| Eligible and has not voted | Return eligible status |
| Eligible and already voted | Return `hasVoted: true`; route UI to the receipt / already-voted state |

### 5.3 Read candidates and election state

**Proposed operation:** `GET /api/election`

The voting UI requires active candidate information and election availability.

The PRD defines candidate data including:

- Candidate number.
- Chair and vice-chair names.
- Vision.
- Mission.
- Photo URL.
- Active status.

The PRD also defines election settings including:

- `is_voting_open`.
- `start_time`.
- `end_time`.
- `maintenance_mode`.

**Proposed response shape:**

```json
{
  "votingAvailable": true,
  "candidates": [
    {
      "id": "candidate-uuid",
      "candidateNumber": 1,
      "leaderName": "Candidate name",
      "viceLeaderName": "Candidate name",
      "vision": "Vision text",
      "mission": ["Mission item"],
      "photoUrl": "https://example.invalid/photo.webp"
    }
  ]
}
```

The example values are placeholders. The actual contract must not expose inactive candidates unless an authorized administrative view requires them.

**TBD:** Whether public candidate profiles can be read without a session, and whether election settings expose exact start/end timestamps to students.

### 5.4 Cast ballot

**Specified database operation:** `cast_ballot_secure(p_nim VARCHAR(15), p_candidate_id UUID)`

The PRD defines the database RPC as the authoritative vote-casting transaction. It checks voting availability, locks the voter row, checks eligibility and prior participation, validates the candidate, marks the voter as having voted, inserts a ballot, and returns a result code.

**Proposed application operation:** `POST /api/ballots` or an equivalent Server Action.

**Critical security boundary**

The browser must submit the candidate selection, not an arbitrary NIM. The server must derive the NIM from the authenticated session and the trusted DPT mapping, then invoke the RPC. Passing a client-supplied NIM directly to a `SECURITY DEFINER` function would create an impersonation risk unless the function independently verifies caller identity.

**Proposed request:**

```json
{
  "candidateId": "candidate-uuid"
}
```

**Proposed success response:**

```json
{
  "success": true,
  "code": "SUCCESS",
  "receipt": {
    "token": "opaque-receipt-token"
  }
}
```

The receipt field is illustrative. The PRD says a random token is generated on the client, but does not define whether the token is persisted, signed, or recoverable. It must not be represented as proof of a committed vote until that behavior is designed and verified.

**RPC result codes specified by PRD:**

| Code | Meaning |
|---|---|
| `SUCCESS` | Vote was recorded |
| `VOTING_CLOSED` | Voting is not currently open |
| `NOT_REGISTERED` | NIM is not in the DPT |
| `ALREADY_VOTED` | Voter has already cast a vote |
| `INVALID_CANDIDATE` | Candidate does not exist or is not active |

**Proposed HTTP mapping — requires approval:**

| RPC / condition | Proposed HTTP status | Notes |
|---|---:|---|
| `SUCCESS` | 200 or 201 | Select one convention and keep it consistent |
| `VOTING_CLOSED` | 409 | State conflict |
| `NOT_REGISTERED` | 403 or 404 | Avoid leaking DPT membership to unauthenticated callers |
| `ALREADY_VOTED` | 409 | Duplicate participation |
| `INVALID_CANDIDATE` | 422 | Invalid submitted selection |
| Invalid request body | 400 or 422 | Align with validation convention |
| Missing / invalid session | 401 | Authentication failure |
| Insufficient admin permission | 403 | Authorization failure |
| Unexpected server failure | 500 | Return safe message and correlation ID only |

These HTTP mappings are proposals, not PRD decisions.

**Required invariants:**

1. Exactly one ballot can be recorded for a DPT voter.
2. The voter state update and ballot insertion must succeed or fail atomically.
3. The ballot row must not contain NIM, voter ID, email, IP address, session ID, or another direct voter identifier.
4. The client must not be able to select an inactive or nonexistent candidate.
5. A retry after an uncertain network outcome must not create a second ballot.
6. The response must not disclose candidate choice through the receipt view or a voter-status endpoint.

### 5.5 Receipt

The UI specification describes a success receipt with the election date and a random hexadecimal token, without displaying the selected candidate.

**TBD — receipt semantics**

The project must decide:

- Is the token generated client-side or server-side?
- Is it stored in the database?
- Can the voter retrieve it after signing in again or changing devices?
- Does it prove only that the UI received a success response, or does it prove a committed database transaction?
- Can an administrator validate a receipt without learning the voter's identity or candidate choice?
- What happens if the database commits but the HTTP response is lost?

Until these questions are resolved, the receipt should be treated as a UI confirmation artifact, not a cryptographic voting receipt.

## 6. Administrative contracts

All administrative operations must authenticate the actor, authorize the specific action, validate inputs server-side, and create an audit record where applicable.

### 6.1 DPT import

**Proposed operations:**

- `POST /api/admin/dpt/preview`
- `POST /api/admin/dpt/import`

The PRD requires CSV/XLSX upload with fields:

- `nim`
- `email`
- `name`
- `generation`

The workflow should support duplicate checking before import.

**Proposed preview output:**

- Total rows read.
- Valid rows.
- Invalid rows with row number and safe validation reason.
- Duplicate NIMs / emails within the uploaded file.
- Conflicts with existing DPT records.
- Summary of the action that would be taken on commit.

**TBD — import semantics**

The PRD does not define whether import is all-or-nothing, whether existing records can be updated, or how partial errors are handled. Decide transaction boundaries, duplicate policy, upsert policy, rollback behavior, maximum file size, and whether an import can modify `has_voted`.

### 6.2 Election settings

**Proposed operation:** `PATCH /api/admin/election-settings`

The PRD identifies `is_voting_open`, `start_time`, `end_time`, and `maintenance_mode`.

The operation must reject invalid time ranges and must be restricted to the appropriate operator role.

**TBD:** Whether toggling `is_voting_open` can override the configured start/end window, who may enable maintenance mode, and whether changes require a second-person approval.

### 6.3 Private tally

**Specified route:** `GET /api/admin/tally`

The PRD explicitly requires a regular student to receive HTTP 403.

Requirements:

- Authenticate and authorize the caller as an allowed election administrator.
- Do not expose this endpoint to public or student clients.
- Do not return candidate tally while the election is active to unauthorized users.
- Do not rely on hiding the URL or UI as access control.
- Log administrative access according to the approved audit policy.

**TBD:** Whether authorized KPR/Admin users can see tally during active voting, or only after the election is closed. The PRD says the live count is private until official close; it does not fully define which administrative roles may see it before close.

### 6.4 Turnout and generation breakdown

The PRD requires turnout and generation breakdown. These aggregates must be separated from candidate tally.

**Proposed operation:** `GET /api/admin/turnout`

The endpoint may return aggregate counts such as total DPT, total participants, participation percentage, and generation-level turnout. It must not return a voter-by-voter list unless a separate, explicitly authorized administrative use case requires it.

**TBD:** Whether turnout aggregates may be visible during active voting, and whether small generation groups require suppression to reduce re-identification risk.

### 6.5 Report export

The PRD requires PDF and Excel reports.

**Proposed operation:** `GET /api/admin/reports/{format}` where `format` is `pdf` or `xlsx`.

The export must be authorized server-side and must follow the same tally-visibility policy as the dashboard.

**TBD:** Exact report fields, whether reports are generated synchronously, retention policy, and whether exported files contain any personal data.

## 7. Validation and error handling

### 7.1 Validation rules

Validate all external inputs on the server, including:

- Candidate UUID format.
- DPT file type and size.
- Required DPT columns.
- NIM and email format.
- Election time range.
- Allowed report format.
- Administrative action payloads.

Client-side validation is for usability only and must not replace server-side validation.

### 7.2 Error response format

**Proposed common error envelope:**

```json
{
  "error": {
    "code": "ALREADY_VOTED",
    "message": "A vote has already been recorded for this account."
  }
}
```

Do not return raw SQL errors, stack traces, secrets, internal table details, or sensitive identity data to the client.

### 7.3 Error code ownership

- Ballot business result codes must remain aligned with the PRD RPC codes.
- Authentication and authorization errors must be distinguishable from business outcomes.
- Validation errors should identify the invalid field without echoing sensitive input.
- Unexpected errors should be logged server-side with a correlation identifier.

## 8. Rate limiting, idempotency, and concurrency

The PRD requires a concurrency test with five simultaneous requests for the same NIM, where exactly one returns `SUCCESS` and four return `ALREADY_VOTED`.

API implementation must preserve this behavior even when requests are duplicated, retried, or sent from multiple tabs.

**Required:**

- Database row locking and transaction atomicity remain authoritative.
- UI disabling / debounce is not a substitute for server-side concurrency control.
- Consider rate limiting sign-in, DPT lookup, and administrative import endpoints.
- Do not rate-limit in a way that prevents a legitimate voter from recovering from a transient network failure.

**TBD:** Whether an explicit idempotency key is required for ballot requests. If introduced, it must not create a link between voter identity and the stored ballot.

## 9. Privacy and logging

The API must maintain the separation between voter identity records and ballot records.

Never include the following in ballot records or ballot-facing logs:

- NIM.
- Voter UUID.
- Email or name.
- IP address.
- Session identifier.
- A precise timestamp that could be used to correlate an individual voter with a ballot.

The PRD permits a date-only field on the ballot. The `audit_logs` table separately includes `actor_email`, `action`, `details`, `ip_address`, and `created_at`; access and retention for these records require a separate policy.

**Important:** Application, hosting, analytics, and reverse-proxy logs can also create correlation risk even if the `ballots` table is clean. Logging configuration must be reviewed as part of the privacy threat model.

## 10. API security checklist

- [ ] Validate Entra identity server-side.
- [ ] Define and test the identity-to-DPT mapping.
- [ ] Enforce role authorization on every admin operation.
- [ ] Ensure a regular student receives 403 from `/api/admin/tally`.
- [ ] Do not accept client-supplied NIM as caller identity.
- [ ] Keep service-role credentials server-side only.
- [ ] Validate all inputs with server-side schemas.
- [ ] Review Supabase RLS, grants, and RPC execution privileges.
- [ ] Review `SECURITY DEFINER` ownership, `search_path`, and callable roles.
- [ ] Prevent ballot-to-voter correlation in database and operational logs.
- [ ] Ensure vote transaction is atomic and concurrency-safe.
- [ ] Ensure retries cannot create duplicate votes.
- [ ] Keep tally access policy separate from turnout access policy.
- [ ] Avoid exposing candidate choice on receipt or voter-status responses.
- [ ] Return safe error messages without internal implementation details.
- [ ] Test authentication, authorization, validation, concurrency, and privacy boundaries with Playwright and database-level tests.

## 11. Required API test scenarios

| Test ID | Scenario | Expected result |
|---|---|---|
| API-T01 | Request voter status without a session | 401 or documented unauthenticated behavior |
| API-T02 | Authenticated identity not found in DPT | Denied from ballot flow |
| API-T03 | Eligible voter reads own status | Only own eligibility / participation state returned |
| API-T04 | Student requests `/api/admin/tally` | HTTP 403 |
| API-T05 | Authorized admin requests tally | Allowed only under approved tally policy |
| API-T06 | Submit malformed candidate UUID | Validation failure; no ballot inserted |
| API-T07 | Submit inactive candidate | `INVALID_CANDIDATE`; no ballot inserted |
| API-T08 | Submit ballot while voting is closed | `VOTING_CLOSED`; no ballot inserted |
| API-T09 | Submit ballot for non-DPT identity | `NOT_REGISTERED`; no ballot inserted |
| API-T10 | Submit a second ballot for same voter | `ALREADY_VOTED`; no second ballot inserted |
| API-T11 | Five concurrent requests for one NIM | Exactly one `SUCCESS`, four `ALREADY_VOTED` |
| API-T12 | Simulate lost response after commit and retry | No duplicate ballot |
| API-T13 | Inspect ballot response and receipt | Candidate choice and voter identity are not disclosed |
| API-T14 | Student calls DPT import or election settings operation | HTTP 403 |
| API-T15 | Malformed / duplicate DPT import file | Preview reports errors; no unintended partial mutation |
| API-T16 | Unauthorized report export | HTTP 401/403 as applicable |

## 12. Open decisions

| ID | Decision required | Why it matters |
|---|---|---|
| API-DEC-01 | Server Actions vs Route Handlers per operation | Defines transport, status semantics, and test boundaries |
| API-DEC-02 | Canonical Entra claim and NIM mapping | Prevents identity spoofing and mismatched DPT records |
| API-DEC-03 | Role-permission matrix for KPR, Admin, Superadmin | Prevents excessive administrative privilege |
| API-DEC-04 | Exact voter status response and ineligible UX | Avoids accidental disclosure of DPT membership |
| API-DEC-05 | Candidate and election-state public visibility | Defines unauthenticated and student access |
| API-DEC-06 | HTTP mapping for RPC result codes | Stabilizes frontend behavior and API tests |
| API-DEC-07 | Receipt token generation, persistence, and verification | Determines whether receipt proves a committed vote |
| API-DEC-08 | Idempotency strategy for vote retries | Handles uncertain network outcomes safely |
| API-DEC-09 | DPT import atomicity and conflict policy | Prevents partial or destructive imports |
| API-DEC-10 | Tally visibility by role and election state | Enforces private-count requirement |
| API-DEC-11 | Turnout visibility and small-group suppression | Reduces inference and re-identification risk |
| API-DEC-12 | Export schema, retention, and personal-data policy | Controls downstream disclosure |
| API-DEC-13 | Rate limits and request size limits | Protects availability and administrative endpoints |
| API-DEC-14 | Audit and operational logging policy | Avoids creating identity-to-ballot correlation |

## 13. Completion criteria

This document can move from Draft to Approved when:

1. The project confirms the actual route / Server Action architecture.
2. Entra claim mapping to the DPT is specified and tested.
3. The role-permission matrix is approved.
4. The ballot request cannot accept an arbitrary client-supplied NIM.
5. The RPC and HTTP result contracts are aligned.
6. Receipt semantics and retry behavior are defined.
7. Tally and turnout visibility rules are approved separately.
8. DPT import behavior is specified.
9. Security and privacy logging rules are reviewed.
10. The API test scenarios are implemented or mapped to existing tests.

## 14. Next document

**Next in sequence: `AUTHENTICATION.md`** — identity provider configuration, Entra claim mapping, session lifecycle, authorization roles, and account eligibility flow.

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 0.1.0 | 2026-10-31 | Initial API operation inventory and draft contracts based on current PRD and project context |
