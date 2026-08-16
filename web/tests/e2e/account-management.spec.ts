import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL_STACK !== "true",
  "Requires the local Keycloak stack",
);

test("learner can open identity account management", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel(/username or email/i).fill("demo");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("local-demo-only");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("link", { name: "Manage password and profile" }).click();

  await expect(page).toHaveURL(/\/realms\/woertersee\/account/);
  await expect(page.getByText("Personal info", { exact: true })).toBeVisible();
});
