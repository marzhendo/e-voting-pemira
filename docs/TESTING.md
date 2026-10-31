# Testing Strategy & Test Plan — E-Voting Pemira HMIF

| Metadata | Value |
|---|---|
| Document | Testing Strategy & Test Plan |
| Project | E-Voting Pemira HMIF |
| Version | 0.1.0 |
| Status | Draft — Requires Engineering and Election Stakeholder Review |
| Basis | PRD v1.0.0, UI.md, ARCHITECTURE.md, DATABASE.md, API.md, AUTHENTICATION.md, SECURITY.md, and project context supplied in the conversation |
| Last updated | 2026-10-31 |

> **Status convention**
>
> - **Specified**: explicitly required by the PRD or project context.
> - **Proposed**: recommended test or acceptance criterion, not yet approved.
> - **TBD**: test data, threshold, environment, or expected behavior still needs a decision.
> - A test listed here is a planned test, not evidence that it has already been executed or passed.

---

## 1. Purpose

This document defines the test strategy, test layers, scenarios, and release acceptance criteria for E-Voting Pemira HMIF.

Testing must provide evidence that the system:

1. Authenticates users through the approved institutional identity provider.
2. Allows only eligible DPT voters to access the ballot flow.
3. Enforces One-Man-One-Vote under concurrent and repeated requests.
4. Records voter participation and ballot insertion atomically.
5. Preserves ballot secrecy across database, API, logs, and reports.
6. Restricts administrative operations and candidate tally.
7. Handles election-window and maintenance states correctly.
8. Meets the product's functional, usability, performance, and security requirements.

## 2. Testing principles

- **Risk-first:** prioritize vote integrity, ballot secrecy, identity mapping, and privileged access.
- **Test at the enforcement layer:** UI behavior alone cannot prove server/database authorization.
- **Deterministic tests:** use controlled fixtures, isolated test data, and reproducible setup.
- **No production voter data in routine tests:** use synthetic DPT records and test identities.
- **Independent assertions:** verify both the API response and the persisted database state.
- **Fail closed:** ambiguous identity, invalid authorization, and unavailable critical dependencies must not permit a vote.
- **Evidence-based status:** record test run, environment, build/commit, result, and defect references.

## 3. Scope

### 3.1 In scope

- Unit tests for validation and domain rules.
- Integration tests for Supabase/PostgreSQL and RPC behavior.
- Authentication and authorization tests.
- API and Server Action contract tests.
- End-to-end tests using Playwright.
- Concurrency and idempotency tests.
- Security and privacy verification.
- DPT import and administrative workflow tests.
- Performance and availability tests.
- Regression and release acceptance tests.

### 3.2 Out of scope / not established

The current project sources do not establish:

- A formal test coverage percentage.
- A complete browser/device support matrix.
- A production load-test environment and traffic model.
- A formal independent penetration-test requirement.
- A disaster-recovery RTO/RPO.
- A formal accessibility conformance target.
- The exact CI provider and deployment pipeline.

These must be decided rather than silently assumed.

## 4. Test levels and responsibilities

| Test level | What it verifies | Typical tools | Execution point |
|---|---|---|---|
| Static checks | Type correctness, lint, formatting, dependency checks | TypeScript compiler, project lint tools | Local and CI |
| Unit | Isolated validation and business rules | Project test runner (TBD) | Local and CI |
| Integration | Database schema, RLS, grants, RPC, transactions | PostgreSQL/Supabase test environment | CI / pre-release |
| API / server boundary | Input validation, auth, authorization, error contracts | Test runner and HTTP client | CI |
| E2E | Real user flows through UI and server | Playwright | CI / staging |
| Concurrency | One-vote invariant under simultaneous requests | Scripted integration/load test | Pre-release |
| Security | Abuse cases, privilege boundaries, privacy leakage | Automated checks and manual review | Pre-release |
| Performance | Latency and concurrency targets | Load-test tooling (TBD) | Staging |
| Acceptance | Election workflow and stakeholder sign-off | Test evidence and checklist | Pre-release |

