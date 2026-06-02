#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const steps = [
  { label: "Version consistency", command: "npm", args: ["run", "version:check"] },
  { label: "API tests", command: "npm", args: ["test"] },
  { label: "Full test suite", command: "npm", args: ["run", "test:full"] },
  { label: "Local verify", command: "npm", args: ["run", "verify"] },
  { label: "Healthcheck", command: "npm", args: ["run", "healthcheck"] },
  { label: "Git diff check", command: "git", args: ["diff", "--check"] }
];

function printHeader(step) {
  console.log("\n============================================================");
  console.log(`[release-check] ${step.label}`);
  console.log(`[release-check] $ ${[step.command, ...step.args].join(" ")}`);
  console.log("============================================================");
}

function runStep(step) {
  printHeader(step);
  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`[release-check] FAILED to start ${step.label}: ${result.error.message}`);
    return 1;
  }

  if (result.status !== 0) {
    console.error(`[release-check] FAILED ${step.label} with exit code ${result.status}`);
    return result.status || 1;
  }

  console.log(`[release-check] PASS ${step.label}`);
  return 0;
}

function main() {
  for (const step of steps) {
    const code = runStep(step);
    if (code !== 0) {
      console.log("\nRELEASE_CHECK FAIL");
      process.exitCode = 1;
      return;
    }
  }

  console.log("\nRELEASE_CHECK PASS");
}

main();
