import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "*.spec.js",
  timeout: 45000,
  expect: { timeout: 8000 },
  use: {
    baseURL: "http://127.0.0.1:5175",
    viewport: { width: 375, height: 812 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/e2e/server.js",
      url: "http://127.0.0.1:3101/api/health",
      reuseExistingServer: false,
    },
    {
      command:
        "API_PROXY=http://127.0.0.1:3101 npx uni -p h5 --host 127.0.0.1 --port 5175",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
});
