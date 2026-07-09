import { test, expect } from "@playwright/test";

test.describe("gate eligibility", () => {
  test("continue stays disabled until both acknowledgements are checked", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeDisabled();

    await page.getByRole("checkbox", { name: /adult aged 18/i }).click();
    await expect(continueButton).toBeDisabled();

    await page.getByRole("checkbox", { name: /confirmatory/i }).click();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await expect(page).toHaveURL(/\/clinical$/, { timeout: 15_000 });
  });

  for (const path of ["/clinical", "/cxr", "/cxr/result"]) {
    test(`direct navigation to ${path} redirects to gate when incomplete`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    });
  }
});
