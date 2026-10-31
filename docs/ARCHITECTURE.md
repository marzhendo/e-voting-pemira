# System Architecture --- E-Voting Pemira HMIF

  -----------------------------------------------------------------------
  Metadata                            Value
  ----------------------------------- -----------------------------------
  Project                             E-Voting Pemira HMIF

  Document                            `docs/ARCHITECTURE.md`

  Version                             0.1.0 --- Initial Draft

  Status                              Draft --- Requires Technical Review

  Primary source                      `docs/PRD.md` v1.0.0

  UI reference                        `docs/UI.md`

  Project guidance                    Root `AGENTS.md` (project-provided
                                      summary; exact file must be
                                      verified)
  -----------------------------------------------------------------------

> **Document authority:** This document translates the currently
> available product and project constraints into a logical system
> architecture. It does not silently replace the PRD, settle unresolved
> security decisions, or claim that an implementation has already been
> verified.

## 1. Purpose

This document describes the logical architecture of the E-Voting Pemira
HMIF application: its major components, responsibilities, external
integrations, data flows, trust boundaries, and security invariants.

The architecture supports the product goals defined in `PRD.md`:

-   One-Man-One-Vote and prevention of double voting.
-   Ballot secrecy through separation of voter eligibility data and
    ballot records.
-   Institutional authentication through Microsoft Entra ID.
-   DPT-based voter eligibility.
-   Restricted access to election administration and private tally
    information.
-   A responsive web experience for desktop and mobile browsers.

## 2. Scope and architectural baseline

### 2.1 Confirmed project baseline

The following baseline comes from the project information supplied by
the team and the current PRD:

  -----------------------------------------------------------------------
  Area                                Baseline
  ----------------------------------- -----------------------------------
  Web application                     Next.js App Router

  Language                            TypeScript

  UI styling                          Tailwind CSS with HMIF color tokens

  Database and backend platform       Supabase / PostgreSQL

  Institutional identity provider     Microsoft Entra ID

  Authentication integration          MSAL / Azure provider, as specified
                                      in the project guidance summary

  Input validation                    Zod at Server Actions / Route
                                      Handler trust boundaries, as
                                      specified in the project guidance
                                      summary

  End-to-end testing                  Playwright

  Package manager / commands          `pnpm`; `pnpm tsc --noEmit` is
                                      required by the project guidance
                                      summary
  -----------------------------------------------------------------------

**Verification note:** the exact root `AGENTS.md`, package manifest,
installed authentication library, Supabase client setup, and current
repository structure have not been inspected as part of this document
draft. Treat implementation-specific details above as the supplied
project baseline, not as independently verified repository facts.

### 2.2 In-scope capabilities

1.  Microsoft Entra ID sign-in.
2.  DPT eligibility verification.
3.  Candidate and ballot-booth presentation.
4.  Candidate selection and final confirmation.
5.  Atomic ballot casting through `cast_ballot_secure`.
6.  Digital voting receipt.
7.  KPR administration dashboard and election controls.
8.  DPT import and management.
9.  Restricted election tally and participation monitoring.
10. Administrative audit trail and election report export.

### 2.3 Out of scope

The PRD explicitly excludes:

-   Interactive debates or live Q&A inside the website.
-   Self-service voter account registration.
-   Public display of vote tally while voting is active.

## 3. Architecture principles

The following principles are mandatory constraints for design and
implementation.

### 3.1 Ballot secrecy by data separation

Voter eligibility and voting participation are represented separately
from ballot selections.

-   `voters_whitelist` stores voter identity and participation state.
-   `ballots` stores candidate selection records.
-   `ballots` must not contain voter ID, NIM, email, IP address, session
    ID, or a foreign key to a voter record.
-   No application feature may expose a mapping between a voter identity
    and a selected candidate.

The separation must be preserved in database schema, application
queries, logs, analytics, exports, and operational tooling.

### 3.2 Atomic vote casting

The PRD defines `cast_ballot_secure` as the database operation
responsible for validating voting eligibility and recording a vote.

The operation must ensure that:

1.  The election is open and within its configured time window.
2.  The voter exists in the official whitelist.
3.  The voter has not already voted.
4.  The selected candidate is valid and active.
5.  The voter participation state is updated.
6.  The anonymous ballot is inserted.

