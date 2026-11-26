import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/login", "/bast/verify"];
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

test.describe("Tiket 06: Full Responsive, Keyboard, Copy & Dual-Theme Audit", () => {
  test("keyboard Tab reaches skip-link first and all public routes have zero em-dashes and zero console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);

      // First Tab should focus skip-to-content link
      await page.keyboard.press("Tab");
      const activeText = await page.evaluate(
        () => document.activeElement?.textContent?.trim() || ""
      );
      expect(activeText).toBe("Langsung ke konten utama");

      // Single H1 per page
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);

      // Zero em dashes in rendered body copy
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toContain("—");
    }

    expect(consoleErrors).toEqual([]);
  });

  test("all public routes have zero horizontal overflow across 320px-1440px in Light and Dark mode", async ({
    page,
  }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);

      // Light mode
      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        expect(overflow, `${route} Light @ ${vp.width}px`).toBe(false);
      }

      // Dark mode
      await page.setViewportSize({ width: 1440, height: 900 });
      const toDark = page.getByRole("button", { name: /Beralih ke mode gelap/i });
      if (await toDark.isVisible()) {
        await toDark.click();
      }
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);

      for (const vp of VIEWPORTS) {
        await page.setViewportSize(vp);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        expect(overflow, `${route} Dark @ ${vp.width}px`).toBe(false);
      }

      // Reset to Light mode
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.getByRole("button", { name: /Beralih ke mode terang/i }).click();
    }
  });
});
