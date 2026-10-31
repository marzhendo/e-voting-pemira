# Database Design --- E-Voting Pemira HMIF

  -----------------------------------------------------------------------
  Metadata                            Value
  ----------------------------------- -----------------------------------
  Project                             E-Voting Pemira HMIF

  Document                            `docs/DATABASE.md`

  Version                             0.1.0 --- Initial Draft

  Status                              Draft --- Requires Technical and
                                      Security Review

  Primary source                      `PRD.md` v1.0.0, Section 5

  Related documents                   `ARCHITECTURE.md`, `AUTH.md`,
                                      `RBAC.md`, `SECURITY.md`
  -----------------------------------------------------------------------

> **Authority and scope:** This document records the database design
> currently specified by the E-Voting Pemira HMIF PRD and identifies
> database-level decisions that remain unresolved. SQL definitions below
> are a transcription/organization of the PRD baseline, not a claim that
> they have been migrated, tested, or approved for production.

## 1. Purpose

This document defines the logical PostgreSQL data model for E-Voting
Pemira HMIF, including:

-   Core tables and their responsibilities.
-   Primary keys, unique constraints, and foreign keys specified by the
    PRD.
-   The anonymous ballot data boundary.
-   The `cast_ballot_secure` vote-casting function.
-   Indexes specified by the PRD.
-   Database-level integrity and security review requirements.
-   Outstanding decisions required before production deployment.

## 2. Database platform

The PRD specifies:

  -----------------------------------------------------------------------
  Item                                Specification
  ----------------------------------- -----------------------------------
  Platform                            Supabase

  Database engine                     PostgreSQL

  UUID extension                      `uuid-ossp`

  Vote transaction                    PostgreSQL function
                                      `public.cast_ballot_secure`

  Vote isolation                      Voter and ballot data stored in
                                      separate tables

  Atomicity                           Voter participation update and
                                      ballot insertion in one database
                                      function / transaction
  -----------------------------------------------------------------------

The PRD does not specify PostgreSQL version, migration tooling,
environment topology, backup policy, or database connection-pooling
configuration.

## 3. Data model overview

The PRD defines five principal tables:

  ----------------------------------------------------------------------------------
  Table                 Purpose                  Contains voter   Contains candidate
                                                      identity?              choice?
  --------------------- ------------------ -------------------- --------------------
  `voters_whitelist`    Official DPT and                    Yes                   No
                        participation                           
                        status                                  

  `candidates`          Candidate-pair and                   No   Candidate metadata
                        candidate-option                        
                        master data                             

  `ballots`             Recorded anonymous                   No                  Yes
                        selections                              

  `election_settings`   Election window                      No                   No
                        and maintenance                         
                        configuration                           

  `audit_logs`          Administrative           Actor identity    Must not create a
                        activity records                          ballot correlation
                                                                                path
  ----------------------------------------------------------------------------------

### 3.1 Logical relationships

``` mermaid
erDiagram
    CANDIDATES ||--o{ BALLOTS : "selected by"
    VOTERS_WHITELIST {
        uuid id PK
        varchar nim UK
        varchar email UK
        varchar name
        int generation
        boolean has_voted
        timestamptz voted_at
        timestamptz created_at
    }
    CANDIDATES {
        uuid id PK
        int candidate_number UK
        varchar leader_name
        varchar vice_leader_name
        text vision
        text_array mission
        text photo_url
        boolean is_active
    }
    BALLOTS {
        uuid id PK
        uuid candidate_id FK
        date voting_session_date
    }
    ELECTION_SETTINGS {
        int id PK
        boolean is_voting_open
        timestamptz start_time
        timestamptz end_time
        boolean maintenance_mode
    }
    AUDIT_LOGS {
        uuid id PK
        varchar actor_email
        varchar action
        jsonb details
        varchar ip_address
        timestamptz created_at
    }
```

**Important:** the relationship from `voters_whitelist` to `ballots` is
intentionally absent. The `ballots` table must not have a voter foreign
key or another direct voter identifier.

The only explicit foreign key in the PRD schema is
`ballots.candidate_id` referencing `candidates.id`.

## 4. Schema baseline from PRD

### 4.1 UUID extension

``` sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

The PRD uses `uuid_generate_v4()` as the default UUID generator.

### 4.2 `voters_whitelist`

Purpose: stores the official Daftar Pemilih Tetap (DPT), voter identity,
generation, and whether the right to vote has been used.

``` sql
CREATE TABLE public.voters_whitelist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    generation INT NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_voters_nim
    ON public.voters_whitelist(nim);

CREATE INDEX idx_voters_email
    ON public.voters_whitelist(email);
```

  -----------------------------------------------------------------------
  Column            Type              Constraint /      Meaning
                                      default           
  ----------------- ----------------- ----------------- -----------------
  `id`              UUID              Primary key;      Internal voter
                                      generated UUID v4 row identifier

  `nim`             VARCHAR(15)       Unique, not null  Student
                                                        identification
                                                        number

  `email`           VARCHAR(120)      Unique, not null  Institutional
                                                        email

  `name`            VARCHAR(150)      Not null          Voter name

  `generation`      INT               Not null          Student cohort /
                                                        entry year

  `has_voted`       BOOLEAN           Not null, default Whether voting
                                      `FALSE`           right has been
                                                        used

  `voted_at`        TIMESTAMPTZ       Nullable          Time the voter
                                                        was marked as
                                                        having voted

  `created_at`      TIMESTAMPTZ       Default `NOW()`   DPT record
                                                        creation time
  -----------------------------------------------------------------------

The PRD specifies indexes on `nim` and `email` in addition to their
unique constraints. Whether both explicit indexes are needed in the
final migration should be checked because PostgreSQL unique constraints
create supporting unique indexes.

### 4.3 `candidates`

Purpose: stores candidate pairs and the explicit Kotak Kosong option.

``` sql
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_number INT UNIQUE NOT NULL,
    leader_name VARCHAR(150) NOT NULL,
    vice_leader_name VARCHAR(150) NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT[] NOT NULL,
    photo_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
```

  --------------------------------------------------------------------------
  Column               Type              Constraint /      Meaning
                                         default           
  -------------------- ----------------- ----------------- -----------------
  `id`                 UUID              Primary key;      Candidate record
                                         generated UUID v4 identifier

  `candidate_number`   INT               Unique, not null  Candidate number;
                                                           PRD reserves `0`
                                                           for Kotak Kosong

  `leader_name`        VARCHAR(150)      Not null          Candidate for
                                                           chairperson

  `vice_leader_name`   VARCHAR(150)      Not null          Candidate for
                                                           vice chairperson

  `vision`             TEXT              Not null          Vision statement

  `mission`            TEXT\[\]          Not null          Mission
                                                           statements

  `photo_url`          TEXT              Not null          Candidate photo
                                                           asset URL

  `is_active`          BOOLEAN           Not null, default Whether candidate
                                         `TRUE`            is available for
                                                           selection
  --------------------------------------------------------------------------

The PRD does not define a dedicated candidate type or a separate schema
for Kotak Kosong. It specifies candidate number `0` and describes the
option as Kotak Kosong / abstain in different sections. This semantic
ambiguity is an open decision; do not infer a final election rule from
the database number alone.

### 4.4 `ballots`

Purpose: stores anonymous ballot selections, deliberately isolated from
voter identity.

``` sql
CREATE TABLE public.ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL
        REFERENCES public.candidates(id) ON DELETE RESTRICT,
    voting_session_date DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE INDEX idx_ballots_candidate
    ON public.ballots(candidate_id);
