# Spec: Halaman Rekapitulasi Suara & Partisipasi Pemilih (`/rekapitulasi`)

**Triage:** `ready-for-agent`

## Problem Statement

Saat ini pemilih maupun saksi pasangan calon tidak memiliki satu halaman khusus untuk memantau **Partisipasi Pemilih** secara utuh maupun membaca **Rekapitulasi Suara** resmi setelah pemungutan suara ditutup. Informasi hasil suara hanya tersedia di dashboard administrator panitia atau terselip ringkas di halaman **Tanda Terima Pemilihan** milik pemilih yang sudah selesai memilih, sementara pemilih yang belum sempat memilih saat waktu penutupan hanya melihat spanduk penutupan tanpa akses langsung ke halaman hasil resmi.

## Solution

Menyediakan halaman terproteksi khusus (`/rekapitulasi`) bagi seluruh akun terautentikasi yang mempertahankan beranda dan Tanda Terima Pemilihan tetap bersih. Selama **Bilik Suara Digital** aktif, halaman hanya menampilkan **Partisipasi Pemilih** keseluruhan serta per angkatan beserta hitung mundur jadwal penutupan dengan pembaruan otomatis tiap 30 detik. Begitu pemilihan resmi ditutup, halaman otomatis berhenti melakukan polling dan menampilkan **Rekapitulasi Suara** lengkap meliputi pasangan calon, kotak kosong, foto kandidat, grafik proporsi suara, rincian partisipasi per angkatan, serta panel transparansi/verifikasi. Seluruh akses data bersifat read-only terhadap basis data suara sehingga suara masuk tetap aman sepenuhnya.

## User Stories

1. As an authenticated voter, I want to open `/rekapitulasi` while voting is active, so that I can monitor overall and per-generation **Partisipasi Pemilih** without seeing candidate vote counts.
2. As an authenticated voter, I want to see a clear lock notice and closing countdown on `/rekapitulasi` during active voting, so that I understand why candidate vote totals are intentionally hidden until closing time.
3. As an unauthenticated visitor opening a shared `/rekapitulasi` link, I want to be redirected to `/login?redirect=/rekapitulasi` with a clear prompt and automatically forwarded to `/rekapitulasi` after authenticating, so that both voted and unvoted voters can reach the page directly without cluttering the home landing page.
4. As an authenticated voter who visits `/vote` after voting has closed, I want to see a direct button to open `/rekapitulasi` on the closed-voting banner, so that I can still view the official participation and results.
5. As an unvoted voter who logs in after voting has closed, I want to be directed to `/rekapitulasi` automatically, so that I do not get stuck inside a closed voting booth.
6. As a voted voter who logs in without a `redirect` parameter, I want to still land on `/receipt` cleanly without extra links added there, while still being able to visit `/rekapitulasi` when opening the shared link.
7. As an authenticated voter or witness, I want `/rekapitulasi` to automatically refresh every 30 seconds while voting is active with a visible last-updated timestamp and manual refresh trigger, so that I get near-real-time turnout monitoring.
8. As an authenticated voter or witness viewing `/rekapitulasi` after voting closes, I want auto-polling to stop automatically and show a finalized status, so that settled official results remain stable without unnecessary network requests.
9. As an authenticated voter or witness after voting closes, I want to see a ranked breakdown of every candidate pair (with official photo, candidate number, Chairman & Vice Chairman names, vote count, and percentage) plus Kotak Kosong in both a stacked proportion bar and horizontal ranked cards, so that final election results are unambiguous on mobile and desktop.
10. As an authenticated voter or witness, I want to inspect per-generation **Partisipasi Pemilih** (2019–2026) via an accessible horizontal bar breakdown alongside an overall SVG circular gauge, so that turnout across cohorts is easy to compare without chart label overlap on narrow phone screens.
11. As an election committee member (KPR/Superadmin) opening `/rekapitulasi` during active voting, I want `/rekapitulasi` to strictly enforce the public-closed visibility rule just like for voters, so that projecting or screenshotting the page never leaks confidential vote counts prematurely.
12. As an anonymous client without a valid session cookie calling the tally endpoint directly, I want the request rejected with HTTP 401, so that turnout and tally data remain restricted to authenticated campus voters and committee members.
13. As an election committee member deploying this feature while live voting is active, I want zero database schema migrations or ballot writes, so that existing `Surat Suara Anonim` records remain 100% untouched.

## Implementation Decisions

