import { defineConfig } from "@playwright/test";

const auditUrl = process.env.AUDIT_URL || "http://127.0.0.1:8765";
const visitorUrl = process.env.VISITOR_URL || "http://127.0.0.1:8081";

export default defineConfig({
  testDir: "./tests",
  outputDir: process.env.AUDIT_ARTIFACTS || "../../evidence/final-browser-artifacts",
  workers: 1,
  timeout: 45000,
  use: { baseURL: auditUrl, trace: "retain-on-failure" },
  webServer: process.env.VISITOR_URL ? undefined : {
    command: "npm --prefix ../visitor run web -- --localhost",
    url: visitorUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { EXPO_PUBLIC_API_URL: auditUrl },
  },
  reporter: [["list"], ["json", { outputFile: process.env.AUDIT_REPORT || "../../evidence/browser-tests.json" }]],
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "msedge", use: { browserName: "chromium", channel: "msedge" } },
  ],
});