```

  ------------------------------------------------------------------------------
  Column                  Type              Constraint /       Meaning
                                            default            
  ----------------------- ----------------- ------------------ -----------------
  `id`                    UUID              Primary key;       Random ballot
                                            generated UUID v4  record identifier

  `candidate_id`          UUID              Foreign key to     Selected
                                            `candidates.id`;   candidate
                                            not null           

  `voting_session_date`   DATE              Not null, default  Voting session
                                            `CURRENT_DATE`     date
  ------------------------------------------------------------------------------

#### 4.4.1 Mandatory ballot secrecy constraints

The PRD explicitly requires that `ballots` must not contain:

-   `voter_id`.
-   `nim`.
-   `ip_address`.
-   Session ID.
-   A direct relationship to a voter record.

The PRD also specifies that the ballot table must not store a precise
timestamp that can be correlated with `voters_whitelist.voted_at`. It
permits a date-only field.

These restrictions must be preserved in schema changes, views, exports,
database logs, application telemetry, and support tooling.

### 4.5 `election_settings`

Purpose: stores the election window and maintenance state.

``` sql
CREATE TABLE public.election_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_voting_open BOOLEAN DEFAULT FALSE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);
```

  --------------------------------------------------------------------------
  Column               Type              Constraint /      Meaning
                                         default           
  -------------------- ----------------- ----------------- -----------------
  `id`                 INT               Primary key;      Enforces one
                                         default `1`;      settings row
                                         check `id = 1`    

  `is_voting_open`     BOOLEAN           Not null, default Manual
                                         `FALSE`           voting-window
                                                           switch

  `start_time`         TIMESTAMPTZ       Not null          Scheduled opening
                                                           time

  `end_time`           TIMESTAMPTZ       Not null          Scheduled closing
                                                           time

  `maintenance_mode`   BOOLEAN           Not null, default Maintenance state
                                         `FALSE`           
  --------------------------------------------------------------------------

The PRD does not specify how the application behaves when no settings
row exists, how the initial row is seeded, or whether `maintenance_mode`
blocks all users or only voting operations.

### 4.6 `audit_logs`

Purpose: records administrative activity separately from ballot records.

``` sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(120) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

  -----------------------------------------------------------------------
  Column            Type              Constraint /      Meaning
                                      default           
  ----------------- ----------------- ----------------- -----------------
  `id`              UUID              Primary key;      Audit record
                                      generated UUID v4 identifier

  `actor_email`     VARCHAR(120)      Not null          Administrative
                                                        actor

  `action`          VARCHAR(50)       Not null          Administrative
                                                        action name

  `details`         JSONB             Nullable          Additional action
                                                        details

  `ip_address`      VARCHAR(45)       Nullable          Actor IP address

  `created_at`      TIMESTAMPTZ       Default `NOW()`   Audit event time
  -----------------------------------------------------------------------

The PRD gives examples such as `TOGGLE_VOTING`, `IMPORT_DPT`, and
`EXPORT_REPORT`.

Audit records must not contain a selected candidate, ballot ID, or a
receipt-to-ballot mapping that would undermine ballot secrecy.

## 5. Atomic vote-casting function

The PRD defines `public.cast_ballot_secure(p_nim, p_candidate_id)` as
the database function for recording a vote.

### 5.1 PRD function baseline

``` sql
CREATE OR REPLACE FUNCTION public.cast_ballot_secure(
    p_nim VARCHAR(15),
    p_candidate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_open BOOLEAN;
    v_has_voted BOOLEAN;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Validate election window
    SELECT is_voting_open AND (v_now BETWEEN start_time AND end_time)
    INTO v_voting_open
    FROM public.election_settings
    WHERE id = 1;

    IF v_voting_open IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'VOTING_CLOSED',
            'message', 'Bilik suara belum dibuka atau sudah ditutup.'
        );
    END IF;

    -- 2. Lock voter row
    SELECT has_voted
    INTO v_has_voted
    FROM public.voters_whitelist
    WHERE nim = p_nim
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_REGISTERED',
            'message', 'NIM tidak terdaftar dalam DPT.'
        );
    END IF;

    IF v_has_voted THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Hak suara Anda telah digunakan sebelumnya.'
        );
    END IF;

    -- 3. Validate candidate
    IF NOT EXISTS (
        SELECT 1
        FROM public.candidates
        WHERE id = p_candidate_id
          AND is_active = TRUE
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_CANDIDATE',
            'message', 'Pilihan kandidat tidak sah.'
        );
    END IF;

    -- 4. Mark voter as having voted
    UPDATE public.voters_whitelist
    SET has_voted = TRUE,
        voted_at = v_now
    WHERE nim = p_nim;

    -- 5. Insert anonymous ballot
    INSERT INTO public.ballots (candidate_id)
    VALUES (p_candidate_id);

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'message', 'Suara Anda berhasil dicatat.'
    );
END;
$$;
```