- **Read-Only Data Enrichment on the Tally Snapshot Module:** Extend the centralized tally aggregation module to include per-candidate official photo URLs (honoring static candidate asset fallback behavior) alongside `isClosed`, election window timestamps (`startTime`, `endTime`), overall `Partisipasi Pemilih`, per-generation `Partisipasi Pemilih` (`byGeneration`), and `Rekapitulasi Suara` (`tally`). No database schema alterations or writes to `Surat Suara Anonim` are permitted.
- **Session-Protected Tally API & Restricted Visibility Invariant:** Guard the voter-facing tally endpoint with mandatory session authentication (`401 Unauthorized` when unauthenticated). Keep the strict visibility gate intact: when `isClosed === false`, return `turnout` (overall + `byGeneration`) and election timing metadata, omitting candidate vote breakdowns completely; when `isClosed === true`, include the ranked `results` array with candidate photos. Support clean static-to-dev parity for offline test mode.
- **Middleware & Safe Redirect Contract:** Register `/rekapitulasi` in edge middleware as an authenticated route (any valid session—voter or admin—is allowed through; unauthenticated requests redirect to `/login?redirect=/rekapitulasi&error=REKAP_AUTH_REQUIRED`). Update post-login redirect resolution with a strict internal path allowlist so safe `/rekapitulasi` redirects work across password login and session-resumed flows without introducing open-redirect vulnerabilities.
- **Clean Entry Points Preserving Home & Receipt Minimalism:** Keep the landing home page (`/`) and **Tanda Terima Pemilihan** (`/receipt`) untouched in layout and links. Expose an entry button to `/rekapitulasi` inside the closed-election banner on **Bilik Suara Digital** (`/vote`) when voting is not active, and redirect newly logged-in unvoted voters directly to `/rekapitulasi` if the election is already closed.
- **Dedicated `/rekapitulasi` Client Experience & Visualization Architecture:**
  - Single unified shell adhering strictly to HMIF dark-and-gold design tokens, `tabular-nums`, `balance`/`pretty` typography wrapping, `0px` horizontal overflow across breakpoints, and `44x44px` minimum touch targets.
  - **Overall Turnout Gauge:** Custom responsive SVG circular ring gauge pairing exact DPT count ratio with percentage.
  - **Cohort Turnout Chart:** Custom responsive horizontal bar list across generations (2019–2026) with animated width bars (`framer-motion`, zero-bounce spring/tween) and right-aligned counts.
  - **Final Vote Distribution:** Stacked 100% proportion summary bar paired with ranked horizontal vote cards displaying resilient candidate portraits (`onError` static/badge fallback) and Kotak Kosong styling.
  - **Polling State Machine:** Active polling interval every 30 seconds while `!isClosed` (pausing when document tab is hidden if helpful, with manual refresh button and WIB timestamp), automatically halting once `isClosed === true`.

```typescript
// Shared contract shape for the /rekapitulasi payload
interface ElectionRecapPayload {
  success: boolean;
  isClosed: boolean;
  timestamp: string;
  electionWindow: {
    startTime: string;
    endTime: string;
    isVotingOpen: boolean;
  };
  turnout: {
    totalDpt: number;
    totalVotes: number;
    turnoutPercentage: number;
    byGeneration: Array<{
      generation: number;
      totalVoters: number;
      votedCount: number;
      turnoutPercentage: number;
    }>;
  };
  results?: Array<{
    candidateId: string;
    candidateNumber: number;
    leaderName: string;
    viceLeaderName: string;
    photoUrl: string | null;
    voteCount: number;
    percentage: number;
  }>;
}
```

## Testing Decisions

- **Highest Practical Seam:** Exercise behavior primarily at two high-trust seams matching existing codebase test patterns (`node:test`):
  1. **Tally Visibility, Auth Guard, & Redirect Resolution Seam:** Verify unauthenticated rejection, strict omission of `results` when `isClosed === false` (even when votes exist), full disclosure with `byGeneration` and `photoUrl` when `isClosed === true`, safe internal `redirect` allowlisting (rejecting external URLs), and post-login routing when election is closed.
  2. **End-to-End UI & Responsive Layout Seam (Playwright / Browser):** Verify unauthenticated redirect to `/login?redirect=/rekapitulasi`, locked-tally vs final-results state transitions, 30-second polling stop behavior on closed state, and zero horizontal overflow on mobile (`390px`) and desktop viewports.
- **What Makes Good Tests Here:** Assert observable response fields, status codes, redirect destinations, and DOM visibility states — never internal component state hooks or database implementation details.
- **Prior Art:** Follow the structure of the existing voter re-login and tally invariant tests and Playwright E2E specs in the repository.

## Out of Scope

- Modifying database tables or running SQL migrations on live Supabase (`ballots`, `voters_whitelist`, `election_settings`).
- Adding navigation links or recap previews to the home landing page (`/`) or **Tanda Terima Pemilihan** (`/receipt`).
- Displaying live per-candidate counts on `/rekapitulasi` while voting is active (strictly forbidden by security invariants).
- Adding external charting libraries (`recharts`, `chart.js`) to `package.json`.

## Further Notes

- Remember dev-server safety rule: verify locally with `pnpm tsc --noEmit`, unit tests, and Playwright without disrupting any active `next dev` `.next/` cache; production build runs cleanly on the target VPS upon deployment.
