# 03: Final Rekapitulasi Suara Results & Integrity View

**What to build:** Complete the closed-election **Rekapitulasi Suara** experience (`isClosed === true`) inside `/rekapitulasi` with an official final announcement summary, 100% stacked proportion distribution bar, ranked Paslon & Kotak Kosong result cards featuring resilient candidate portraits (`onError` static asset and badge fallbacks), full DPT cohort participation summary, and **Surat Suara Anonim** / BAST verification transparency section.

**Blocked by:** 02: Protected `/rekapitulasi` Shell & Active Partisipasi Mode

**Status:** ready-for-agent

- [ ] Official results render sorted from highest votes to lowest, handling ties and Kotak Kosong cleanly
- [ ] Candidate portrait images fall back cleanly to static assets and styled HMIF badge without ever displaying a broken image icon
- [ ] Stacked 100% proportion bar accurately reflects relative vote share across candidates and Kotak Kosong
- [ ] Verified in Playwright/responsive view without overflow or clipping on mobile (`390px`) and desktop