### 5.2 Expected business outcomes

  -----------------------------------------------------------------------
  Code                    Condition               Expected behavior
  ----------------------- ----------------------- -----------------------
  `SUCCESS`               Election open, voter    Update voter
                          registered, voter not   participation and
                          yet voted, candidate    insert anonymous ballot
                          active                  

  `VOTING_CLOSED`         Voting switch disabled, Reject vote
                          outside configured time 
                          window, or no valid     
                          open state              

  `NOT_REGISTERED`        NIM not found in DPT    Reject vote

  `ALREADY_VOTED`         Voter participation     Reject vote
                          state is already true   

  `INVALID_CANDIDATE`     Candidate does not      Reject vote
                          exist or is inactive    
  -----------------------------------------------------------------------

The PRD defines these business response codes. Database exceptions and
infrastructure failures are not assigned a response contract in the PRD.

### 5.3 Transactional invariant

The intended invariant is:

> A successful vote operation changes the voter participation state and
> inserts exactly one anonymous ballot in the same database transaction.

If ballot insertion fails, the voter participation update must not
remain committed. If the transaction fails, neither mutation may be
committed.

PostgreSQL functions execute within the transaction of the calling
statement; the application and database design must preserve this atomic
behavior.

### 5.4 Concurrency behavior

The PRD specifies `SELECT ... FOR UPDATE` on the voter row to serialize
competing requests for the same NIM.

The required test scenario is five concurrent requests for one NIM:

-   Exactly one request returns `SUCCESS`.
-   The other four requests return `ALREADY_VOTED`.
-   Exactly one ballot is inserted.
-   The voter is marked as having voted.

The test must be executed against a real PostgreSQL/Supabase test
environment or an equivalent transactional test environment. A UI-only
test is insufficient to establish database concurrency correctness.

## 6. Database security requirements and review

The function in the PRD uses `SECURITY DEFINER`. This is a privileged
execution mode and must not be deployed without reviewing ownership and
execution privileges.

The following are required review items; the PRD does not yet provide
their final SQL configuration.

### 6.1 Function execution identity

-   Confirm the function owner.
-   Restrict `EXECUTE` privileges to the intended server-side role.
-   Revoke execution from roles that must not call the function
    directly.
-   Define a safe fixed `search_path` for the function.
-   Review all referenced objects and privileges under the function
    owner.

### 6.2 NIM trust boundary

The PRD function accepts `p_nim` as an argument. The database function
shown does not itself prove that the caller is the owner of that NIM.

The application must not trust a NIM supplied only by the browser. The
final design must bind the authenticated Microsoft Entra identity to the
DPT record through a server-validated mechanism before allowing a vote
operation.

The exact mechanism is an unresolved architecture decision and must be
specified in `AUTH.md` and `SECURITY.md`.

### 6.3 Row-level security and table grants

The PRD does not include RLS policies or table grants.

Before production, explicitly document:

-   Which roles can read `voters_whitelist`.
-   Which roles can modify DPT data.
-   Which roles can read candidate data.
-   Which roles can insert or read `ballots`.
-   Which roles can read `audit_logs`.
-   Which role can update `election_settings`.
-   Whether browser clients have any direct access to these tables.
-   How privileged server-side database access is isolated from browser
    code.

Do not infer that enabling RLS alone is sufficient; policies and grants
must be reviewed together.

## 7. Data integrity rules

The following rules are directly supported by the PRD schema and
requirements:

1.  Each voter NIM is unique.
2.  Each voter email is unique.
3.  Each candidate number is unique.
4.  Every ballot references an existing candidate.
5.  A ballot cannot reference a candidate that is deleted while
    referenced, due to `ON DELETE RESTRICT`.
6.  Each election settings record must use `id = 1`.
7.  A voter can successfully cast a vote only once.
8.  A successful vote updates participation state and inserts a ballot
    atomically.
9.  Ballot rows contain no voter identity.
10. Only active candidates are accepted by the specified vote-casting
    function.

The following integrity rules are not explicitly encoded in the PRD DDL
and remain to be decided:

-   `start_time < end_time`.
-   Allowed generation-year range.
-   Email normalization and case-insensitive uniqueness.
-   NIM normalization and whitespace handling.
-   Candidate number range and whether `0` is reserved exclusively for
    Kotak Kosong.
-   Whether candidate names and candidate content can be changed after
    voting opens.
-   Whether DPT records can be deleted after voting starts.
-   Whether a voter can be reset to `has_voted = false`, and under what
    emergency procedure.
-   Whether `voted_at` may be cleared or modified by administrators.

Do not add constraints or mutation policies without agreement from the
election and technical owners.