**Tooling note:** Playwright is specified in the project context. The exact unit-test runner, lint command, load-test tool, and CI provider have not been verified from the repository.

## 5. Environments and test data

### 5.1 Recommended environments

| Environment | Purpose | Data policy |
|---|---|---|
| Local development | Unit tests and developer integration | Synthetic data only |
| CI test environment | Repeatable automated tests | Ephemeral synthetic fixtures |
| Staging / pre-production | E2E, concurrency, security, and performance verification | Synthetic DPT and test Entra tenant/accounts |
| Production | Actual election | No destructive test voting; only approved smoke checks |

Do not run concurrency or destructive test scripts against the production election database.

### 5.2 Test data fixtures

Prepare controlled fixtures for:

- Eligible voter who has not voted.
- Eligible voter who has already voted.
- Identity not present in DPT.
- DPT record with malformed or duplicate identity fields.
- Candidate that is active.
- Candidate that is inactive.
- Candidate ID that does not exist.
- Election open and within its time window.
- Election closed or outside its time window.
- Maintenance mode enabled.
- Student role, KPR/operator role, Admin role, and Superadmin role (once role policy is approved).

All fixtures must use non-real identities and must be reset safely between test runs.

### 5.3 Test isolation

- Use a dedicated test database/project or isolated schema.
- Apply migrations before integration tests.
- Seed deterministic fixtures.
- Clean up test data after each run.
- Do not share mutable voter fixtures between parallel tests unless the test explicitly targets concurrency.
- Record which environment and database migration version were used.

## 6. Static checks and unit tests

### 6.1 Static checks

The project context specifies this TypeScript check:

```bash
pnpm tsc --noEmit
```

**Specified project check:** `pnpm tsc --noEmit` must pass.

**TBD:** Confirm the repository's actual scripts for linting, formatting, unit tests, and dependency auditing before adding them as mandatory CI commands.

### 6.2 Unit-test inventory

| ID | Component / rule | Test cases | Expected result |
|---|---|---|---|
| UNIT-01 | DPT identity normalization | Case variants and approved whitespace behavior | Deterministic canonical value |
| UNIT-02 | Identity mapping | Missing, malformed, and ambiguous claims | Fail closed |
| UNIT-03 | Candidate input validation | Valid UUID, malformed UUID, empty value | Valid input accepted; invalid rejected |
| UNIT-04 | Election-window rule | Before start, inside window, after end | Correct availability result |
| UNIT-05 | Maintenance rule | Maintenance on/off | Ballot flow follows approved maintenance policy |
| UNIT-06 | DPT import parser | Valid rows, missing columns, malformed rows | Correct row classification |
| UNIT-07 | DPT duplicate detection | Duplicate NIM/email within file | Conflicts reported |
| UNIT-08 | Report format validation | PDF, XLSX, unsupported format | Only approved formats accepted |
| UNIT-09 | Permission policy | Student/admin/superadmin capability matrix | Deny by default; only approved permission granted |
| UNIT-10 | Error mapping | Known RPC codes and unexpected errors | Stable safe response mapping |

Unit tests should not mock away the database transaction when the purpose of the test is to prove atomicity or concurrency. Those guarantees require integration tests against PostgreSQL.

## 7. Database and integration tests

### 7.1 Schema and constraints

| ID | Test | Expected result |
|---|---|---|
| DB-T01 | Apply all migrations to a clean test database | Schema created successfully |
| DB-T02 | Insert duplicate NIM into DPT | Unique constraint rejects duplicate |
| DB-T03 | Insert duplicate email into DPT | Unique constraint rejects duplicate |
| DB-T04 | Insert ballot referencing unknown candidate | Foreign key rejects insert |
| DB-T05 | Delete candidate referenced by ballot | Delete restricted according to PRD |
| DB-T06 | Insert invalid election settings singleton ID | Check constraint rejects invalid ID |
| DB-T07 | Inspect ballot columns | No voter ID, NIM, email, IP, or session ID column |
| DB-T08 | Inspect ballot time precision | Only date-level voting date is stored, as specified |

