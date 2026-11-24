# 03: Broadcast UI Filtering & 1-Click Retry Experience

**What to build:**
Provide administrators with an intuitive interface to select failed email segments, see failure indicators, and trigger an immediate 1-click retry from the completion modal if any emails fail during broadcast.

**Blocked by:** 02: Broadcast API Targeted Filtering & Real-Time Delivery Recording

**Status:** ready-for-agent

- [ ] Dropdown "Kelompok penerima" in `BroadcastTab` includes "Gagal Terkirim Sebelumnya" (`failed_email`) and "Belum Pernah Menerima Email" (`uncontacted`).
- [ ] If failed emails exist, a distinct badge/pill alerts the administrator in the broadcast settings panel.
- [ ] On `BroadcastConfirmModal` completion screen, when `failedCount > 0`, a prominent `[Kirim Ulang (X) Email Gagal]` CTA is rendered.
- [ ] Clicking the retry CTA automatically sets target to `failed_email`, resets progress, and immediately begins the chunked retry process without extra modal forms.
- [ ] TypeScript verification (`pnpm tsc --noEmit`) passes with 0 errors.
- [ ] Full end-to-end and unit tests pass cleanly.