## 8. DPT import data contract

The PRD specifies the import columns:

  Column           Required by PRD Target column
  -------------- ----------------- -------------------------------
  `nim`                        Yes `voters_whitelist.nim`
  `email`                      Yes `voters_whitelist.email`
  `name`                       Yes `voters_whitelist.name`
  `generation`                 Yes `voters_whitelist.generation`

The PRD requires validation for duplicate NIM and email before database
commit.

The PRD does not specify a staging table, import batch table, or import
history schema. Those must not be treated as existing database entities
until approved.

## 9. Index inventory

The PRD explicitly defines:

  Index                     Table                Column
  ------------------------- -------------------- ----------------
  `idx_voters_nim`          `voters_whitelist`   `nim`
  `idx_voters_email`        `voters_whitelist`   `email`
  `idx_ballots_candidate`   `ballots`            `candidate_id`

Unique constraints on `voters_whitelist.nim`, `voters_whitelist.email`,
and `candidates.candidate_number` also require unique indexes in
PostgreSQL.

Do not add speculative indexes without query plans or an identified
access pattern. Validate indexes under representative DPT size and
election traffic.

## 10. Migration and seed requirements

The PRD deployment checklist requires:

-   Install/enable `uuid-ossp`.
-   Create the specified tables and indexes.
-   Deploy `cast_ballot_secure`.
-   Seed candidate data.
-   Include Kotak Kosong with candidate number `0`.
-   Create or initialize the single election settings row.
-   Import the cleaned official DPT.

The PRD does not identify a migration framework, migration file naming
convention, rollback strategy, or seed-data ownership. These are
implementation decisions to record after repository inspection.

Production DPT data and real voter information must not be embedded in
source control or committed as test fixtures.

## 11. Database test requirements

The PRD requires these relevant end-to-end cases:

  -----------------------------------------------------------------------
  Test                    Setup                   Expected result
  ----------------------- ----------------------- -----------------------
  Valid voter             Registered voter, open  Vote succeeds; voter
                          election, active        marked voted; one
                          candidate               anonymous ballot exists

  Duplicate vote          Voter already marked as `ALREADY_VOTED`; no
                          voted                   additional ballot

  Concurrent vote         Five simultaneous       One success; four
                          requests for same NIM   `ALREADY_VOTED`; one
                                                  ballot

  Unregistered voter      NIM absent from DPT     `NOT_REGISTERED`; no
                                                  ballot

  Invalid candidate       Candidate missing or    `INVALID_CANDIDATE`; no
                          inactive                ballot

  Closed election         Voting disabled or      `VOTING_CLOSED`; no
                          outside time window     ballot

  Ballot isolation        Inspect ballot schema   No voter identity or
                          and records             direct voter
                                                  relationship

  Admin tally protection  Regular student         HTTP 403 at application
                          requests protected      boundary, as specified
                          tally                   by PRD
  -----------------------------------------------------------------------

Additional database tests should be defined after RLS, grants, and
function execution privileges are finalized.

## 12. Open database decisions

  -----------------------------------------------------------------------
  ID                      Decision / missing      Required resolution
                          specification           
  ----------------------- ----------------------- -----------------------
  DB-001                  How `p_nim` is bound to Define secure
                          the authenticated       server-to-database
                          identity                identity handoff

  DB-002                  `SECURITY DEFINER`      Produce reviewed
                          owner, safe             function privilege SQL
                          `search_path`, and      
                          `EXECUTE` grants        

  DB-003                  RLS policies and        Define a role-by-role
                          table-level grants      access matrix

  DB-004                  Whether explicit        Review migration/index
                          NIM/email indexes are   plan
                          retained alongside      
                          unique indexes          

  DB-005                  Exact semantics of      Confirm Kotak Kosong
                          candidate number `0`    versus abstention
                                                  policy

  DB-006                  Election settings       Define seed and
                          bootstrap and           fail-closed behavior
                          missing-row behavior    

  DB-007                  DPT import atomicity,   Define import contract
                          duplicate policy,       
                          update/upsert and       
                          rollback behavior       

  DB-008                  Allowed administrative  Define emergency
                          changes to voter        correction policy
                          participation state     

  DB-009                  Audit log retention and Define retention and
                          ballot-correlation      access policy
                          safeguards              

  DB-010                  Receipt token           Define whether receipt
                          relationship to         is client-generated,
                          database state          server-issued, or
                                                  persisted without
                                                  ballot linkage

  DB-011                  Data retention and      Define election data
                          post-election           lifecycle
                          archival/deletion       

  DB-012                  Migration tool and      Confirm against
                          rollback process        repository and
                                                  deployment setup
  -----------------------------------------------------------------------

