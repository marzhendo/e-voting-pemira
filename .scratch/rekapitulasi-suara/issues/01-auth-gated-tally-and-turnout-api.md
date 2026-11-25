# 01: Auth-Gated Tally & Turnout Snapshot API

**What to build:** Extend the tally snapshot service and voter-facing tally endpoint to enforce valid session authentication (`401` when unauthenticated), return `byGeneration` **Partisipasi Pemilih** and `electionWindow` metadata while voting is active (strictly omitting candidate vote breakdowns), and return ranked candidate `results` including resilient `photoUrl` values once voting is closed.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `GET /api/election/tally` returns HTTP `401` when called without a valid session cookie
- [ ] When `isClosed === false`, response includes `turnout` (overall + `byGeneration`) and `electionWindow`, and strictly omits `results`
- [ ] When `isClosed === true`, response includes ranked `results` with `photoUrl` alongside `turnout` and `byGeneration`
- [ ] Existing **Tanda Terima Pemilihan** consumer remains 100% backward compatible
- [ ] Unit/integration tests verify both locked and disclosed tally payloads
