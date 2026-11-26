import { test, expect } from "@playwright/test";

test.describe("Tiket 03: Login Page Overhaul & Domain Copy", () => {
  test("renders dual-theme login form with domain terms, official AD/ART title, honest placeholders, and >=44px controls", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/login");

    // Light mode default
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

    // Official AD/ART title & domain terms
    await expect(page.locator("body")).toContainText(
      "Chairman & Vice Chairman HMIF"
    );
    await expect(
      page.getByRole("heading", { name: "Masuk ke Bilik Suara Digital" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "Daftar Pemilih Tetap (DPT)"
    );
    await expect(page.getByLabel("NIM")).toBeVisible();
    await expect(page.getByLabel("Kata Sandi Pemilih")).toBeVisible();

    // Honest placeholders (no fake NIM or fake password)
    await expect(page.locator("input#identifier")).toHaveAttribute(
      "placeholder",
      "Masukkan NIM kamu"
    );
    await expect(page.locator("input#password")).toHaveAttribute(
      "placeholder",
      "Masukkan Kata Sandi Pemilih"
    );

    // Tap targets >= 44px
    const nimBox = await page.locator("input#identifier").boundingBox();
    const pwdBox = await page.locator("input#password").boundingBox();
    const submitBox = await page
      .getByRole("button", { name: "Masuk ke Bilik Suara" })
      .boundingBox();
    expect(nimBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(pwdBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Toggle password visibility works
    const togglePwdBtn = page.getByRole("button", {
      name: "Tampilkan kata sandi",
    });
    await togglePwdBtn.click();
    await expect(page.locator("input#password")).toHaveAttribute("type", "text");

    // Client-side validation shows clear alert on too-short input
    await page.locator("input#identifier").fill("12");
    await page.locator("input#password").fill("ab");
    await page.getByRole("button", { name: "Masuk ke Bilik Suara" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "Masukkan NIM yang valid."
    );

    // Dev drawer stays hidden on standard /login
    await expect(
      page.getByRole("button", { name: /Mode Uji Coba Cepat/i })
    ).toBeHidden();

    // Theme toggle switches cleanly to Dark Mode
    await page.getByRole("button", { name: /Beralih ke mode gelap/i }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    expect(consoleErrors).toEqual([]);
  });

  test("maintains zero horizontal overflow across 320px, 390px, 768px, and 1440px", async ({
    page,
  }) => {
    await page.goto("/login");

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
  });
});
