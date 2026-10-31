# Election Operations Runbook — E-Voting Pemira HMIF

| Metadata | Value |
|---|---|
| Document | Election Operations Runbook |
| Project | E-Voting Pemira HMIF |
| Version | 0.1.0 |
| Status | Draft — Requires Election Stakeholder Approval |
| Basis | PRD v1.0.0, UI.md, ARCHITECTURE.md, DATABASE.md, API.md, AUTHENTICATION.md, SECURITY.md, TESTING.md, DEPLOYMENT.md, and project context supplied in the conversation |
| Last updated | 2026-10-31 |

> **Status convention**
>
> - **Specified**: explicitly supported by current project documentation.
> - **Proposed**: recommended operational procedure, not yet approved.
> - **TBD**: authority, timing, or procedure has not been defined.
>
> This runbook describes intended procedures. It does not mean the procedures have already been rehearsed or approved by the election authority.

---

## 1. Purpose

This document defines the operational procedures for conducting Pemira HMIF using the E-Voting application.

It is intended for the authorized election committee, KPR/operator, administrators, technical operators, and incident responders.

The operational goals are to:

1. Prepare the system and election data before voting begins.
2. Open and close voting only with proper authorization.
3. Support voters without compromising ballot secrecy.
4. Manage DPT and candidate data through controlled procedures.
5. Respond consistently to authentication, availability, integrity, and privacy incidents.
6. Preserve evidence and produce official reports after voting closes.

## 2. Scope

### 2.1 Included procedures

- Pre-election readiness.
- Candidate and DPT data verification.
- Admin access and operator readiness.
- Voting opening procedure.
- Voter support and issue triage.
- Election settings and maintenance mode.
- DPT correction and administrative override.
- Voting closure and tally release.
- Report generation and evidence preservation.
- Incident response and post-election closeout.

### 2.2 Not established by current source documents

The current PRD and supporting specifications do not define:

- The official election date and exact operational schedule.
- The complete organization chart and named decision-makers.
- The final authority matrix for KPR, Admin, and Superadmin.
- The escalation contact list.
- A formal voter-support SLA.
- Whether provisional/manual voting is ever permitted during an outage.
- The official dispute and recount procedure.
- The retention period for DPT files, logs, and reports.

These must be approved by the election authority. This runbook does not invent them.

## 3. Roles and responsibilities

| Role | Operational responsibility | Status |
|---|---|---|
| Election authority / committee chair | Approves official election decisions, including go-live and result release | Required concept; exact role/name TBD |
| KPR / election operator | Operates election workflow and coordinates election administration | Mentioned by PRD; exact permissions TBD |
| Admin | Performs approved DPT/election/report tasks | Mentioned by PRD; exact permissions TBD |
| Superadmin | Handles explicitly privileged overrides and administration | Manual override mentioned by PRD; exact scope TBD |
| Technical operator | Monitors application, database, deployment, and incidents | Proposed role; owner TBD |
| Voter support contact | Receives and triages voter issues | Proposed role; owner TBD |
| Auditor / observer | Reviews approved evidence and operational records | TBD |

### 3.1 Separation of duties

**Proposed minimum controls:**

- The person who prepares candidate/DPT data should not be the only person approving it.
- Opening and closing voting should require an explicitly authorized operator.
- High-impact overrides should require a reason and audit record.
- Production credentials should not be shared among committee members.
- Result publication should follow a documented approval step.
- Technical operators should not independently decide election outcomes.

## 4. Operational states

The system's operational state is determined by election settings and service health.

| State | Meaning | Expected voter behavior |
|---|---|---|
| Pre-election | Voting has not officially opened | No ballot casting |
| Open | Voting is enabled and current time is within the configured window | Eligible voters may vote |
| Closed | Voting has ended or is disabled | New ballot casting rejected |
| Maintenance | Maintenance mode blocks or restricts voter operations | Voter sees approved maintenance message |
| Incident hold | Proposed operational state used when integrity cannot be guaranteed | Voting paused pending authorized decision |

