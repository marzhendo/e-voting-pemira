import { test, expect } from '@playwright/test';

test.describe('Halaman Rekapitulasi Suara & Partisipasi Pemilih (/rekapitulasi)', () => {
  test('1. Protects /rekapitulasi and /api/election/tally from unauthenticated access', async ({
    page,
    request,
  }) => {
    const apiRes = await request.get('/api/election/tally');
    expect(apiRes.status()).toBe(401);

    await page.goto('/rekapitulasi');
    await page.waitForURL(/\/login\?redirect=%2Frekapitulasi&error=REKAP_AUTH_REQUIRED/);

    await expect(
      page.getByText('Masuk untuk Melihat Rekapitulasi')
    ).toBeVisible();
  });

  test('2. Redirects straight to /rekapitulasi after login and renders locked turnout mode cleanly on mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Intercept tally endpoint with deterministic active-election payload
    await page.route('**/api/election/tally', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isClosed: false,
          timestamp: new Date().toISOString(),
          electionWindow: {
            startTime: new Date(Date.now() - 3600_000).toISOString(),
            endTime: new Date(Date.now() + 7200_000).toISOString(),
            isVotingOpen: true,
          },
          turnout: {
            totalDpt: 1232,
            totalVotes: 616,
            turnoutPercentage: 50.0,
            byGeneration: [
              { generation: 2023, totalVoters: 300, votedCount: 180, turnoutPercentage: 60.0 },
              { generation: 2024, totalVoters: 269, votedCount: 150, turnoutPercentage: 55.8 },
              { generation: 2025, totalVoters: 252, votedCount: 126, turnoutPercentage: 50.0 },
              { generation: 2026, totalVoters: 411, votedCount: 160, turnoutPercentage: 38.9 },
            ],
          },
        }),
      });
    });

    await page.goto('/rekapitulasi');
    await page.waitForURL(/\/login\?redirect=%2Frekapitulasi/);

    let capturedRedirect = '';
    await page.route('**/api/auth/login', async (route) => {
      const postData = route.request().postDataJSON();
      capturedRedirect = postData?.redirect || '';
      await route.continue();
    });

    // Submit with local dev credentials on /login
    await page.fill('#identifier', '103012300001');
    await page.fill('#password', 'HMIF2026');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/rekapitulasi');
    expect(capturedRedirect).toBe('/rekapitulasi');

    await expect(page.getByText('Pantauan Partisipasi Pemilih')).toBeVisible();
    await expect(
      page.getByRole('region', { name: /Ringkasan Partisipasi Pemilih/i }).getByText('50.0%')
    ).toBeVisible();
    await expect(page.getByText('Angkatan 2024')).toBeVisible();
    await expect(page.getByText('Perolehan Suara Pasangan Calon Terkunci')).toBeVisible();

    // Zero horizontal overflow on 390px mobile
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test('3. Renders clean official results and cohort turnout summary when election is closed', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/login?redirect=%2Frekapitulasi');
    await page.fill('#identifier', '103012300001');
    await page.fill('#password', 'HMIF2026');

    await page.route('**/api/election/tally', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isClosed: true,
          timestamp: '2026-11-25T09:35:00.000Z',
          electionWindow: {
            startTime: '2026-11-25T01:00:00.000Z',
            endTime: '2026-11-25T09:30:00.000Z',
            isVotingOpen: false,
          },
          turnout: {
            totalDpt: 1232,
            totalVotes: 980,
            turnoutPercentage: 79.55,
            byGeneration: [
              { generation: 2024, totalVoters: 269, votedCount: 220, turnoutPercentage: 81.78 },
              { generation: 2025, totalVoters: 252, votedCount: 205, turnoutPercentage: 81.35 },
            ],
          },
          results: [
            {
              candidateId: 'cand-1',
              candidateNumber: 1,
              leaderName: 'Nehemia Pandu I.',
              viceLeaderName: 'Barret Fairuz A.',
              photoUrl: '/assets/candidates/paslon-1.webp',
              voteCount: 810,
              percentage: 82.65,
            },
            {
              candidateId: 'cand-0',
              candidateNumber: 0,
              leaderName: 'Kotak Kosong',
              viceLeaderName: '',
              photoUrl: null,
              voteCount: 170,
              percentage: 17.35,
            },
          ],
        }),
      });
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/rekapitulasi');

    await expect(page.getByRole('heading', { name: 'Rekapitulasi Suara', exact: true })).toBeVisible();
    await expect(page.getByText('Paslon 01 Meraih Suara Terbanyak')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nehemia Pandu I. & Barret Fairuz A.', exact: true })
    ).toBeVisible();
    await expect(page.getByText('810 Suara')).toBeVisible();
    await expect(page.getByText('Kotak Kosong').first()).toBeVisible();
    await expect(page.getByText('Angkatan 2024')).toBeVisible();

    const overflowDesktop = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflowDesktop).toBe(false);
  });
});
