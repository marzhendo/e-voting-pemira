import { test, expect } from "@playwright/test";

test.describe("Tiket 01: Design System, Typography & Dual Theme", () => {
  test("defaults to Light Mode, switches to Dark Mode, and persists across reload and navigation", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");

    // Default theme must be Light Mode (no .dark class on html)
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Verify Plus Jakarta Sans is applied on body
    const bodyFont = await page.evaluate(() =>
      window.getComputedStyle(document.body).fontFamily
    );
    expect(bodyFont.toLowerCase()).toContain("jakarta");

    // Toggle to Dark Mode
    const toggleBtn = page.getByRole("button", {
      name: /Beralih ke mode gelap/i,
    });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Reload and confirm persistence without resetting to light
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    // Navigate to /login and confirm theme stays dark
    await page.goto("/login");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    // Go back to / and toggle back to Light Mode
    await page.goto("/");
    const toLightBtn = page.getByRole("button", {
      name: /Beralih ke mode terang/i,
    });
    await toLightBtn.click();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    expect(consoleErrors).toEqual([]);
  });

  test("shared header and mobile navigation have real destinations, >=44px tap targets, and zero horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Zero horizontal overflow at 390px
    const overflow390 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow390).toBe(false);

    // Labeled mobile menu button opens nav drawer
    const menuBtn = page.getByRole("button", { name: /Buka menu navigasi/i });
    await expect(menuBtn).toBeVisible();
    const menuBox = await menuBtn.boundingBox();
    expect(menuBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await menuBtn.click();
    const mobileNav = page.locator("#mobile-primary-nav");
    await expect(mobileNav).toBeVisible();

    const recapLink = mobileNav.getByRole("link", { name: "Rekapitulasi Suara" });
    const bastLink = mobileNav.getByRole("link", { name: "Verifikasi BAST" });
    await expect(recapLink).toBeVisible();
    await expect(bastLink).toBeVisible();

    const recapBox = await recapLink.boundingBox();
    expect(recapBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Escape closes mobile menu
    await page.keyboard.press("Escape");
    await expect(mobileNav).toBeHidden();

    // Also verify 320px has zero horizontal overflow
    await page.setViewportSize({ width: 320, height: 568 });
    const overflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow320).toBe(false);
  });
});
