import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL_STACK !== "true",
  "Requires the local API, database and Keycloak stack",
);

test("learner signs in, completes a deck and sees results", async ({
  page,
}) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel(/username or email/i).fill("demo");
  await page.getByLabel(/password/i).fill("local-demo-only");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText("Learning profile connected")).toBeVisible();
  await page.goto("/play");
  await page.getByRole("button", { name: /start deck/i }).click();
  for (let card = 0; card < 10; card++) {
    await page.getByRole("button", { name: /reveal/i }).click();
    await page.getByRole("button", { name: "Got it" }).click();
  }
  await expect(page.getByText("SESSION COMPLETE")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("games completed")).toBeVisible();
});
