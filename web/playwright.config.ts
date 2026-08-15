import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3100",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
          AUTH_TRUST_HOST: "true",
          AUTH_SECRET: "browser-test-only-secret-value",
          AUTH_KEYCLOAK_ID: "woertersee-web",
          AUTH_KEYCLOAK_SECRET: "local-development-only",
          AUTH_KEYCLOAK_ISSUER: "http://127.0.0.1:8081/realms/woertersee",
        },
      },
});
