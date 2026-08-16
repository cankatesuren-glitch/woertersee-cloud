import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL_STACK !== "true",
  "Requires the local Keycloak stack",
);

test("learner can open password recovery", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /forgot password/i }).click();

  await expect(page).toHaveURL(/\/login-actions\/reset-credentials/);
  await expect(
    page.getByRole("heading", { name: /forgot.*password/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /username or email/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();
});
