# Specification: Per-Voter Email Delivery Tracking & Targeted Retry System

## Problem Statement

1. **Email Broadcast Failure Tracking**:
When the election administrator (Panitia KPR / Superadmin) broadcasts official emails (such as H-1 credential distributions or voting deadline reminders) to hundreds or thousands of students in a cohort, individual emails may occasionally fail to deliver due to external factors:
- Mailbox storage quota exceeded on the student's campus email.
- Temporary campus SMTP throttling or rate-limiting.
- Inactive or suspended student Microsoft 365 accounts.
- Transient network or socket timeouts.

Currently, the e-voting platform only tracks delivery counts as aggregate numbers (e.g. "265 sent, 4 failed"). Because the system does not record per-student delivery outcomes in the database, the administrator cannot identify which specific students failed to receive their credentials. Furthermore, there is no way to retry sending only to the failed recipients; the administrator would have to either re-broadcast to the entire 269 students (annoying those who already received it) or manually find and send individual credentials one by one.

2. **Candidate Photo Asset 404 & UI Broken Image Display**:
On production (`pemirahmif.com/vote`), mobile voters report that the candidate photo for Paslon 01 fails to render, displaying an unstyled native browser broken image icon (`Foto Pasangan Calon 01`). Diagnostic investigation reveals:
- The candidate photo was uploaded to transient `/uploads/` storage which was lost or unmapped on server rebuild (`output: 'standalone'`).
- The `CandidateCard` and `CandidateDetailModal` components lack an `onError` event handler, so any 404 image URL results in an immediate broken image icon rather than gracefully falling back to a permanent static asset or official branded placeholder.

## Solution

1. **Automated Per-Voter Delivery Tracking & Targeted Retry**:
- Persist the delivery status (`last_email_status`: `'sent'` | `'failed'` and `last_email_sent_at`: ISO timestamp) for each voter in `voters_whitelist`.
- Update the broadcast filtering engine to support targeted recipient segments (`failed_email`, `uncontacted`, `not_voted`, `all`).
- Provide a seamless 1-click retry experience on the Broadcast Completion Screen: when failures are detected at the end of a broadcast, a prominent "Kirim Ulang X Email Gagal" action allows immediate re-dispatch strictly to the failed recipients.

2. **Candidate Asset Persistence & UI Resilience**:
- Commit immutable, production-grade candidate assets into `public/assets/candidates/` (versioned in Git, served directly by NGINX with long-term cache headers).
- Add resilient `onError` state handling in `CandidateCard` and `CandidateDetailModal` so that if any image URL fails to load, it automatically falls back to the committed static asset, and if still unavailable, renders a styled official candidate badge (never showing a broken image icon to voters).
- Harden the file upload path resolver to guarantee paths sit in a persistent location outside ephemeral `.next/standalone` build directories.

## User Stories

1. As a KPR administrator, I want each student's DPT record to track whether their broadcast email succeeded or failed, so that I have a reliable audit trail of voter communication.
2. As a KPR administrator, I want the system to record the exact timestamp when a student's email was successfully delivered, so that I know how fresh their credentials are.
3. As a KPR administrator, I want to filter broadcast recipients by "Khusus yang Gagal Terkirim", so that I can retry sending to students whose emails bounced or failed without re-emailing students who already got theirs.
4. As a KPR administrator, I want to filter broadcast recipients by "Belum Pernah Menerima Email", so that newly added DPT voters can receive their credentials without duplicating messages to existing voters.
5. As a KPR administrator, I want to see the count of failed emails in real-time on the broadcast tab, so that I am immediately alerted to any deliverability issues.
6. As a KPR administrator, I want a 1-click "Kirim Ulang Email Gagal" button on the broadcast completion screen, so that I don't have to re-configure filters manually after a broadcast finishes with errors.
7. As a student voter entering the digital voting booth, I want candidate photos to always load cleanly without broken image icons, even if network or server file paths experience transient issues.
8. As a student voter whose mailbox was temporarily full, I want the administrator to be able to resend my credential email once my mailbox is cleared, so that I can participate in the election.
9. As an auditor, I want all retry operations to be fully logged in the Audit Trail with exact counts of recovered and failed deliveries, so that electoral fairness and transparency are guaranteed.
10. As a system architect, I want delivery tracking to live strictly in `voters_whitelist` and never reference the `ballots` table, so that Ballot Secrecy is strictly preserved.

