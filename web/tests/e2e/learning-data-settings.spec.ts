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

  const reminder = page.getByRole("region", { name: "Practice reminder" });
  await expect(reminder).toBeVisible();
  await reminder.getByLabel("Remind me to practice").check();
  await reminder.getByLabel("Reminder time").fill("19:30");
  await reminder.getByLabel("Time zone").fill("Europe/Vienna");
  const reminderResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/profile/practice-reminder") &&
      response.request().method() === "PUT",
  );
  await reminder.getByRole("button", { name: "Save reminder" }).click();
  expect((await reminderResponse).ok()).toBe(true);
  await expect(reminder.getByRole("status")).toHaveText("Practice reminder saved.");

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

test("learner can reset all progress with explicit confirmation", async ({
  page,
}) => {
  const suffix = Date.now();
  const password = "Local-e2e-password-42!";

  await page.goto("/signin");
  await page.getByRole("button", { name: "Create account" }).click();
  await page
    .getByRole("textbox", { name: "Username", exact: true })
    .fill(`reset-learner-${suffix}`);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(`reset-learner-${suffix}@example.invalid`);
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Reset");
  await page
    .getByRole("textbox", { name: "Last name", exact: true })
    .fill("Learner");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(password);
  await page
    .getByRole("textbox", { name: "Confirm password", exact: true })
    .fill(password);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.goto("/play");
  await page.getByRole("button", { name: /start deck/i }).click();
  await page.getByRole("button", { name: /reveal/i }).click();
  await page.getByRole("button", { name: "Got it" }).click();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Review reset" }).last().click();
  const dialog = page.getByRole("dialog", { name: "Reset all progress?" });
  const resetResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/progress/reset") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Confirm reset" }).click();

  expect((await resetResponse).ok()).toBe(true);
  await expect(page.getByRole("status")).toContainText(
    /Reset all progress completed\. [1-9]\d* records changed\./,
  );
});
