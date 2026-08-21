import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_FULL_STACK !== "true", "Requires the local Keycloak stack");

test("learner can review and save an AI deck draft", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel(/username or email/i).fill("demo");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("local-demo-only");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.route("**/api/ai/decks/generate", async route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ title: "Berlin apartment", category: "Housing", cards: [{ german: "die Kaution", english: "deposit", description: "Money held as security.", preterite: null, perfect: null }] }),
  }));
  await page.route("**/api/ai/decks/import", async route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ added: 1, skipped: 0 }),
  }));
  await page.route("**/api/ai/decks/generate-from-pdf", async route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ title: "Course notes", category: "Lesson notes", cards: [{ german: "die Prüfung", english: "exam", description: null, preterite: null, perfect: null }] }),
  }));

  await page.goto("/ai");
  await page.getByLabel("Topic or situation").fill("Renting an apartment in Berlin");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name: "Berlin apartment" })).toBeVisible();
  await page.getByLabel("English").fill("security deposit");
  await page.getByRole("button", { name: "Save to My words" }).click();
  await expect(page.getByRole("status")).toHaveText("1 cards saved · 0 duplicates skipped.");

  await page.getByLabel("PDF document").setInputFiles({
    name: "lesson-notes.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7 local test"),
  });
  await page.getByRole("button", { name: "Create draft from PDF" }).click();
  await expect(page.getByRole("heading", { name: "Course notes" })).toBeVisible();
});
