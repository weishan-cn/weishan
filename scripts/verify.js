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
  runStep("Global commerce standard", "npm", ["run", "standard:commerce"]);
  runStep("Secret scan", "npm", ["run", "secrets:scan"]);
  runStep("Version check", "npm", ["run", "version:check"]);
  runStep("Healthcheck", "npm", ["run", "healthcheck"]);
  runStep("API tests", "npm", ["run", "test:api"]);
  runStep("Multi-network product feed foundation", "node", ["tests/api/global-commerce-multi-network-product-feed-foundation.test.js"]);
  runStep("Product identity and variant matching", "node", ["tests/api/global-commerce-product-identity.test.js"]);
  runStep("Price freshness and evidence quality", "node", ["tests/api/global-commerce-price-freshness-evidence-quality.test.js"]);
  runStep("Product truth and exact handoff pipeline", "node", ["tests/api/global-commerce-product-truth-pipeline.test.js"]);
  runStep("Controlled source adapter product truth bridge", "node", ["tests/api/global-commerce-controlled-source-adapter-bridge.test.js"]);
  runStep("Real-price coverage sweep", "node", ["tests/api/global-commerce-real-price-coverage-sweep.test.js"]);
  runStep("Unified shopping and travel desktop flow", "node", ["tests/api/unified-desktop-flow-view-model.test.js"]);
  runStep("Global flight shopping evidence foundation", "node", ["tests/api/global-flight-shopping-evidence-foundation.test.js"]);
  runStep("Global travel price truth foundation", "node", ["tests/api/global-travel-price-truth-foundation.test.js"]);
  runStep("Global travel real source acquisition sweep", "node", ["tests/api/global-travel-real-source-acquisition-sweep.test.js"]);
  runStep("Amadeus self-service flight source adapter", "node", ["tests/api/amadeus-self-service-flight-source-adapter.test.js"]);
  runStep("Duffel test flight source adapter", "node", ["tests/api/duffel-test-flight-source-adapter.test.js"]);
  runStep("Travel exact handoff semantics", "node", ["tests/api/travel-exact-handoff-semantics.test.js"]);
  runStep("Travel zero-learning UX view model", "node", ["tests/api/travel-zero-learning-ux-view-model.test.js"]);
  runStep("Public Beta release hardening gate", "node", ["tests/api/public-beta-release-hardening-gate.test.js"]);
  runStep("Traveltek cruise connect adapter", "node", ["tests/api/traveltek-cruise-connect-adapter.test.js"]);
  runStep("Cunard public cruise handoff adapter", "node", ["tests/api/cunard-public-cruise-handoff-adapter.test.js"]);
  runStep("Hotelbeds evaluation readonly validator", "node", ["tests/api/hotelbeds-evaluation-readonly-validator.test.js"]);
  runStep("Provider OAuth callback foundation", "node", ["tests/api/provider-oauth-callback-foundation.test.js"]);
  runStep("Commerce core tests", "npm", ["run", "test:commerce-core"]);
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
    runStep("E2E commerce agent", "npm", ["run", "test:e2e:commerce-agent"]);
    runStep("E2E desktop assistant", "npm", ["run", "test:e2e:desktop-assistant"]);
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
