import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: process.env.AUDIT_ARTIFACTS || "../evidence/final-browser-artifacts",
  workers: 1,
  timeout: 45000,
  use: { baseURL: process.env.AUDIT_URL || "http://127.0.0.1:8765", trace: "retain-on-failure" },
  reporter: [["list"], ["json", { outputFile: process.env.AUDIT_REPORT || "../evidence/browser-tests.json" }]],
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "msedge", use: { browserName: "chromium", channel: "msedge" } },
  ],
});
