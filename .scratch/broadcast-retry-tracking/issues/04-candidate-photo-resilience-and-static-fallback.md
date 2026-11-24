# 04: Candidate Photo Resilience, Static Fallback & Asset Persistence

**What to build:**
Ensure candidate photos always render reliably on all voter devices without broken image icons, by introducing UI error-resilience fallbacks, committing immutable static assets for registered candidates, and hardening the upload storage resolution against server redeployment wipes.

**Blocked by:** None (can start immediately / in parallel with Ticket 01)

**Status:** ready-for-agent

- [ ] Add `onError` state and graceful fallback handling in `components/ballot/candidate-card.tsx` so a failed image URL falls back first to static `/assets/candidates/paslon-{N}.webp` and then to the styled HMIF official candidate badge (never showing browser broken image icons).
- [ ] Add `onError` state and graceful fallback handling in `components/candidates/candidate-detail-modal.tsx`.
- [ ] Commit official Paslon 1 photo to `public/assets/candidates/paslon-1.webp` (tracked in Git, directly served and cached by NGINX).
- [ ] Update candidate 1 photo URL in database / seed / admin update to reference the permanent static asset.
- [ ] Harden `app/api/admin/upload/route.ts` and `app/uploads/[...path]/route.ts` to resolve canonical paths outside transient `.next/standalone` build folders.
- [ ] Automated regression tests verify that 404 image URLs trigger the fallback component gracefully and that static candidate assets serve with valid 200 responses.
