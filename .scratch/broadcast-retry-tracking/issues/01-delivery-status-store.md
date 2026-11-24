# 01: Delivery Status Schema & Deep Storage Module

**What to build:**
Enable the platform to persist and retrieve per-student email dispatch outcomes so that the system remembers which students have successfully received emails and which encountered delivery failures, while maintaining strict ballot secrecy invariants.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Supabase migration `00014_voter_email_delivery_tracking.sql` created with `last_email_sent_at`, `last_email_status`, and `last_email_error` columns on `voters_whitelist`.
- [ ] Partial index created on `voters_whitelist(last_email_status) WHERE last_email_status = 'failed'` for high query performance.
- [ ] Deep module method `recordEmailDelivery(nim, { success, error })` implemented in `lib/dpt/store.ts` handling Supabase update, dev store emulation, and column fallbacks.
- [ ] `VoterRecord` interface in `lib/dpt/store.ts` extended with `last_email_sent_at` and `last_email_status`.
- [ ] Automated tests verify `recordEmailDelivery` sets `'sent'` and `'failed'` correctly without affecting ballots table.