## Implementation Decisions

### 1. Database Schema (`voters_whitelist`)
Extend `public.voters_whitelist` in Supabase (with backwards-compatible fallback in dev store):
- `last_email_sent_at TIMESTAMPTZ NULL`: Timestamp of the latest successful SMTP dispatch.
- `last_email_status TEXT NULL`: Delivery status, constrained to `'sent' | 'failed' | NULL`.
- `last_email_error TEXT NULL`: Truncated, sanitized error reason (e.g. `'SMTP 550 Mailbox full'`).
- Partial index on `last_email_status` for fast query performance:
  `CREATE INDEX IF NOT EXISTS idx_voters_whitelist_email_status ON public.voters_whitelist(last_email_status) WHERE last_email_status = 'failed';`

### 2. Deep Module: Voter Delivery Store Seam (`lib/dpt/store.ts`)
Encapsulate delivery recording behind a deep interface with a single method:
```typescript
export async function recordEmailDelivery(
  nim: string,
  result: { success: boolean; error?: string }
): Promise<void>;
```
- **Depth**: Callers do not write SQL or handle column availability fallbacks. The module handles Supabase queries, dev store emulation, and column error fallbacks internally.
- **Fail-Safe**: Delivery recording errors must not throw or interrupt the broadcast chunking loop; they are logged internally and handled gracefully.

### 3. API Contract Modifications (`app/api/admin/broadcast-email/route.ts`)
- **GET query parameter**:
  `targetGroup`: extend enum to `['all', 'not_voted', 'voted', 'failed_email', 'uncontacted']`.
- **POST body schema**:
  `targetGroup`: accept `'failed_email'` and `'uncontacted'`.
- **Execution Hook**:
  Immediately after `smtpMailService.sendBroadcastEmail` or `sendVoterPassword` resolves for a recipient:
  - If `res.success === true`: call `recordEmailDelivery(voter.nim, { success: true })`.
  - If `res.success === false`: call `recordEmailDelivery(voter.nim, { success: false, error: res.error })`.
- **Response Payload**:
  Include `failedRecipients: Array<{ nim: string; name: string; email: string; error?: string }>` in chunk stats so the client has full granular visibility.

### 4. UI Interaction & Flow (`components/admin/tabs/broadcast-tab.tsx` & modals)
- Add dropdown items for `failed_email` ("Gagal Terkirim Sebelumnya") and `uncontacted` ("Belum Pernah Menerima Email").
- In `BroadcastConfirmModal`:
  - When `broadcastProgress.isComplete` is true AND `failedCount > 0`:
    - Show an action button: `[Kirim Ulang ({failedCount}) Email Gagal]`.
    - Clicking it sets `broadcastTargetGroup = 'failed_email'`, resets progress, and immediately triggers `handleExecuteBroadcast()`.

## Testing Decisions

- **Good Test Standard**: Test external observable behavior (API responses, recipient counts, schema filtering, delivery recording) through the public interface; do not test SQL internals.
- **Modules to Test**:
  1. `lib/dpt/store.ts`: Test `recordEmailDelivery` updates `last_email_status` and `last_email_sent_at` correctly in both Supabase and dev store.
  2. `app/api/admin/broadcast-email/route.ts`:
     - Test filtering by `targetGroup = 'failed_email'` returns only failed voters.
     - Test filtering by `targetGroup = 'uncontacted'` returns only voters without `last_email_sent_at`.
     - Test dispatch updates delivery status for each recipient.
  3. Ballot Secrecy Invariant: Verify that neither `last_email_status` nor retry logs leak or link to cast ballots.

## Out of Scope

- Automatic webhook delivery callbacks from external email service providers (SendGrid/Postmark webhooks). All tracking is based on direct SMTP server handshake response (`smtpMailService`).
- Modifying student email addresses directly inside the broadcast modal (student emails must be managed via DPT management or verified via SSO).

## Further Notes

- In accordance with project invariants, Ballot Secrecy remains untouchable: email delivery records reside entirely in `voters_whitelist` and cannot be joined with anonymous ballots in `ballots`.
