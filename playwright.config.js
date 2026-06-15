const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  retries: 0,
  workers: 1,
  outputDir: "/private/tmp/weishan-playwright-results",
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure"
  }
});