### 7.2 RPC behavior

The PRD defines `cast_ballot_secure(p_nim, p_candidate_id)` and these result codes:

- `SUCCESS`
- `VOTING_CLOSED`
- `NOT_REGISTERED`
- `ALREADY_VOTED`
- `INVALID_CANDIDATE`

| ID | Scenario | Expected result |
|---|---|---|
| RPC-T01 | Valid DPT voter, active candidate, voting open | `SUCCESS`; one ballot inserted; voter marked voted |
| RPC-T02 | Unknown NIM | `NOT_REGISTERED`; no ballot inserted |
| RPC-T03 | Voter already marked as voted | `ALREADY_VOTED`; no new ballot |
| RPC-T04 | Voting closed | `VOTING_CLOSED`; no ballot inserted |
| RPC-T05 | Candidate does not exist | `INVALID_CANDIDATE`; no ballot inserted |
| RPC-T06 | Candidate inactive | `INVALID_CANDIDATE`; no ballot inserted |
| RPC-T07 | Ballot insertion fails after voter update is attempted | Transaction rolls back; no inconsistent state |
| RPC-T08 | Voter update fails | No ballot inserted |
| RPC-T09 | RPC called by unauthorized database role | Execution denied |
| RPC-T10 | RPC called with NIM not bound to caller identity | Cannot impersonate another voter; exact enforcement design TBD |

### 7.3 Atomicity invariant

For every successful vote:

- Exactly one ballot row is inserted.
- The corresponding DPT record has `has_voted = true`.
- Both changes commit together.

For every failed vote:

- No new ballot row remains.
- The DPT state is unchanged unless a separately approved administrative operation changed it.

The test must inspect persisted database state, not rely only on the RPC JSON response.

## 8. Authentication and authorization tests

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-T01 | Valid institutional Entra sign-in | Application session established |
| AUTH-T02 | Invalid token signature / issuer / audience | Authentication rejected |
| AUTH-T03 | Unapproved tenant | Authentication rejected |
| AUTH-T04 | Missing canonical identity claim | Fail closed |
| AUTH-T05 | Authenticated identity has no DPT match | Ballot access denied |
| AUTH-T06 | Identity maps to multiple DPT rows | Ballot access denied and data issue surfaced |
| AUTH-T07 | Eligible voter has not voted | Ballot booth available only when election is open |
| AUTH-T08 | Eligible voter already voted | Ballot booth denied; already-voted state shown |
| AUTH-T09 | Student requests `/api/admin/tally` | HTTP 403, as required by PRD |
| AUTH-T10 | Student attempts DPT import | HTTP 403 |
| AUTH-T11 | Student attempts election-settings mutation | HTTP 403 |
| AUTH-T12 | Expired session/token | Protected operation rejected |
| AUTH-T13 | Logged-out session is reused | Old session rejected |
| AUTH-T14 | Client submits another person's NIM | Server cannot be made to vote as that person |
| AUTH-T15 | Role revoked during active session | Revocation follows approved policy |
| AUTH-T16 | OIDC callback contains untrusted redirect target | Open redirect prevented |

The canonical Entra claim, session library, and role source of truth remain open decisions. Tests must be finalized after those decisions are approved.

## 9. API and application workflow tests

| ID | Scenario | Expected result |
|---|---|---|
| API-T01 | Request voter status without session | 401 or documented unauthenticated behavior |
| API-T02 | Eligible voter reads own status | Only own status returned |
| API-T03 | Student requests admin tally | HTTP 403 |
| API-T04 | Submit malformed candidate UUID | Validation failure; no ballot |
| API-T05 | Submit inactive candidate | Invalid candidate result; no ballot |
| API-T06 | Submit vote while voting closed | Voting closed result; no ballot |
| API-T07 | Submit second vote | Already voted result; no second ballot |
| API-T08 | Retry after uncertain network response | No duplicate ballot |
| API-T09 | Receipt view is opened | No candidate choice or voter identity exposed |
| API-T10 | Unauthorized report export | 401/403 as applicable |
| API-T11 | Invalid election time range submitted | Validation failure; settings unchanged |
| API-T12 | Unexpected server/database error | Safe error response; diagnostic details stay server-side |