The database schema includes `is_voting_open`, `start_time`, `end_time`, and `maintenance_mode`. The separate `incident hold` label is an operational proposal, not an existing database field.

## 5. Pre-election readiness procedure

### 5.1 Governance readiness

- [ ] Confirm the official election authority and decision-makers.
- [ ] Confirm who may open and close voting.
- [ ] Confirm who may import or correct DPT.
- [ ] Confirm who may access private tally and under what conditions.
- [ ] Confirm the incident escalation chain.
- [ ] Confirm the official election schedule and timezone.
- [ ] Confirm the voter-support channel and support hours.
- [ ] Confirm result approval and publication process.

Do not open voting while these responsibilities remain ambiguous.

### 5.2 Application readiness

- [ ] Confirm the approved production build and release identifier.
- [ ] Confirm HTTPS and application domain.
- [ ] Verify Entra sign-in and callback.
- [ ] Verify identity-to-DPT mapping.
- [ ] Verify voter eligibility and already-voted behavior.
- [ ] Verify candidate list and candidate images.
- [ ] Verify Kotak Kosong configuration.
- [ ] Verify confirmation and receipt screens.
- [ ] Verify the official voting start/end time and timezone.
- [ ] Verify maintenance mode is not unintentionally enabled.
- [ ] Verify unauthorized users cannot access admin operations.
- [ ] Verify regular student receives HTTP 403 from `/api/admin/tally`.
- [ ] Verify the approved concurrency test has passed.
- [ ] Verify monitoring and incident contacts are ready.

### 5.3 Database readiness

- [ ] Confirm production migrations are applied.
- [ ] Confirm election settings singleton row exists.
- [ ] Confirm candidate records are correct and approved.
- [ ] Confirm Kotak Kosong candidate number follows the approved convention.
- [ ] Confirm DPT import completed and row counts reconciled.
- [ ] Confirm duplicate NIM/email checks.
- [ ] Confirm RLS, grants, and RPC permissions.
- [ ] Confirm backup status and restore readiness.
- [ ] Confirm no test ballots or test voters remain in production.

### 5.4 Go / no-go decision

**Proposed:** Hold a documented go/no-go review immediately before opening voting.

A go decision requires:

1. Technical readiness confirmed.
2. DPT and candidate data approved.
3. Election schedule confirmed.
4. Critical security and test gates passed.
5. Operator and incident contacts available.
6. Election authority explicitly approves opening.

If a Critical integrity or ballot-secrecy issue remains unresolved, the recommended decision is **No-Go**.

## 6. DPT management procedure

### 6.1 DPT source and responsibility

The PRD requires DPT import using CSV/XLSX with:

- `nim`
- `email`
- `name`
- `generation`

The authoritative source file and person responsible for approving it are TBD.

### 6.2 Initial DPT import

1. Receive the official DPT file from the authorized source.
2. Record the source, submitter, and received date.
3. Store the original file in an access-controlled location.
4. Confirm required columns and file format.
5. Run the application's preview/validation workflow.
6. Review malformed rows and duplicate NIM/email values.
7. Review conflicts against existing records.
8. Confirm import atomicity and update behavior before committing.
9. Commit the import through the authorized admin workflow.
10. Reconcile imported row count and rejected-row count.
11. Record the outcome in the audit trail.
12. Restrict access to the original file and import report.

### 6.3 DPT correction after initial import

**Proposed procedure:**

1. Receive a correction request through the official support channel.
2. Verify the requester's identity and supporting evidence according to election policy.
3. Determine whether the issue is a typo, missing voter, duplicate record, or participation-state issue.
4. Obtain approval from the authorized DPT owner.
5. Apply the correction through a controlled admin operation.
6. Record actor, reason, target record, and before/after values where appropriate.
7. Verify the corrected record.
8. Inform the requester of the outcome without exposing another voter's data.

**Critical restriction:** Do not reset `has_voted` merely because a voter reports an issue. Any change to participation state requires a formally approved procedure and reconciliation with existing ballots.

### 6.4 Duplicate and conflict handling

