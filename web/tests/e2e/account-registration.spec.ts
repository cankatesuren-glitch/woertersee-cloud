import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL_STACK !== "true",
  "Requires the local Keycloak stack",
);

test("learner can open account registration", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/realms\/woertersee\//);
  await expect(page.getByRole("heading", { name: /register/i })).toBeVisible();
  await expect(page.getByLabel(/username/i)).toBeVisible();
  await expect(page.getByLabel(/^email$/i)).toBeVisible();
  await expect(page.getByLabel(/^password$/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
});
