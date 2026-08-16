import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL_STACK !== "true",
  "Requires the local Keycloak stack",
);

test("learner can review learning data settings", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel(/username or email/i).fill("demo");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("local-demo-only");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("link", { name: "Learning data settings" }).click();

  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page.getByRole("heading", { name: /your learning data/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Reset unseen history", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Reset learning progress", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Reset all progress", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review reset" })).toHaveCount(3);

  const resetRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/progress/reset")) {
      resetRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: "Review reset" }).last().click();
  const dialog = page.getByRole("dialog", { name: "Reset all progress?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/cannot be undone/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Keep my data" }).click();

  await expect(dialog).toBeHidden();
  expect(resetRequests).toHaveLength(0);
});
