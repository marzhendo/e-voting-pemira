# 04: Safe `?redirect=/rekapitulasi` Flow & Closed-Booth Entry

**What to build:** Connect clean entry points without modifying the home landing page (`/`) or **Tanda Terima Pemilihan** (`/receipt`): allowlist and resolve safe internal `?redirect=/rekapitulasi` post-login destinations across password login (with a friendly `REKAP_AUTH_REQUIRED` prompt), direct unvoted voters logging in after voting closes straight to `/rekapitulasi`, and add a **"Lihat Rekapitulasi Suara"** CTA inside the closed-election banner on **Bilik Suara Digital**.

**Blocked by:** 02: Protected `/rekapitulasi` Shell & Active Partisipasi Mode

**Status:** ready-for-agent

- [ ] External or malformed `redirect` query values (e.g., `//evil.com`, `https://evil.com`) are rejected cleanly and never followed
- [ ] Unauthenticated click on `/rekapitulasi` prompts cleanly on `/login` and routes to `/rekapitulasi` immediately after authentication for both voted and unvoted voters
- [ ] Unvoted voters logging in after voting closes (`isClosed === true`) land on `/rekapitulasi`, while voted voters without `redirect` continue to `/receipt`
- [ ] Home `/` and `/receipt` remain visually unchanged; `/vote` closed banner displays the recap link cleanly