The current PRD requires duplicate checking but does not define whether imports are all-or-nothing or permit partial success.

Until the import policy is approved:

- Do not silently overwrite existing records.
- Do not automatically merge two DPT identities.
- Do not delete a voter record that may already have voted.
- Stop and escalate ambiguous identity conflicts.
- Preserve the import preview and approval evidence.

## 7. Candidate data management

Before voting:

- Verify candidate number and candidate identity.
- Verify chair and vice-chair names.
- Verify vision and mission text.
- Verify candidate photo URL and display.
- Verify active/inactive state.
- Verify Kotak Kosong configuration and position.
- Obtain approval from the authorized election authority.

During voting, candidate changes should be treated as high-impact operations.

**TBD:** Whether candidate records may be edited after voting opens. Recommended default: freeze candidate data after the official opening unless the election authority approves an exceptional correction and the impact is assessed.

## 8. Opening voting procedure

### 8.1 Preconditions

- Pre-election readiness checklist is complete.
- DPT and candidate data are approved.
- Official start time and timezone are confirmed.
- `maintenance_mode` is in the approved state.
- Monitoring and support coverage are active.
- Election authority approves opening.

### 8.2 Opening steps

1. Authorized operator signs in with an approved admin account.
2. Confirm the current election settings.
3. Confirm `start_time` and `end_time`.
4. Confirm the system clock and configured timezone behavior.
5. Confirm no active incident prevents opening.
6. Set `is_voting_open` according to the approved procedure.
7. Verify the application reports voting availability correctly.
8. Perform approved non-destructive smoke checks.
9. Announce voting availability through the official communication channel.
10. Record the opening actor, time, approval, and settings state in the audit trail.

Do not cast a real test ballot in production as a smoke test.

### 8.3 Opening verification

- [ ] Eligible test identity can reach the ballot flow, without committing a real vote.
- [ ] Non-DPT identity is denied.
- [ ] Already-voted test identity is denied.
- [ ] Closed/maintenance behavior is correct when applicable.
- [ ] Student cannot access tally or admin functions.
- [ ] Candidate list matches approved election data.
- [ ] Monitoring is receiving signals.

## 9. Operations during voting

### 9.1 Routine monitoring

The technical operator should monitor:

- Application availability.
- Authentication success/failure trends.
- Vote-casting latency and error codes.
- Database health and resource utilization.
- RPC failure rate.
- Admin authorization denials.
- DPT import or correction activity.
- Backup status.

Monitoring must not expose candidate choice or create voter-to-ballot correlation.

### 9.2 Voter support principles

Support personnel should:

- Verify the issue without asking the voter to disclose their candidate choice.
- Never ask for passwords, access tokens, or session cookies.
- Avoid collecting unnecessary personal data in chat or screenshots.
- Use the approved process to check eligibility and participation state.
- Escalate ambiguous identity or already-voted cases.
- Never promise that a vote can be reset or changed.
- Never manually insert a ballot as a support workaround.

### 9.3 Common voter issues

| Issue | First response | Escalation |
|---|---|---|
| Cannot sign in | Check approved Entra sign-in guidance and service status | Technical operator / identity owner |
| Account not found in DPT | Verify through authorized DPT process | DPT owner / KPR |
| Already-voted message | Do not attempt a second vote; follow official support verification | KPR / election authority |
| Candidate list unavailable | Check service status; do not bypass ballot validation | Technical operator |
| Vote submission error | Ask voter not to repeatedly submit; check safe status through authorized process | Technical operator / KPR |
| Receipt not displayed after submission | Do not assume failure or success; verify transaction state through approved procedure | Technical operator |
| Suspected account compromise | Stop using affected session and escalate | Identity owner / incident lead |

The support workflow must not reveal which candidate was selected.

## 10. Election settings and maintenance mode

The PRD defines:

- `is_voting_open`
- `start_time`
- `end_time`
- `maintenance_mode`

Changes to these settings affect the election and must be restricted.

**Proposed change procedure:**