## 13. Source traceability

  Database specification                 Source
  -------------------------------------- ----------------------------
  PostgreSQL platform and five tables    `PRD.md`, Section 5
  UUID extension and DDL                 `PRD.md`, Section 5
  Atomic vote-casting function           `PRD.md`, Section 5.1
  Functional behavior for vote casting   `PRD.md`, Sections 3 and 6
  DPT import columns and validation      `PRD.md`, Section 6, FR-04
  Concurrency and integrity target       `PRD.md`, Sections 1 and 7
  Ballot secrecy requirements            `PRD.md`, Section 4
  E2E test cases                         `PRD.md`, Section 9

## 14. Review checklist

This document can move from Draft to Reviewed when:

-   [ ] The exact E-Voting repository and database migration setup are
    inspected.
-   [ ] The DDL is compared against the actual project migrations.
-   [ ] The authenticated identity-to-NIM trust boundary is approved.
-   [ ] `SECURITY DEFINER`, function owner, `search_path`, and grants
    are reviewed.
-   [ ] RLS policies and table grants are documented and tested.
-   [ ] Candidate number `0` semantics are confirmed.
-   [ ] DPT import conflict and rollback behavior are agreed.
-   [ ] Concurrency tests pass against PostgreSQL.
-   [ ] Ballot isolation is verified at schema, query, log, and export
    levels.

------------------------------------------------------------------------

**Next document in sequence:** `docs/API.md` --- application endpoints
and Server Actions, request/response contracts, authorization
requirements, validation rules, and error codes.


## Addendum — Entra identity binding (2026-10-31)

The approved DPT import columns remain `nim`, `email`, `name`, and `generation`. KEMA is the source for cohorts 2023–2026. Entra identifiers are **not** supplied by KEMA; they are populated only after the application validates a real Entra token and matches the account to exactly one DPT row.

**Proposed migration** (requires implementation review): add nullable `entra_tenant_id UUID` and `entra_object_id UUID` to `voters_whitelist`, with a unique constraint on the pair and a check that both are null or both are non-null. The allowed tenant ID is the verified Telkom University tenant. Do not populate these fields from browser input or from the CSV import.

A controlled first-login linking procedure is required. If an email matches an existing DPT row but the stored Entra binding belongs to a different `oid`, deny automatic relinking and require an audited administrator process.


## Addendum — Administrator whitelist and identity binding (2026-10-31)

### Administrator whitelist

The approved source of truth for administrator authorization is a database-backed `admin_users` table. Proposed logical columns (exact SQL migration and constraints remain to be reviewed):

| Column | Purpose |
|---|---|
| `id` | Internal UUID primary key |
| `entra_tenant_id` | Entra tenant identifier (`tid`) |
| `entra_object_id` | Entra user identifier (`oid`) |
| `email` | Normalized institutional contact/display email |
| `role` | Explicit enum/check-constrained role: `kpr_admin`, `auditor`, `super_admin` |
| `is_active` | Immediate enable/disable control |
| `created_by` | Administrator identity that provisioned the record |
| `created_at`, `updated_at` | Lifecycle timestamps |

Enforce uniqueness for the identity pair (`entra_tenant_id`, `entra_object_id`). Role lookup must happen server-side after token validation. Do not grant privileges from email domain, browser data, or Entra login alone. Role changes and revocations must create audit events.

### Voter identity binding

The KEMA DPT import contains `nim`, `email`, `name`, and `generation`. After validated Entra sign-in and an unambiguous DPT email match, the application may bind `tid` + `oid` to the voter record for subsequent sign-ins. The binding must not be copied into `ballots` or create a voter-to-ballot correlation. The migration, uniqueness constraints, and account-relinking process require technical review before production.

### Development fixtures

Use synthetic DPT and admin records for development. Dummy authentication must be isolated to development/test, explicitly enabled, and impossible to enable in production configuration. Never mix test fixtures with production DPT or ballot tables.