The PRD explicitly names `/api/admin/tally`; other API route names are proposals documented in `API.md`. If the implementation uses Server Actions rather than Route Handlers, test the equivalent server boundary.

## 10. End-to-end tests with Playwright

### 10.1 Voter happy path

**E2E-T01 — Eligible voter casts a vote**

1. Open the application.
2. Sign in with a synthetic eligible Entra test account.
3. Verify DPT eligibility.
4. Verify candidate list is displayed.
5. Select an active candidate.
6. Open the confirmation dialog.
7. Confirm the selection.
8. Wait for successful transaction response.
9. Verify receipt screen appears.
10. Verify the UI does not display candidate choice on the receipt.
11. Verify the DPT record is marked as having voted and exactly one ballot exists in the test database.

Expected: one successful vote and one receipt state.

### 10.2 Voter rejection paths

| ID | Scenario | Expected UI behavior |
|---|---|---|
| E2E-T02 | User not found in DPT | Clear ineligible message; no ballot booth |
| E2E-T03 | User already voted | Already-voted / receipt state; no new ballot |
| E2E-T04 | Voting window closed | Voting unavailable state |
| E2E-T05 | Maintenance mode active | Approved maintenance state; vote cannot be cast |
| E2E-T06 | Candidate list contains no active candidate | Safe empty/error state; no invalid ballot |
| E2E-T07 | User cancels confirmation dialog | No ballot is inserted |
| E2E-T08 | User changes candidate before final confirmation | Only final confirmed candidate is submitted |

### 10.3 Admin workflows

| ID | Scenario | Expected result |
|---|---|---|
| E2E-T09 | Student opens admin URL directly | Access denied |
| E2E-T10 | Admin opens dashboard | Only permitted administrative data shown |
| E2E-T11 | Admin previews valid DPT file | Preview summary and validation results shown |
| E2E-T12 | Admin uploads malformed DPT file | Errors shown; no unintended mutation |
| E2E-T13 | Authorized operator changes election settings | Change saved and audit event created |
| E2E-T14 | Student opens tally endpoint directly | HTTP 403 |
| E2E-T15 | Authorized admin opens tally | Access follows approved election-state policy |
| E2E-T16 | Admin exports report | Authorized file generated with approved fields |

### 10.4 UI and responsive tests

The UI specification describes login, candidate cards, confirmation modal, receipt, and admin dashboard.

Recommended checks:

- Login layout at desktop and mobile breakpoints.
- Candidate card image and text do not overflow.
- Kotak Kosong option is distinguishable and correctly positioned.
- Confirmation modal clearly states the finality of the choice.
- Keyboard navigation and focus behavior work in the confirmation dialog.
- Receipt does not display candidate choice.
- Admin dashboard hides restricted information from unauthorized roles.
- Loading, empty, and error states are usable on mobile.
- HMIF palette and typography follow the approved UI specification.

**TBD:** Supported viewport sizes, browser matrix, and formal accessibility target.

## 11. Concurrency and retry testing

### 11.1 Required PRD concurrency test

The PRD explicitly requires at least five concurrent requests for the same NIM.

**CON-T01:**

- Prepare one eligible test voter with `has_voted = false`.
- Ensure voting is open and candidate is active.
- Submit five simultaneous vote requests for that same voter.
- Wait for all responses.
- Inspect the database.

**Expected result:**

- Exactly one request returns `SUCCESS`.
- Exactly four requests return `ALREADY_VOTED`.
- Exactly one ballot row exists for the test scenario.
- The voter record is marked `has_voted = true`.

### 11.2 Recommended extended tests