1. Request is submitted by an authorized operator.
2. Reason and intended impact are recorded.
3. Permission is checked server-side.
4. The operator reviews the resulting state before saving.
5. The change is recorded in `audit_logs`.
6. A second authorized person reviews high-impact changes where the approved policy requires it.
7. Voter-facing status is verified after the change.

**TBD:** Whether maintenance mode automatically closes voting, whether it can be enabled by KPR or only Superadmin, and whether a second-person approval is mandatory.

## 11. Incident response runbook

### 11.1 Severity categories

| Severity | Example | Immediate priority |
|---|---|---|
| Critical | Double voting, ballot secrecy breach, arbitrary voter impersonation, unauthorized ballot/tally manipulation | Escalate immediately; consider pausing voting |
| High | DPT corruption, admin compromise, widespread sign-in or voting outage | Escalate urgently; assess whether voting can continue safely |
| Medium | Localized voter access issue, report export failure | Triage and resolve without weakening controls |
| Low | Minor UI issue with no integrity or privacy impact | Track and prioritize |

### 11.2 Suspected integrity incident

Examples:

- A voter appears to have voted more than once.
- Ballot count and voter participation state do not reconcile.
- Unauthorized database writes are detected.
- Candidate or election settings changed unexpectedly.

Procedure:

1. Notify the designated incident owner and election authority.
2. Preserve relevant logs and evidence with restricted access.
3. Avoid modifying voter or ballot records while investigating.
4. Determine the affected time range and system components.
5. Consider pausing voting if integrity cannot be guaranteed.
6. Reconcile aggregate counts using an approved method that does not link voter identity to candidate choice.
7. Document findings and remediation.
8. Resume voting only with explicit authorization.

### 11.3 Suspected ballot secrecy incident

Examples:

- Ballot rows contain identity fields.
- Logs reveal a join path between a voter and candidate choice.
- An unauthorized user accesses ballot-level data.

Procedure:

1. Escalate immediately to the incident owner and election authority.
2. Restrict access to the affected data/log source.
3. Preserve evidence without expanding access.
4. Identify whether data was accessed or exported.
5. Assess the scope of exposure.
6. Consider pausing voting and/or tally release.
7. Document remediation and any required notifications under the approved policy.

### 11.4 Availability incident

Examples:

- Application is unreachable.
- Entra authentication is unavailable.
- Supabase/database connection fails.
- Vote-casting RPC errors increase significantly.

Procedure:

1. Confirm the outage through monitoring and an independent check.
2. Identify whether the issue is application, identity provider, database, or network.
3. Do not bypass DPT checks or database transaction rules.
4. If voting cannot be performed reliably, escalate to the election authority for a pause decision.
5. Restore service through the approved deployment/recovery procedure.
6. Run production-safe smoke tests.
7. Resume only after the authorized decision.

**Important:** Do not create an undocumented manual or offline voting path during an outage.

## 12. Closing voting procedure

### 12.1 Preconditions

- Official closing time or authorized close decision is reached.
- Election authority confirms closure.
- Any active incident has been assessed.
- Technical operator is available to verify the closed state.

### 12.2 Closing steps

1. Authorized operator signs in.
2. Confirm the official closing condition.
3. Set `is_voting_open` to false through the approved workflow, if required.
4. Verify the RPC rejects new votes with `VOTING_CLOSED`.
5. Verify the voter UI displays the closed state.
6. Record actor, time, and reason.
7. Preserve required logs and operational evidence.
8. Notify the election authority that voting is closed.

Do not alter ballot rows or voter participation states as part of routine closure.

### 12.3 Post-close verification

- [ ] New vote attempts are rejected.
- [ ] No unintended maintenance or settings change occurred.
- [ ] Ballot and participation aggregates are recorded.
- [ ] Candidate tally remains restricted until approved release.
- [ ] Required audit evidence is preserved.
- [ ] Report generation is performed only by authorized roles.

## 13. Tally, report, and result publication

The PRD requires private live count until official close and PDF/Excel report generation.

**Proposed procedure:**

