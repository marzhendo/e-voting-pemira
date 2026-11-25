# 02: Protected `/rekapitulasi` Shell & Active Partisipasi Mode

**What to build:** Register `/rekapitulasi` as a session-protected route in edge middleware and implement the `/rekapitulasi` page shell for active voting (`isClosed === false`), displaying the overall SVG circular turnout gauge, horizontal **Partisipasi Pemilih** cohort bar list (2019–2026), closing countdown, explicit candidate vote lock notice, and 30-second auto-polling with manual refresh that automatically stops once voting closes.

**Blocked by:** 01: Auth-Gated Tally & Turnout Snapshot API

**Status:** ready-for-agent

- [ ] Unauthenticated requests to `/rekapitulasi` redirect to `/login?redirect=%2Frekapitulasi&error=REKAP_AUTH_REQUIRED`
- [ ] Authenticated voters (voted or unvoted) and committee members can load `/rekapitulasi` cleanly
- [ ] SVG Circular Gauge and per-generation horizontal bar list render crisply at both mobile (`390px`) and desktop (`1280px+`) widths with `0px` horizontal overflow and `tabular-nums` alignment
- [ ] Auto-polling triggers every 30 seconds while `isClosed === false` and halts cleanly when `isClosed === true`