| ID | Scenario | Expected result |
|---|---|---|
| CON-T02 | 10 simultaneous requests for one voter | One success; remaining requests rejected as already voted |
| CON-T03 | 100 concurrent requests across distinct eligible voters | No duplicate vote per voter; no lost committed votes |
| CON-T04 | Two browser tabs submit for same voter | One vote only |
| CON-T05 | Client retries after timeout where first transaction committed | No duplicate ballot |
| CON-T06 | Database failure during transaction | No partial voter/ballot state |
| CON-T07 | Voting closes while requests are in flight | Behavior follows transaction-time election-window policy; must be specified |
| CON-T08 | Candidate is deactivated while requests are in flight | Behavior follows transaction-time candidate validation; must be specified |

The 100-concurrent-request scenario is a proposed stress test, not a substitute for the PRD's five-request acceptance test.

## 12. Security and privacy tests

| ID | Test | Expected result |
|---|---|---|
| SEC-T01 | Attempt to vote using another NIM in request body | Cannot impersonate another voter |
| SEC-T02 | Invoke privileged RPC as unauthorized role | Execution denied |
| SEC-T03 | Inspect ballot schema and stored rows | No direct voter identifiers or precise timestamp |
| SEC-T04 | Inspect application/proxy/database logs | No practical voter-to-choice correlation path |
| SEC-T05 | Student reads DPT through client database API | Access denied |
| SEC-T06 | Student writes directly to ballots | Access denied |
| SEC-T07 | Student modifies `has_voted` | Access denied |
| SEC-T08 | Student accesses private tally | HTTP 403 |
| SEC-T09 | XSS payload in candidate/DPT text | Rendered as text; not executed |
| SEC-T10 | CSRF attempt against admin mutation | Rejected or protected |
| SEC-T11 | Invalid OIDC state/nonce/issuer/audience | Authentication rejected |
| SEC-T12 | Expired or revoked session | Protected operation rejected |
| SEC-T13 | Receipt inspected for identity and candidate data | Neither is exposed |
| SEC-T14 | Report export inspected | Only approved fields included |
| SEC-T15 | Admin override executed | Authorized, reason recorded, audit trail created |
| SEC-T16 | Database `SECURITY DEFINER` configuration reviewed | Owner, search_path, and grants meet approved policy |

Security tests should include both automated checks and manual review. Passing UI tests does not prove RLS, grants, RPC privileges, or log privacy are correct.

## 13. Performance and load tests

### 13.1 PRD performance targets

The PRD states:

- Vote casting response target under 400 ms at 100 concurrent requests.
- Support for 500 active users.

These targets require clarification before they can be used as a formal acceptance gate.

**TBD measurement definition:**

- Does 400 ms mean API response time, RPC execution time, or end-to-end browser interaction?
- Is it p95, p99, or maximum observed latency?
- Does the 100-concurrent-request test use 100 distinct voters or repeated requests for one voter?
- What workload defines 500 active users?
- What network region and staging resource size are used?

### 13.2 Proposed performance test matrix

| ID | Workload | Proposed measurement |
|---|---|---|
| PERF-T01 | 100 concurrent distinct eligible voters | API latency distribution, success/error rate, DB load |
| PERF-T02 | Five simultaneous requests for one voter | Correct One-Man-One-Vote result under contention |
| PERF-T03 | 500 simulated active sessions | Session handling, page/API responsiveness, resource utilization |
| PERF-T04 | Candidate list read under load | Response latency and cache behavior |
| PERF-T05 | Admin dashboard aggregates under load | Query latency and access isolation |
| PERF-T06 | DPT import at agreed maximum size | Processing time, memory use, and failure handling |

Do not report a performance test as passed until the workload, environment, percentile, and measurement point are documented.

## 14. Regression test suite

The following scenarios should run after changes to authentication, database schema, RPC, ballot UI, election settings, or admin permissions:

- Eligible voter happy path.
- Non-DPT rejection.
- Already-voted rejection.
- Voting-closed rejection.
- Invalid candidate rejection.
- Five-request concurrency test.
- Student tally 403 test.
- Direct database write denial.
- Receipt privacy check.
- DPT import preview and validation.
- Election settings authorization.
- TypeScript typecheck.