The voter-state update and ballot insertion must succeed or fail as one
database transaction. Row-level locking is specified in the PRD to
prevent concurrent duplicate voting.

### 3.3 Restricted visibility

Election results and administrative capabilities must only be available
to authorized KPR/Admin users and other explicitly authorized roles.

A hidden UI element is not an authorization control. Every protected
server operation and data query must enforce authorization
independently.

### 3.4 Idempotency and duplicate-submission resistance

The UI should prevent accidental repeated submission, but client-side
disabling or debouncing is not a substitute for database enforcement.

The database transaction remains the authoritative control for
One-Man-One-Vote.

### 3.5 Fail-safe behavior

Authentication, authorization, validation, database, and RPC failures
must not be interpreted as success.

The application must not display a successful vote receipt until the
server has received and verified a successful result from the
vote-casting operation.

### 3.6 Responsive and consistent interface

The application must support mobile and desktop browser layouts. HMIF
visual tokens are defined in the PRD and Tailwind configuration.

The formal UI blueprint and the latest approved Google Stitch designs
must be reconciled before implementation of a screen.

## 4. Logical system context

``` mermaid
flowchart LR
    V["Mahasiswa Pemilih"]
    A["Panitia KPR / Admin"]
    S["Superadmin / Koordinator IT"]
    APP["E-Voting Web Application<br/>Next.js App Router"]
    IDP["Microsoft Entra ID"]
    DB["Supabase PostgreSQL"]
    TEST["Playwright E2E Tests"]

    V -->|"Sign-in, eligibility, cast vote"| APP
    A -->|"DPT, monitoring, election operations"| APP
    S -->|"Privileged administration"| APP
    APP <-->|"OIDC authentication flow"| IDP
    APP <-->|"Authorized server-side data access / RPC"| DB
    TEST -->|"Browser-level verification"| APP
```

### 4.1 External systems

  -----------------------------------------------------------------------
  System                  Responsibility          Boundary
  ----------------------- ----------------------- -----------------------
  Microsoft Entra ID      Institutional identity  External identity
                          authentication          provider; credentials
                                                  are not managed by the
                                                  application

  Supabase PostgreSQL     Persistent election     Authoritative data
                          data and transactional  store
                          vote casting            

  Playwright              Automated browser-level Test tooling, not a
                          test execution          production runtime
                                                  dependency
  -----------------------------------------------------------------------

The PRD and supplied project guidance identify these systems. Hosting
provider, email delivery, observability provider, object storage, and
backup provider are not established in the currently available
specifications.

## 5. Logical application components

The following is a logical decomposition. It does not prescribe a final
source-code folder structure.

### 5.1 Presentation layer

Responsibilities:

-   Render public login and access states.
-   Render the voter ballot booth and confirmation dialog.
-   Render the voting receipt.
-   Render administrative pages.
-   Provide responsive interaction and accessible feedback.
-   Prevent accidental repeated actions at the UI layer.

Presentation components must not independently determine voter
eligibility, role permissions, election state, or whether a ballot was
successfully recorded.

### 5.2 Authentication and session boundary

Responsibilities:

-   Initiate and complete Microsoft Entra ID authentication.
-   Validate the authentication response through the configured provider
    integration.
-   Establish the application session using the project's approved
    session strategy.
-   Make the authenticated principal available to server-side
    authorization checks.
-   Enforce the short-lived voting-session requirement from the PRD.

The exact callback route, token validation library, refresh behavior,
cookie implementation, and session revocation behavior require
confirmation in `AUTH.md`.

### 5.3 Application service layer

Responsibilities:

-   Enforce application use cases.
-   Validate input at trust boundaries using Zod, as required by the
    supplied project guidance.
-   Resolve the authenticated principal.
-   Enforce role and resource authorization.
-   Call database operations through approved server-side access paths.
-   Normalize expected business failures into stable application
    responses.
-   Avoid exposing privileged database credentials to the browser.

Candidate use cases include:

-   Verify voter eligibility.
-   Read active candidates and election settings.
-   Submit a ballot.
-   Read a voter's participation state.
-   Import and validate DPT data.
-   Search DPT records.
-   Read authorized participation aggregates.
-   Read tally data only when the election policy and role permit it.
-   Change election settings.
-   Write administrative audit events.
-   Export authorized election reports.

