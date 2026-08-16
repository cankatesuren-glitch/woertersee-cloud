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
  for (const field of ["Username", "Email", "Password", "Confirm password"]) {
    await expect(
      page.getByRole("textbox", { name: field, exact: true }),
    ).toBeVisible();
  }
});