1. Confirm voting is closed.
2. Obtain authorization to access candidate tally.
3. Generate the approved aggregate tally.
4. Verify aggregate totals and report consistency.
5. Verify the report contains only approved fields.
6. Have the authorized election stakeholder review the result.
7. Record report generation and access in the audit trail.
8. Publish results only through the official approved channel.
9. Preserve the official report and supporting evidence under the retention policy.

**TBD:** Whether KPR/Admin can see tally before close, who approves the final result, whether recounts are permitted, and how disputes are handled.

## 14. Post-election closeout

After result approval:

- [ ] Confirm election is closed and cannot accept new ballots.
- [ ] Verify final tally and turnout reports.
- [ ] Obtain official result approval.
- [ ] Archive approved reports and audit evidence securely.
- [ ] Restrict access to DPT and personal data.
- [ ] Review admin accounts and remove temporary privileges.
- [ ] Rotate temporary credentials if required.
- [ ] Review incidents and unresolved defects.
- [ ] Confirm backup and restore evidence is retained.
- [ ] Apply the approved data-retention schedule.
- [ ] Conduct a post-election review and record lessons learned.

Do not delete DPT, ballot, or audit data until the retention and dispute policy has been approved.

## 15. Operational checklists

### 15.1 Start-of-day checklist

- [ ] Confirm application and database availability.
- [ ] Confirm identity provider status.
- [ ] Confirm current election settings.
- [ ] Confirm support and technical contacts are available.
- [ ] Review unresolved incidents.
- [ ] Review backup status.
- [ ] Confirm no unauthorized admin or settings changes.

### 15.2 During-voting checklist

- [ ] Monitor service health and latency.
- [ ] Monitor RPC error codes.
- [ ] Monitor database resource usage.
- [ ] Triage voter issues without collecting candidate choice.
- [ ] Record approved administrative changes.
- [ ] Keep candidate tally restricted.
- [ ] Escalate integrity/privacy concerns immediately.

### 15.3 End-of-day / close checklist

- [ ] Confirm official election state.
- [ ] Confirm no unresolved Critical incident.
- [ ] Preserve required evidence.
- [ ] Verify access restrictions.
- [ ] Record operator handover and pending issues.

## 16. Operational records and audit trail

The PRD defines an `audit_logs` table with:

- `actor_email`
- `action`
- `details`
- `ip_address`
- `created_at`

Potential events include:

- DPT import and correction.
- Election settings changes.
- Admin override.
- Tally access.
- Report export.
- Role changes.
- Voting open/close actions.

Do not put candidate choice or a voter-to-ballot mapping into audit details.

Because actor email, IP address, and precise timestamps are sensitive/correlatable, access and retention must be limited by an approved policy.

## 17. Open decisions

| ID | Decision required | Why it matters |
|---|---|---|
| OPS-DEC-01 | Official election schedule and timezone | Defines opening and closure |
| OPS-DEC-02 | Named election authority and decision chain | Establishes accountability |
| OPS-DEC-03 | KPR/Admin/Superadmin operational permission matrix | Prevents unauthorized actions |
| OPS-DEC-04 | Official DPT source and owner | Establishes authoritative voter data |
| OPS-DEC-05 | DPT correction and participation override policy | Prevents improper voter-state changes |
| OPS-DEC-06 | DPT import atomicity and conflict handling | Prevents partial/corrupt import |
| OPS-DEC-07 | Candidate freeze and emergency correction policy | Protects ballot consistency |
| OPS-DEC-08 | Voting support channel and SLA | Defines voter assistance |
| OPS-DEC-09 | Maintenance-mode behavior | Defines service pause behavior |
| OPS-DEC-10 | Incident commander and escalation contacts | Enables rapid response |
| OPS-DEC-11 | Criteria and authority to pause/resume voting | Protects integrity during incidents |
| OPS-DEC-12 | Offline/manual voting policy during outage | Prevents undocumented alternative voting |
| OPS-DEC-13 | Tally access policy before official close | Protects result confidentiality |
| OPS-DEC-14 | Result approval, recount, and dispute procedure | Defines official result governance |
| OPS-DEC-15 | Report fields and publication channel | Controls disclosure |
| OPS-DEC-16 | Data and audit retention schedule | Controls long-term exposure |
| OPS-DEC-17 | Post-election archive and access revocation owner | Ensures controlled closeout |

