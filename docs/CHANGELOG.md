# Changelog

All notable changes to the E-Voting Pemira HMIF project should be documented in this file.

The format is based on **Keep a Changelog**. This file tracks verified project changes; it is not a substitute for Git history, release tags, migration history, or security incident records.

## 1. Change Categories

Use the following categories where applicable:

- **Added** — new functionality, documentation, or capability.
- **Changed** — changes to existing functionality or behavior.
- **Deprecated** — functionality scheduled for removal.
- **Removed** — functionality or behavior removed.
- **Fixed** — bug fixes.
- **Security** — security and privacy improvements or security-relevant changes.

## 2. Versioning

**Proposed:** use Semantic Versioning (`MAJOR.MINOR.PATCH`) for application releases once the team establishes a release process.

- **MAJOR** — incompatible changes to public contracts, data model, or application behavior.
- **MINOR** — backward-compatible functionality additions.
- **PATCH** — backward-compatible bug fixes and maintenance changes.

Documentation versions may be tracked independently from application releases. Do not assume a document version is the application version.

Release tags, branch strategy, and version ownership: **TBD**.

## 3. Unreleased

### Added
- Initial documentation set is being prepared for the E-Voting Pemira HMIF project.

### Changed
- No verified application behavior changes recorded yet.

### Deprecated
- None recorded.

### Removed
- None recorded.

### Fixed
- None recorded.

### Security
- Security and privacy requirements are documented in the project documentation drafts; implementation and verification status must be tracked separately.

## 4. Released Versions

No application release has been verified from the available project sources.

Add a dated section here only after a release has been approved and its contents verified.

Example format:

```markdown
## [1.0.0] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...
```

Do not copy this example as a claim that version `1.0.0` has shipped.

## 5. Database and Migration Changes

Database changes should be mentioned in the relevant release section and linked to the corresponding migration identifier or pull request where possible.

For each database-affecting release, record:

- migration identifier;
- tables, columns, constraints, indexes, functions, or policies changed;
- whether the change is backward-compatible;
- deployment order and prerequisites;
- rollback or forward-fix strategy;
- data migration impact;
- verification evidence.

Do not place credentials, real DPT data, ballot contents, or other sensitive records in this changelog.

## 6. Security-Relevant Changes

Security entries should describe the affected area and the outcome without exposing exploit details or sensitive operational information.

Examples of areas to track:

- authentication and session handling;
- DPT eligibility checks;
- server-side authorization and RBAC;
- ballot secrecy and data separation;
- voting RPC atomicity and concurrency controls;
- tally access restrictions;
- audit logging and data retention;
- dependency vulnerabilities and remediation.

For an active or sensitive incident, use the approved incident-response process and restricted records. Do not publish exploitable details in a public changelog.

## 7. Documentation Changes

Documentation-only changes may be tracked here when they materially affect how the project is built, deployed, operated, or used.

Current documentation drafts include:

- `ARCHITECTURE.md`
- `DATABASE.md`
- `API.md`
- `AUTHENTICATION.md`
- `SECURITY.md`
- `TESTING.md`
- `DEPLOYMENT.md`
- `OPERATIONS.md`
- `USER_GUIDE.md`
- `ADMIN_GUIDE.md`
- `CONTRIBUTING.md`
- `ENVIRONMENT.md`
- `DATA_DICTIONARY.md`

The existence of a document does not imply that its content has been approved or implemented. Track document status and review approvals in the relevant document or project governance record.

## 8. Changelog Entry Guidelines

When adding an entry:

1. Record only changes that have been merged or formally approved for the relevant release.
2. Use concise, user- or operator-understandable language.
3. Identify affected areas where useful.
4. Mention breaking changes explicitly.
5. Link to a pull request, issue, migration, or decision record when available.
6. Separate shipped behavior from planned work.
7. Do not include secrets, personal data, private tally values, or exploitable vulnerability details.
8. Keep entries in reverse chronological order within each release section.

## 9. Release Record Checklist

Before publishing a release entry:

- [ ] Release version and date are approved.
- [ ] Included commits/PRs are verified.
- [ ] Database migrations are identified.
- [ ] Breaking changes and configuration changes are documented.
- [ ] Relevant tests have passed.
- [ ] Security-sensitive changes have been reviewed.
- [ ] Deployment and rollback notes are available.
- [ ] No secrets or sensitive election data are included.
- [ ] Release notes are approved for their intended audience.

## 10. Open Decisions

