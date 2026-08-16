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

test("new learner completes registration and receives a profile", async ({
  page,
}) => {
  const suffix = Date.now();

  await page.goto("/signin");
  await page.getByRole("button", { name: "Create account" }).click();
  await page
    .getByRole("textbox", { name: "Username", exact: true })
    .fill(`learner-${suffix}`);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(`learner-${suffix}@example.invalid`);
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Browser");
  await page
    .getByRole("textbox", { name: "Last name", exact: true })
    .fill("Learner");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("Local-e2e-password-42!");
  await page
    .getByRole("textbox", { name: "Confirm password", exact: true })
    .fill("Local-e2e-password-42!");
  await page.getByRole("button", { name: "Register", exact: true }).click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole("heading", { name: "Browser Learner" })).toBeVisible();
  await expect(page.getByText("Learning profile connected")).toBeVisible();
});