## 18. Completion criteria

This runbook can move from Draft to Approved when:

1. All operational roles and authorities are assigned.
2. Official election schedule and timezone are confirmed.
3. DPT and candidate data procedures are approved.
4. Opening and closing procedures are rehearsed.
5. Support and incident escalation channels are established.
6. Pause/resume authority and criteria are documented.
7. Tally access and result publication policy are approved.
8. Post-election retention and closeout are defined.
9. Operators have completed a tabletop exercise or rehearsal.
10. The runbook is accessible to authorized operators during election operations.

## 19. Next document

**Next in sequence: `USER_GUIDE.md`** — user-facing instructions for voters and administrators, including sign-in, eligibility, casting a vote, receipt, DPT administration, and common troubleshooting.

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 0.1.0 | 2026-10-31 | Initial election operations runbook based on current project documentation |

## Kebijakan Operasional Pemira — Finalisasi 31 Oktober 2026

### Pembukaan dan penutupan voting
- KPR Admin berwenang membuka dan menutup voting tanpa persetujuan Superadmin.
- Setiap tindakan wajib menyertakan alasan dan dicatat dalam audit log.
- Superadmin tidak berwenang membuka atau menutup voting atas inisiatif sendiri.
- Sistem menolak transaksi suara ketika voting ditutup atau maintenance aktif.

### Maintenance dan penanganan darurat
- Superadmin berwenang mengaktifkan maintenance darurat.
- Aktivasi maintenance mencatat aktor, waktu, alasan, dan dampak yang diketahui.
- Superadmin memulihkan layanan dan memverifikasi kesiapan teknis.
- Setelah Superadmin menyatakan sistem siap, KPR Admin memutuskan apakah voting dilanjutkan.
- Superadmin tidak boleh memperpanjang jadwal atau membuka kembali voting atas inisiatif sendiri.

### Perpanjangan jadwal
- Perpanjangan jadwal memerlukan persetujuan KPR dan pihak berwenang Pemira.
- Jabatan/identitas pihak berwenang Pemira harus ditetapkan berdasarkan aturan resmi KPR sebelum produksi.
- Perubahan jadwal mencatat jadwal lama, jadwal baru, alasan, pihak yang menyetujui, dan waktu perubahan.
- Sistem tidak memperpanjang jadwal secara otomatis karena downtime.

### Transaksi dengan status tidak diketahui
- Database merupakan sumber kebenaran untuk menentukan apakah suara telah tercatat.
- Jika browser timeout atau kehilangan respons, aplikasi memeriksa status transaksi pemilih sebelum mengizinkan percobaan ulang.
- Sistem tidak boleh membuat ballot kedua hanya karena respons pertama tidak diterima browser.
- Pemeriksaan status wajib menjaga kerahasiaan pilihan kandidat.

### Pencatatan insiden
Semua insiden wajib dicatat, termasuk gangguan ringan, gangguan berat, kegagalan transaksi, dan insiden keamanan. Catatan minimal meliputi ID insiden, waktu, pelapor/aktor, kategori, dampak, layanan terdampak, tindakan mitigasi, keputusan pemulihan, dan persetujuan perubahan jadwal jika ada.

Log tidak boleh menyimpan pilihan kandidat, token autentikasi, password, atau data sensitif yang tidak diperlukan.

### Alur pemulihan
1. Insiden terdeteksi dan dicatat.
2. Jika berdampak berat, Superadmin mengaktifkan maintenance.
3. Superadmin melakukan pemulihan dan verifikasi teknis.
4. Superadmin menyatakan layanan siap.
5. KPR Admin memutuskan apakah voting dilanjutkan.
6. Jika perlu perpanjangan, persetujuan KPR dan pihak berwenang Pemira diperoleh terlebih dahulu.
7. Semua keputusan dan perubahan dicatat dalam audit log.