Changes to ballot schema, identity mapping, RPC, or logging require a targeted security/privacy regression review.

## 15. CI and execution workflow

**Specified project check:**

```bash
pnpm tsc --noEmit
```

**Proposed pipeline stages:**

1. Install dependencies with the repository's pinned package manager/lockfile.
2. Run TypeScript typecheck.
3. Run lint and formatting checks if configured in the repository.
4. Run unit tests.
5. Start or connect to isolated test database.
6. Apply migrations and seed synthetic fixtures.
7. Run integration and RPC tests.
8. Run API/server-boundary tests.
9. Run Playwright E2E tests.
10. Publish test reports and retain failure artifacts securely.

Concurrency, performance, and security tests may run in a separate staging pipeline if they require dedicated infrastructure.

**TBD:** Actual CI provider, workflow filenames, test scripts, and secret-management mechanism. Do not invent command names before checking `package.json` and repository configuration.

## 16. Defect severity and release handling

**Proposed severity model:**

| Severity | Example | Release handling |
|---|---|---|
| Critical | Double voting, ballot secrecy breach, unauthorized tally access, arbitrary voter impersonation | Release blocked |
| High | DPT corruption, unauthorized admin action, broken election-window enforcement | Release blocked until fixed or formally risk-accepted by authorized stakeholders |
| Medium | Important workflow failure with workaround and no integrity/privacy impact | Fix or obtain documented acceptance |
| Low | Minor visual or non-critical usability defect | Prioritize according to release plan |

No Critical issue affecting vote integrity, eligibility, ballot secrecy, or result confidentiality may be waived by a purely technical convenience decision.

## 17. Test evidence and reporting

Every test run intended as release evidence should record:

- Test ID and scenario.
- Build commit / version.
- Environment.
- Database migration version.
- Test data fixture identifier (no real voter data).
- Execution date and time.
- Expected result.
- Actual result.
- Pass/fail/blocked status.
- Logs, screenshots, trace, or report artifact where appropriate.
- Defect reference and retest result.

Do not attach real voter personal data, raw identity tokens, or ballot choices to test evidence.

### 17.1 Test status template

| Test ID | Build | Environment | Result | Evidence / defect |
|---|---|---|---|---|
| Example: CON-T01 | TBD | Staging | Not run | TBD |

The table above is a template only. No test execution result is asserted by this document.

## 18. Release acceptance criteria

A release candidate may be considered for election use only when all applicable criteria are evidenced:

### Functional

- [ ] Eligible voter can authenticate and access the ballot flow.
- [ ] Non-DPT identity is denied.
- [ ] Already-voted user cannot cast another vote.
- [ ] Closed voting window prevents vote casting.
- [ ] Active candidate selection and confirmation work correctly.
- [ ] Receipt is displayed only after successful transaction result.
- [ ] DPT import validation and administrative workflows behave as approved.

### Integrity and privacy

- [ ] Five concurrent requests for one NIM produce exactly one SUCCESS and four ALREADY_VOTED.
- [ ] Exactly one ballot row is persisted for the concurrency scenario.
- [ ] Voter state and ballot insertion are atomic.
- [ ] Ballot schema contains no direct voter identifier or precise timestamp.
- [ ] Application and infrastructure logs do not create a practical identity-to-choice correlation path.
- [ ] Receipt does not expose candidate choice.
- [ ] Student cannot read tally or perform admin operations.

### Security

- [ ] Entra identity validation and DPT mapping tests pass.
- [ ] RLS, grants, and privileged RPC permissions are reviewed.
- [ ] Admin role provisioning and revocation are tested.
- [ ] Session/cookie and CSRF behavior are verified.
- [ ] Critical and High threat scenarios have mitigations and test evidence.
- [ ] No unresolved Critical security defect remains.

### Performance and operations

