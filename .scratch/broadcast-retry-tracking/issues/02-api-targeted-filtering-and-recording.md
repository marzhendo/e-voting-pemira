# 02: Broadcast API Targeted Filtering & Real-Time Delivery Recording

**What to build:**
Allow administrators to query recipient counts and execute broadcasts targeted specifically to voters whose emails failed or who have never received an email, with immediate recording of delivery results upon each SMTP transmission.

**Blocked by:** 01: Delivery Status Schema & Deep Storage Module

**Status:** ready-for-agent

- [ ] `broadcastRequestSchema` in `app/api/admin/broadcast-email/route.ts` accepts `targetGroup: 'failed_email' | 'uncontacted'` in addition to existing segments.
- [ ] `GET /api/admin/broadcast-email` accurately counts and previews recipients for `failed_email` and `uncontacted`.
- [ ] `POST /api/admin/broadcast-email` queries voters with matching `last_email_status` filters in deterministic order (`order('nim', { ascending: true })`).
- [ ] Each recipient's dispatch result immediately updates their record via `recordEmailDelivery(voter.nim, ...)`.
- [ ] Chunk response returns `failedRecipients` details (NIM, name, email, error reason).
- [ ] Integration tests verify targeted recipient filtering and delivery status updates.
