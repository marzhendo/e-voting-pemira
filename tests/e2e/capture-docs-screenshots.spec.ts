import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const DOCS_DIR = path.join(process.cwd(), "docs", "screenshots");

async function saveScreenshot(
  page: Page,
  filename: string,
  fullPage: boolean = true
) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const targetPath = path.join(DOCS_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage });
  console.log(`Saved screenshot: ${filename}`);
}

test.describe("Documentation Screenshot Captures (Full Overhauled UI)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Capture all admin tabs and active voter booth/modals/receipt freshly", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    // 1. Login sebagai Ketua Panitia KPR di offline dev-store & tangkap semua tab Admin Dashboard
    await page.goto("/login?dev=true");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Mode Uji Coba Cepat/i }).click();
    await page.getByRole("button", { name: /Ketua Panitia KPR/i }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const adminTabs: Array<{ buttonName: RegExp | string; file: string }> = [
      { buttonName: "Kelola Pasangan Calon", file: "07-admin-dashboard-candidates.png" },
      { buttonName: "Manajemen DPT", file: "08-admin-dashboard-dpt.png" },
      { buttonName: "Rekapitulasi Suara", file: "09-admin-dashboard-tally.png" },
      { buttonName: "Pengaturan Pemilihan", file: "10-admin-dashboard-settings.png" },
      { buttonName: "Broadcast Email", file: "12-admin-dashboard-broadcast-email.png" },
    ];

    for (const tab of adminTabs) {
      const btn = page.getByRole("button", { name: tab.buttonName }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(450);
        await saveScreenshot(page, tab.file, true);
      }
    }

    // 2. Buka jendela jadwal pemilihan sementara di offline dev-store agar Bilik Suara aktif
    const now = Date.now();
    const startIso = new Date(now - 60 * 60 * 1000).toISOString();
    const endIso = new Date(now + 4 * 60 * 60 * 1000).toISOString();
    await page.evaluate(
      async ({ start_time, end_time }) => {
        await fetch("/api/admin/election-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_voting_open: true,
            maintenance_mode: false,
            start_time,
            end_time,
          }),
        });
      },
      { start_time: startIso, end_time: endIso }
    );

    // 3. Login sebagai pemilih simulasi aktif (Ahmad Rizky Pratama)
    await page.goto("/login?dev=true");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Mode Uji Coba Cepat/i }).click();
    await page.getByRole("button", { name: /Ahmad Rizky Pratama/i }).click();
    await expect(page).toHaveURL(/\/vote/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Surat Suara Pemilihan");
    await page.waitForTimeout(400);

    // 03. Bilik Suara Digital (Mode Terang Aktif)
    await saveScreenshot(page, "03-voting-chamber.png", true);

    // 13. Modal Detail Visi Misi & CV Paslon
    await page
      .getByRole("button", { name: /Detail Visi Misi & CV Paslon/i })
      .first()
      .click();
    await expect(page.locator("#candidate-detail-title")).toBeVisible();
    await page.waitForTimeout(300);
    await saveScreenshot(page, "13-candidate-detail-modal.png", false);

    // Tutup modal detail & pilih Paslon 01
    await page.keyboard.press("Escape");
    await expect(page.locator("#candidate-detail-title")).toBeHidden();
    await page.getByRole("button", { name: "Pilih Paslon 01" }).click();

    // 04. Modal Konfirmasi Pilihan
    const confirmBtn = page.getByRole("button", { name: "Konfirmasi Pilihan" });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await expect(
      page.getByRole("heading", { name: "Konfirmasi Pilihan" })
    ).toBeVisible();
    await page.waitForTimeout(300);
    await saveScreenshot(page, "04-voting-confirmation-modal.png", false);

    // 05. Kirim suara -> Tanda Terima Pemilihan
    await page.getByRole("button", { name: "Kunci Suara" }).click();
    await expect(page).toHaveURL(/\/receipt/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Tanda Terima Pemilihan" })
    ).toBeVisible();
    await page.waitForTimeout(400);
    await saveScreenshot(page, "05-digital-receipt.png", true);
  });
});