The final split between Server Actions and Route Handlers must be
documented in `API.md`; this architecture does not assume every use case
must use one mechanism.

### 5.4 Data and transaction layer

Supabase PostgreSQL is the persistent data platform identified by the
PRD.

The PRD defines these principal tables:

  -----------------------------------------------------------------------
  Table                               Logical responsibility
  ----------------------------------- -----------------------------------
  `voters_whitelist`                  Official voter identity, cohort,
                                      eligibility and `has_voted`
                                      participation state

  `candidates`                        Candidate or candidate-pair
                                      information, including candidate
                                      number and active state

  `ballots`                           Anonymous candidate selections

  `election_settings`                 Election window and maintenance
                                      state

  `audit_logs`                        Administrative activity records
  -----------------------------------------------------------------------

The PRD also defines `cast_ballot_secure` as the atomic vote-casting
database function.

Detailed DDL, indexes, constraints, RLS, grants, function ownership, and
migration strategy belong in `DATABASE.md`.

### 5.5 External identity integration

Microsoft Entra ID is the institutional identity provider.

The application uses the authenticated institutional identity to perform
a server-side match against the official DPT. The PRD identifies `email`
and `preferred_username` as token attributes to be considered for
identity matching, including a possible NIM extraction pattern.

The authoritative matching rule must be finalized in `AUTH.md`. The
application must not trust a NIM supplied only by an editable browser
field.

## 6. Core runtime flows

### 6.1 Voter authentication and eligibility

``` mermaid
sequenceDiagram
    actor V as Voter
    participant UI as Next.js UI
    participant Auth as Entra ID / Auth Integration
    participant App as Server Application
    participant DB as Supabase PostgreSQL

    V->>UI: Open login page
    V->>UI: Select institutional sign-in
    UI->>Auth: Start sign-in
    Auth-->>UI: Authentication response
    UI->>App: Complete server-side authentication
    App->>App: Validate identity and session
    App->>DB: Match authenticated identity to DPT
    DB-->>App: Eligibility and has_voted state
    alt Not registered
        App-->>UI: Deny voter access
    else Already voted
        App-->>UI: Route to already-voted / receipt state
    else Eligible and not voted
        App-->>UI: Grant ballot-booth access
    end
```

The PRD specifies that a voter outside the DPT is denied access and a
voter with `has_voted = true` cannot return to the ballot booth.

### 6.2 Ballot casting

``` mermaid
sequenceDiagram
    actor V as Voter
    participant UI as Ballot Booth UI
    participant App as Server Application
    participant DB as Supabase PostgreSQL

    V->>UI: Select candidate
    UI-->>V: Show final confirmation
    V->>UI: Confirm submission
    UI->>App: Submit selected candidate
    App->>App: Validate session, authorization and input
    App->>DB: Invoke cast_ballot_secure
    DB->>DB: Check election window
    DB->>DB: Lock voter row and check has_voted
    DB->>DB: Validate candidate
    DB->>DB: Update voter participation state
    DB->>DB: Insert anonymous ballot
    DB-->>App: Transaction result
    alt Successful transaction
        App-->>UI: Confirm successful recording
        UI-->>V: Display receipt
    else Rejected or failed transaction
        App-->>UI: Return failure state
        UI-->>V: Display safe error and next action
    end
```

The application must not show a success receipt on a timeout or
ambiguous response unless it can independently establish the transaction
outcome. Recovery behavior for ambiguous network failures is an
unresolved design item.

### 6.3 DPT import

The PRD specifies CSV/XLSX upload with required columns `nim`, `email`,
`name`, and `generation`, plus duplicate NIM/email validation before
database commit.

The logical flow is:

1.  Authorized administrator selects a file.
2.  Server validates file type, structure, required columns, and row
    values.
3.  Server detects duplicate NIM and email values.
4.  The application presents a validation result and preview.
5.  Authorized administrator confirms the import.
6.  Server commits eligible records and records the administrative
    action.

The exact partial-import policy, update/upsert behavior, rollback
behavior, maximum file size, and import audit detail are not defined by
the PRD and must be decided before implementation.

### 6.4 Administrative monitoring

The admin application reads:

