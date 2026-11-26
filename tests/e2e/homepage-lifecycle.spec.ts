import { test, expect } from "@playwright/test";

test.describe("Tiket 02: Lifecycle-Aware Homepage & Public Status", () => {
  test("renders institutional hero, official Chairman & Vice Chairman title, status card, and 3 guarantees without console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");

    await expect(page.locator("h1")).toContainText(
      "Pemilihan Raya HMIF Telkom University Purwokerto"
    );
    await expect(page.locator("body")).toContainText(
      "Chairman & Vice Chairman HMIF"
    );

    // Status card is visible and exposes real election status
    const statusCard = page.locator('aside[aria-label="Status resmi pemilihan"]');
    await expect(statusCard).toBeVisible();
    await expect(statusCard).toContainText("Status Pemilihan");

    // Guarantees section is visible
    await expect(
      page.getByRole("heading", { name: "Jaminan Penyelenggaraan Pemira" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Surat Suara Anonim" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Satu Mahasiswa Satu Suara" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Rekapitulasi & BAST Terverifikasi" })
    ).toBeVisible();

    // Primary and secondary CTAs in hero have real destinations
    const heroSection = page.locator('section[aria-labelledby="home-hero-heading"]');
    const heroLinks = heroSection.locator("a[href]");
    await expect(heroLinks).toHaveCount(2);

    const firstHref = await heroLinks.nth(0).getAttribute("href");
    const secondHref = await heroLinks.nth(1).getAttribute("href");
    expect(["/rekapitulasi", "/login"]).toContain(firstHref);
    expect(["/bast/verify", "/rekapitulasi"]).toContain(secondHref);

    expect(consoleErrors).toEqual([]);
  });

  test("maintains zero horizontal overflow across 320px, 390px, 768px, and 1440px in both Light and Dark mode", async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    await page.goto("/");

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      const overflowLight = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflowLight).toBe(false);
    }

    // Switch to Dark Mode and re-check all viewports
    await page.getByRole("button", { name: /Beralih ke mode gelap/i }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      const overflowDark = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflowDark).toBe(false);
    }
  });
});
