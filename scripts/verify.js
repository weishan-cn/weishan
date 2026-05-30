#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const mode = process.argv[2] || "core";

function runStep(label, command, args) {
  console.log(`\n[verify] ${label}`);
  console.log(`[verify] $ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    const error = new Error(`${label} failed to start: ${result.error.message}`);
    error.step = label;
    throw error;
  }

  if (result.status !== 0) {
    const error = new Error(`${label} failed with exit code ${result.status}`);
    error.step = label;
    error.status = result.status;
    throw error;
  }
}

function cleanupPlaywrightArtifacts() {
  for (const dirname of ["playwright-report", "test-results"]) {
    const target = path.join(ROOT, dirname);
    try {
      fs.rmSync(target, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[verify] Could not clean ${dirname}: ${error.message}`);
    }
  }
}

function runCore() {
  runStep("Secret scan", "npm", ["run", "secrets:scan"]);
  runStep("Healthcheck", "npm", ["run", "healthcheck"]);
  runStep("API tests", "npm", ["run", "test:api"]);
  runStep("Project check", "npm", ["run", "check"]);
  runStep("Git diff check", "git", ["diff", "--check"]);
}

function runE2e() {
  try {
    runStep("E2E smoke", "npm", ["run", "test:e2e:smoke"]);
    runStep("E2E local workflows", "npm", ["run", "test:e2e:local"]);
    runStep("E2E security audit", "npm", ["run", "test:e2e:security"]);
    runStep("E2E repair center", "npm", ["run", "test:e2e:repair"]);
    runStep("E2E dispatch router", "npm", ["run", "test:e2e:dispatch"]);
    runStep("E2E cloud settings", "npm", ["run", "test:e2e:cloud"]);
  } finally {
    cleanupPlaywrightArtifacts();
  }
}

function main() {
  if (!["core", "e2e", "all"].includes(mode)) {
    console.error("[verify] Usage: node scripts/verify.js <core|e2e|all>");
    process.exit(2);
  }

  try {
    if (mode === "core") {
      runCore();
      console.log("\nVERIFY PASS");
      return;
    }

    if (mode === "e2e") {
      runE2e();
      console.log("\nVERIFY_E2E PASS");
      return;
    }

    runCore();
    runE2e();
    console.log("\nVERIFY_ALL PASS");
  } catch (error) {
    console.error(`\n[verify] FAILED: ${error.message}`);
    if (error.step) {
      console.error(`[verify] Failed step: ${error.step}`);
    }
    process.exit(error.status || 1);
  }
}

main();