-   Total DPT.
-   Number of recorded votes / participation.
-   Turnout percentage.
-   Participation aggregated by generation.
-   Candidate tally only for authorized roles and under the approved
    tally-release policy.

The PRD requires tally information to remain private during active
voting and denies regular student access to `/api/admin/tally`.

The distinction between live participation metrics and candidate-level
tally visibility must be explicit in the authorization and query design.

## 7. Trust boundaries and security controls

  -----------------------------------------------------------------------
  Boundary                Threat / failure        Required control
  ----------------------- ----------------------- -----------------------
  Browser → application   Forged or modified      Server-side Zod
  server                  input                   validation and session
                                                  checks

  Browser → privileged    Unauthorized action     Server-side RBAC and
  operation                                       authorization

  Application → Entra ID  Invalid identity        Validate the configured
                          response                OIDC authentication
                                                  flow

  Application → database  Excessive database      Server-only privileged
                          privileges              access; least privilege

  Vote request → RPC      Forged NIM or candidate Bind voter identity to
                          ID                      validated server
                                                  session; validate
                                                  candidate in database

  Concurrent vote         Double voting / race    Row lock and atomic
  requests                condition               transaction

  Voter data ↔ ballot     Identity-to-choice      Separate tables and
  data                    correlation             prohibit identity
                                                  references in ballots

  Admin UI/API → tally    Unauthorized result     Server-side role and
                          disclosure              election-state checks

  Administrative actions  Untraceable changes     Isolated administrative
                                                  audit trail
  -----------------------------------------------------------------------

### 7.1 Ballot secrecy requirements

The following controls are directly required by the PRD:

-   No voter identifier or network identifier in `ballots`.
-   No foreign key from `ballots` to `voters_whitelist`.
-   No precise ballot timestamp that enables time-correlation with voter
    activity.
-   Voter participation state and ballot insertion occur in the same
    atomic database operation.
-   Receipt content must not reveal the selected candidate.

Operational logging, database audit configuration, backups, analytics,
error reporting, and support tooling must also be reviewed for
accidental identity-to-ballot correlation. These details are not fully
specified in the PRD.

### 7.2 Important security review items

The current PRD SQL is a design baseline, not proof of a secure
production implementation. Before production, review at least:

1.  Whether `p_nim` can be spoofed by a caller and how it is bound to
    the authenticated principal.
2.  `SECURITY DEFINER` ownership, execution grants, and a fixed safe
    `search_path` for `cast_ballot_secure`.
3.  RLS policies and direct table privileges for browser-accessible
    roles.
4.  Whether administrative tally queries are blocked server-side during
    active voting.
5.  Whether application, database, and infrastructure logs can associate
    a voter with a ballot.
6.  Whether receipt generation and recovery can prove transaction
    success without revealing ballot selection.
7.  Whether the candidate number `0` has a single agreed meaning: Kotak
    Kosong, abstention, or another legally defined option.

These are review requirements, not claims that the current
implementation is vulnerable.

## 8. Availability, performance and compatibility targets

The PRD defines the following non-functional targets:

  -----------------------------------------------------------------------
  Concern                             PRD target
  ----------------------------------- -----------------------------------
  Vote processing                     Less than 400 ms under peak load of
                                      100 concurrent requests

  Concurrent users                    Up to 500 active users

  Voting session JWT                  Maximum 15 minutes in the ballot
                                      booth

  Cookie attributes                   HTTP-Only, Secure, SameSite=Strict

  Duplicate submission                UI debounce plus database row-level
                                      locking

  Browser compatibility               Brave, Chrome Mobile, Safari iOS

  Responsive behavior                 Mobile-optimized UI
  -----------------------------------------------------------------------

These are acceptance targets. They must be verified with automated tests
and load testing; they are not assumed to be achieved merely because the
architecture lists them.

## 9. Observability and audit boundaries

The PRD defines `audit_logs` for administrative actions, with fields
including actor email, action, details, IP address, and timestamp.

Audit events must be limited to administrative operations such as
election-setting changes, DPT imports, and report exports, as
appropriate to the approved policy.

Do not write selected candidate IDs, ballot row IDs, receipt-to-ballot
mappings, or voter identity into an administrative event if doing so
would create a correlation path.

The retention period, access policy, tamper resistance, and export
procedure for audit logs remain to be specified.

## 10. Deployment view

The PRD deployment checklist identifies these required setup activities:

