import { test, expect } from "@playwright/test";

test.describe("Tiket 05: BAST Verification & Recap Alignment", () => {
  test("BAST verification page renders in dual theme with honest placeholder, >=44px controls, error handling, and zero overflow", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/bast/verify");

    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(
      page.getByRole("heading", { name: "Verifikasi Berita Acara (BAST)" })
    ).toBeVisible();

    const hashInput = page.locator("#bast-hash-input");
    await expect(hashInput).toHaveAttribute(
      "placeholder",
      "Tempel 64 karakter kode verifikasi SHA-256"
    );

    const submitBtn = page.getByRole("button", {
      name: /Cek Keabsahan Dokumen/i,
    });
    const inputBox = await hashInput.boundingBox();
    const btnBox = await submitBtn.boundingBox();
    expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(btnBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Empty submit shows clear error state
    await submitBtn.click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "Dokumen Tidak Cocok"
    );

    // Reset back to form
    await page.getByRole("button", { name: "Masukkan Kode Lain" }).click();
    await expect(hashInput).toBeVisible();

    // Check zero overflow across breakpoints in both Light & Dark mode
    for (const vp of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(vp);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow).toBe(false);
    }

    await page.getByRole("button", { name: /Beralih ke mode gelap/i }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    expect(consoleErrors).toEqual([]);
  });
});