### Status
Kebijakan disepakati untuk desain sistem per 31 Oktober 2026. Jabatan pihak berwenang Pemira untuk persetujuan perpanjangan jadwal masih TBD dan harus mengikuti aturan resmi Pemira/KPR.

## Kebijakan Publikasi Hasil Pemira — Finalisasi 31 Oktober 2026

### Kewenangan dan waktu publikasi
- KPR Admin bertanggung jawab mengumumkan hasil resmi.
- Hasil tidak dipublikasikan otomatis ketika voting ditutup.
- Tanggal dan jam publikasi ditetapkan melalui jadwal resmi KPR.
- Publikasi dilakukan setelah rekapitulasi selesai diperiksa Auditor dan disahkan KPR Admin.

### Kanal publikasi
- Dashboard hasil publik pada website E-Voting.
- Dokumen PDF hasil resmi.
- Kedua kanal harus menampilkan data yang konsisten dan memiliki waktu/versi publikasi yang jelas.

### Informasi yang boleh dipublikasikan
- Jumlah suara setiap kandidat dan Kotak Kosong.
- Jumlah pemilih dan tingkat partisipasi.
- Statistik partisipasi berdasarkan angkatan.

### Informasi yang dilarang dipublikasikan
- NIM, nama, atau email pemilih.
- Status `has_voted` individual.
- Receipt token.
- Data yang menghubungkan identitas pemilih dengan pilihan kandidat.
- Live count sebelum voting ditutup dan hasil disahkan.

Statistik berdasarkan angkatan harus ditinjau terhadap risiko identifikasi tidak langsung pada kelompok berukuran kecil. Ambang minimum agregasi/penyembunyian kelompok kecil masih TBD.

### Koreksi setelah publikasi
- Koreksi memerlukan persetujuan KPR dan pemeriksaan Auditor.
- Alasan, data terdampak, nilai sebelum/sesudah, aktor, waktu, dan persetujuan wajib dicatat.
- Laporan yang telah dipublikasikan tidak boleh ditimpa tanpa jejak; versi lama harus dapat ditelusuri.
- Dashboard dan PDF harus diperbarui secara konsisten dengan nomor versi atau waktu revisi.

### Alur publikasi
1. KPR Admin menutup voting.
2. Sistem mengunci penerimaan suara dan menghasilkan rekapitulasi.
3. Auditor memeriksa konsistensi hasil.
4. KPR Admin mengesahkan hasil.
5. KPR menetapkan jadwal pengumuman resmi.
6. Dashboard publik dan PDF diterbitkan pada jadwal tersebut.

### Status
Kebijakan publikasi disepakati per 31 Oktober 2026. Tanggal/jam pengumuman ditentukan KPR untuk setiap pelaksanaan. Ambang agregasi minimum statistik per angkatan masih TBD.

## Kebijakan Retensi dan Privasi Data — Finalisasi 31 Oktober 2026

### Jadwal retensi
| Kategori | Masa retensi | Perlakuan |
|---|---|---|
| DPT dan pemetaan identitas Entra | 1 tahun setelah hasil disahkan | Hapus data pribadi/pemetaan identitas dari sistem operasional setelah masa retensi, kecuali terkena legal hold |
| Ballot anonim | Permanen | Arsipkan tanpa identitas atau penghubung ke pemilih |
| Hash receipt | 1 tahun setelah hasil disahkan | Hapus setelah masa verifikasi berakhir, kecuali terkena legal hold |
| Audit log | Permanen | Arsipkan dengan minimisasi data pribadi dan akses terbatas |