-   Configure Microsoft Entra application credentials through
    environment variables.
-   Register local and production redirect URIs.
-   Apply database schema and `cast_ballot_secure` migration to
    Supabase.
-   Seed candidate data, including Kotak Kosong with candidate number
    `0`.
-   Clean and import the official DPT.
-   Perform load simulation against the application and Supabase.

The exact hosting platform, environments, CI/CD workflow, secret
manager, backup strategy, and rollback process are not specified in the
currently available project sources. These belong in `DEPLOYMENT.md` and
must be confirmed rather than guessed.

## 11. Architecture decisions pending validation

The following items must be resolved before the relevant implementation
is considered production-ready.

  -----------------------------------------------------------------------
  ID                      Open decision / gap     Owner document
  ----------------------- ----------------------- -----------------------
  ADR-001                 How authenticated Entra `AUTH.md`,
                          identity is securely    `DATABASE.md`
                          bound to the voter      
                          record passed to        
                          `cast_ballot_secure`    

  ADR-002                 Exact OIDC callback,    `AUTH.md`
                          session, cookie and     
                          token lifecycle         
                          implementation          

  ADR-003                 RLS, grants, function   `DATABASE.md`,
                          ownership and safe      `SECURITY.md`
                          `SECURITY DEFINER`      
                          configuration           

  ADR-004                 Whether live            `RBAC.md`, `API.md`
                          participation is        
                          visible while candidate 
                          tally remains locked    

  ADR-005                 Receipt token           `API.md`, `SECURITY.md`
                          semantics, generation,  
                          persistence (if any),   
                          and recovery after      
                          ambiguous network       
                          failure                 

  ADR-006                 Import conflict policy: `API.md`, `DATABASE.md`
                          reject entire file or   
                          allow valid-row partial 
                          import; update/upsert   
                          behavior                

  ADR-007                 Exact meaning and legal `PRD.md` / election
                          treatment of candidate  policy
                          number `0`              

  ADR-008                 Audit and               `SECURITY.md`,
                          infrastructure log      `OPERATIONS.md`
                          retention without       
                          ballot correlation      

  ADR-009                 Hosting, CI/CD,         `DEPLOYMENT.md`,
                          backups, restore and    `OPERATIONS.md`
                          rollback strategy       

  ADR-010                 Reconcile the formal UI `UI.md`,
                          blueprint with approved `DESIGN_SYSTEM.md`
                          Google Stitch           
                          iterations, especially  
                          the admin dark theme    
  -----------------------------------------------------------------------

No item above should be silently treated as decided.

## 12. Traceability to source documents

  -----------------------------------------------------------------------
  Architecture area                   Source
  ----------------------------------- -----------------------------------
  Product objectives and scope        `PRD.md`, sections 1--2

  User personas and voter journey     `PRD.md`, section 3

  Ballot secrecy                      `PRD.md`, section 4

  PostgreSQL entities and vote RPC    `PRD.md`, section 5

  Functional requirements             `PRD.md`, section 6

  Performance, session and            `PRD.md`, section 7
  compatibility                       

  HMIF design tokens                  `PRD.md`, section 8

  E2E scenarios and deployment        `PRD.md`, sections 9--10
  checklist                           

  Screen-level layout                 `UI.md`

  Stack, Zod validation, coding and   Project-provided `AGENTS.md`
  verification commands               summary; exact file verification
                                      pending
  -----------------------------------------------------------------------

## 13. Completion criteria for this document

This document can move from Draft to Reviewed when:

-   [ ] The exact E-Voting root `AGENTS.md` is inspected and its stack
    guidance is confirmed.
-   [ ] The current repository structure and package manifest are
    checked.
-   [ ] The Entra authentication and session architecture is agreed.
-   [ ] The trust boundary for `cast_ballot_secure` is agreed.
-   [ ] The tally visibility policy is agreed.
-   [ ] The receipt behavior is agreed.
-   [ ] The formal UI specification is reconciled with approved Stitch
    designs.
-   [ ] The architecture is reviewed by the project technical lead.

------------------------------------------------------------------------

**Next document in sequence:** `docs/DATABASE.md` --- detailed
PostgreSQL schema, constraints, indexes, RLS, grants, atomic RPC,
migration and data-integrity rules.