- [ ] PRD performance targets are measured using an approved workload and metric definition.
- [ ] 500-active-user capacity assumption is tested or explicitly accepted with evidence.
- [ ] Monitoring and incident escalation are ready.
- [ ] Backup/restore procedure has been tested.
- [ ] Authorized election stakeholders approve the release candidate.

## 19. Open decisions

| ID | Decision required | Why it matters |
|---|---|---|
| TEST-DEC-01 | Unit-test framework and repository test scripts | Defines executable commands |
| TEST-DEC-02 | CI provider and workflow | Defines automated release gates |
| TEST-DEC-03 | Test database / Supabase isolation strategy | Prevents test data affecting real election |
| TEST-DEC-04 | Entra test tenant and synthetic account setup | Enables repeatable identity tests |
| TEST-DEC-05 | Browser and viewport support matrix | Defines E2E coverage |
| TEST-DEC-06 | Formal accessibility target | Defines accessibility acceptance |
| TEST-DEC-07 | Meaning of 400 ms target | Makes performance results measurable |
| TEST-DEC-08 | Definition of 100 concurrent requests | Distinguishes contention from throughput |
| TEST-DEC-09 | Workload for 500 active users | Defines capacity test |
| TEST-DEC-10 | Load-test tool and staging capacity | Enables reproducible performance tests |
| TEST-DEC-11 | Test coverage threshold, if any | Defines code coverage policy |
| TEST-DEC-12 | Independent penetration-test scope | Defines external security assurance |
| TEST-DEC-13 | Release approvers and defect waiver authority | Defines governance |
| TEST-DEC-14 | Test evidence retention policy | Controls privacy and auditability |

## 20. Completion criteria

This document can move from Draft to Approved when:

1. Test scripts and tooling are confirmed against the actual repository.
2. Each required scenario is mapped to an automated test or documented manual procedure.
3. Test environments and synthetic data are available.
4. The PRD concurrency test is executable and produces database-level evidence.
5. Security and privacy tests cover the application and database enforcement layers.
6. Performance target definitions are approved.
7. CI and release gates are implemented.
8. Test evidence and defect handling are documented.
9. Release acceptance criteria are approved by the responsible stakeholders.

## 21. Next document

**Next in sequence: `DEPLOYMENT.md`** — environment configuration, Entra/Supabase setup, build and deployment workflow, secrets, migration, rollback, monitoring, and production readiness.

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 0.1.0 | 2026-10-31 | Initial test strategy and test plan based on current project documentation |


## Addendum — Dummy-account phase and RBAC test matrix (2026-10-31)

### Initial test phase

Use synthetic dummy identities and an isolated mock authentication provider before the Telkom University Tenant ID is available. Seed only synthetic DPT/admin records. The mock provider must be explicitly enabled for development/test and must be rejected in production. Test the same DPT and server-side authorization paths used by the Entra provider.

### Required RBAC tests

| Test | Expected result |
|---|---|
| Student/dummy voter calls admin endpoint | HTTP 403 |
| Unknown or inactive admin identity calls admin endpoint | HTTP 403 |
| `kpr_admin` imports valid DPT file | Allowed; audit event recorded |
| `auditor` attempts DPT import or mutation | HTTP 403 |
| `auditor` requests pre-close candidate tally | HTTP 403 |
| `auditor` reads permitted audit/turnout/final report | Allowed, read-only |
| `super_admin` manages admin whitelist | Allowed; audit event recorded |
| `super_admin` requests pre-close candidate tally | HTTP 403 by default |
| Any admin requests individual ballot-to-voter linkage | Denied; no such query/API should exist |
| Admin is deactivated while session remains active | Next protected authorization check denies access |
| Dummy authentication is requested in production | Authentication rejected |

### Later Entra integration phase

After obtaining and verifying the Telkom University Tenant ID, test with an authorized student account: token issuer/audience/signature/expiry validation, `tid` restriction, consent or admin-consent behavior, required claims, exact DPT matching, first-login `tid` + `oid` binding, and denial for non-DPT accounts. Do not cast a real election ballot during this integration test.