### Prinsip pelaksanaan
- Retensi permanen tidak membenarkan penyimpanan data pribadi yang tidak diperlukan.
- Ballot tidak boleh menyimpan NIM, email, nama, IP address, session ID, `tid`, atau `oid`.
- Receipt mentah tidak disimpan; hanya material verifikasi yang diperlukan dan dilindungi yang dapat disimpan selama masa retensi.
- Audit log tidak boleh menyimpan password, access token, refresh token, receipt mentah, atau pilihan kandidat.
- Penghapusan DPT harus mempertimbangkan salinan ekspor, file sementara, dan backup sesuai siklus backup serta kebijakan penghapusan backup.
- Data yang terkena sengketa atau pemeriksaan resmi ditangguhkan penghapusannya sampai proses selesai (legal hold). Penangguhan hanya mencakup data yang relevan dan harus dicatat.
- Akses arsip permanen dibatasi kepada pihak yang berwenang dan seluruh akses penting dicatat.

### Status
Masa retensi DPT, ballot, receipt, dan audit log disepakati untuk desain sistem per 31 Oktober 2026. Detail teknis siklus backup, prosedur penghapusan terverifikasi, dan pejabat pemberi legal hold masih perlu ditetapkan sebelum produksi.

## Kebijakan Kepemilikan dan Serah Terima Sistem — Finalisasi 31 Oktober 2026

### Kepemilikan
- HMIF menjadi pemilik organisasi dan pengelola jangka panjang sistem E-Voting Pemira.
- Pengembang awal dapat mengelola implementasi selama masa pengembangan, tetapi kepemilikan operasional tidak melekat pada akun pribadi pengembang.
- Tenant Microsoft Entra yang saat ini direncanakan dibuat dan dimiliki secara personal merupakan pengecualian sementara yang harus diselesaikan melalui keputusan migrasi/serah terima. Sampai dipindahkan atau dikendalikan secara resmi oleh HMIF, tenant tersebut tetap menjadi dependensi personal dan risiko keberlanjutan.

### Serah terima minimum
1. HMIF menunjuk minimal dua pengelola teknis yang berwenang.
2. HMIF memiliki akses administratif ke repository source code, proyek Cloud Run, proyek Supabase, domain/DNS, dan sistem backup.
3. Credential dan secret diserahkan melalui secret manager atau mekanisme aman; tidak dicantumkan di dokumentasi atau chat.
4. MFA wajib pada akun pemilik dan administrator layanan.
5. Recovery information dan prosedur pemulihan disimpan oleh HMIF dengan akses terbatas.
6. Dokumentasi deployment, migrasi database, konfigurasi environment, backup/restore, dan prosedur insiden harus diserahkan.
7. Setelah pergantian kepengurusan, akses administrator ditinjau, akun yang tidak lagi berwenang dicabut, dan minimal dua pengelola baru ditetapkan.
8. Lakukan uji pemulihan backup dan uji akses oleh pengelola pengganti sebelum serah terima dinyatakan selesai.

### Layanan dan aset yang harus berada dalam kendali HMIF
- Repository source code dan pipeline CI/CD.
- Proyek Cloud Run dan akun billing terkait.
- Proyek Supabase, database, backup, dan konfigurasi akses.
- Domain, DNS, dan sertifikat terkait.
- Tenant Entra/App Registration atau mekanisme migrasi yang disetujui.
- Dokumentasi, file konfigurasi non-secret, dan catatan operasional.

### Risiko tenant personal
Karena keputusan awal menggunakan tenant Entra milik pribadi, HMIF belum sepenuhnya menguasai identitas dan App Registration. Sebelum sistem dipakai untuk Pemira produksi, HMIF harus memilih salah satu:
- memindahkan pengelolaan tenant/App Registration ke akun/struktur organisasi yang dikendalikan HMIF; atau
- menetapkan perjanjian pengelolaan formal yang menjamin akses berkelanjutan, pemulihan, dan pergantian pengelola.

Pilihan final untuk mekanisme tenant setelah serah terima masih TBD. Kepemilikan organisasi HMIF sudah disepakati.

### Status
HMIF ditetapkan sebagai pemilik dan pengelola jangka panjang sistem. Detail struktur akun organisasi, penanggung jawab teknis, dan mekanisme pemindahan/pengelolaan tenant Entra masih harus ditetapkan sebelum produksi.