| ID | Decision | Why it matters |
|---|---|---|
| CHG-01 | Application versioning policy | Establishes how releases are named. |
| CHG-02 | Release tag and branch policy | Makes releases reproducible. |
| CHG-03 | Release approval owner | Establishes accountability. |
| CHG-04 | Public vs internal changelog policy | Prevents disclosure of sensitive operational details. |
| CHG-05 | Migration reference convention | Connects releases to database changes. |
| CHG-06 | Security advisory process | Separates public notes from restricted incident details. |
| CHG-07 | Document versioning policy | Distinguishes document revisions from application releases. |

## 11. References

- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `ENVIRONMENT.md`
- `DATABASE.md`
- `SECURITY.md`
- `TESTING.md`
- `OPERATIONS.md`

---

*This changelog is a draft until the project team approves the release and versioning policy.*


## [0.2.0] - 2026-10-31 — Decision update

### Changed
- Confirmed personally managed project Entra tenant and multitenant app registration, restricted to Telkom University tenant ID.
- Confirmed KEMA as DPT source for cohorts 2023–2026 with `nim`, `email`, `name`, and `generation`.
- Replaced client-generated voting receipt requirement with server-generated receipt direction.
- Confirmed admin dashboard route `/admin/dashboard`.
- Recorded Cloud Run + Supabase hosting direction.

### Pending verification
- Telkom tenant ID and admin-consent policy; actual student sign-in test; first-login `tid`/`oid` binding procedure; final KPR rules for Kotak Kosong.


## [0.3.0] - 2026-10-31 — RBAC and staged test decisions

### Added
- Approved database-backed administrator whitelist and role-permission matrix: `kpr_admin`, `auditor`, and `super_admin`; voter eligibility remains DPT-based and separate.
- Defined server-side role lookup using validated Entra `tid` + `oid`, role lifecycle auditing, and deny-by-default authorization.
- Confirmed initial development/testing with synthetic dummy accounts and an isolated mock auth provider.
- Added production prohibition for dummy authentication and a later real Telkom tenant integration test gate.
- Recorded the DPT input fields supplied by KEMA: NIM, institutional email, name, and generation.

### Pending
- Obtain and verify Telkom University Tenant ID and test tenant consent policy.
- Confirm exact Entra claims and DPT account-linking procedure.
- Complete SQL migration and review for `admin_users` and voter `tid`/`oid` binding.
- Confirm KPR rules for Kotak Kosong and final operational approval workflow.

### Updated — 2026-10-31 (Operational policy finalization)
- Finalized KPR Admin authority to open and close voting, with mandatory reason and audit logging.
- Finalized Superadmin authority for emergency maintenance and technical recovery.
- Finalized resume rule: Superadmin confirms technical readiness; KPR Admin decides whether voting resumes.
- Finalized schedule extension rule: requires KPR and the authorized Pemira authority; exact office/title remains TBD pending official KPR rules.
- Finalized database-authoritative handling for uncertain/timeout vote transactions.
- Required audit logging for all incidents, including minor incidents.

### Updated — 2026-10-31 (Publication policy finalization)
- KPR Admin is responsible for official result announcement.
- Publication follows a KPR-scheduled date/time after Auditor review and KPR approval.
- Public channels: results dashboard and official PDF.
- Public data: candidate/Kotak Kosong vote totals, turnout, and generation-level participation.
- Individual voter identity, individual voting status, receipt tokens, and identity-to-choice linkage are prohibited from publication.
- Post-publication corrections require KPR approval, Auditor review, and retained version history.
- Minimum aggregation threshold for generation-level statistics remains TBD.

### Updated — 2026-10-31 (Data retention policy finalization)
- DPT and Entra identity mapping: 1 year after result approval.
- Anonymous ballots: permanent archive.
- Receipt verification hash: 1 year after result approval.
- Audit logs: permanent archive with data minimization and restricted access.
- Relevant data deletion is suspended during an active dispute or official examination (legal hold).
- Backup lifecycle, verified deletion of exports/temp files, and legal-hold authority remain to be specified before production.

### Updated — 2026-10-31 (Ownership and handover policy)
- HMIF designated as organizational owner and long-term operator of the E-Voting system.
- Handover requires at least two technical administrators, organization-controlled access to code and infrastructure, MFA, secure secret management, recovery documentation, and backup restore testing.
- Personal Entra tenant ownership is recorded as a continuity risk; migration or formal organizational control remains TBD before production.
