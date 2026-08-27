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

function settleGuiLaunch(label) {
  runStep(label, process.execPath, ["-e", "setTimeout(() => {}, 5000)"]);
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
  runStep("E2E canonical runtime launch guard", "node", ["tests/api/e2e-canonical-runtime-launch-guard.test.js"]);
  runStep("Healthcheck", "npm", ["run", "healthcheck"]);
  runStep("Security core trust boundary effectiveness", "node", ["tests/api/security-core-trust-boundary-effectiveness.test.js"]);
  runStep("IPC core effectiveness", "node", ["tests/api/ipc-core-effectiveness.test.js"]);
  runStep("Credential module effectiveness", "node", ["tests/api/credential-module-effectiveness.test.js"]);
  runStep("AI connector main-side credential", "node", ["tests/api/ai-connector-main-side-credential.test.js"]);
  runStep("Provider/source management effectiveness", "node", ["tests/api/provider-source-management-effectiveness.test.js"]);
  runStep("Provider adapter normalization effectiveness", "node", ["tests/api/provider-adapter-normalization-effectiveness.test.js"]);
  runStep("Provider failure retry resilience effectiveness", "node", ["tests/api/provider-failure-retry-resilience-effectiveness.test.js"]);
  runStep("State cache persistence effectiveness", "node", ["tests/api/state-cache-persistence-effectiveness.test.js"]);
  runStep("Performance resource memory effectiveness", "node", ["tests/api/performance-resource-memory-effectiveness.test.js"]);
  runStep("Accessibility keyboard display effectiveness", "node", ["tests/api/accessibility-keyboard-display-effectiveness.test.js"]);
  runStep("Error empty recovery UX effectiveness", "node", ["tests/api/error-empty-recovery-ux-effectiveness.test.js"]);
  runStep("Onboarding first-run zero-learning effectiveness", "node", ["tests/api/onboarding-first-run-zero-learning-effectiveness.test.js"]);
  runStep("Anonymous product analytics effectiveness", "node", ["tests/api/anonymous-product-analytics-effectiveness.test.js"]);
  runStep("Settings preferences user control effectiveness", "node", ["tests/api/settings-preferences-user-control-effectiveness.test.js"]);
  runStep("API tests", "npm", ["run", "test:api"]);
  runStep("Multi-network product feed foundation", "node", ["tests/api/global-commerce-multi-network-product-feed-foundation.test.js"]);
  runStep("Product identity and variant matching", "node", ["tests/api/global-commerce-product-identity.test.js"]);
  runStep("Price freshness and evidence quality", "node", ["tests/api/global-commerce-price-freshness-evidence-quality.test.js"]);
  runStep("Product truth and exact handoff pipeline", "node", ["tests/api/global-commerce-product-truth-pipeline.test.js"]);
  runStep("Compare module effectiveness", "node", ["tests/api/compare-module-effectiveness.test.js"]);
  runStep("Recommend module effectiveness", "node", ["tests/api/recommend-module-effectiveness.test.js"]);
  runStep("Global shopping decision quality effectiveness", "node", ["tests/api/global-shopping-decision-quality-effectiveness.test.js"]);
  runStep("Global shopping basic AI mode effectiveness", "node", ["tests/api/global-shopping-basic-ai-mode-effectiveness.test.js"]);
  runStep("Travel basic AI mode effectiveness", "node", ["tests/api/travel-basic-ai-mode-effectiveness.test.js"]);
  runStep("Controlled source adapter product truth bridge", "node", ["tests/api/global-commerce-controlled-source-adapter-bridge.test.js"]);
  runStep("Real-price coverage sweep", "node", ["tests/api/global-commerce-real-price-coverage-sweep.test.js"]);
  runStep("Unified shopping and travel desktop flow", "node", ["tests/api/unified-desktop-flow-view-model.test.js"]);
  runStep("Home unified desktop effectiveness", "node", ["tests/api/home-unified-desktop-effectiveness.test.js"]);
  runStep("Search module effectiveness", "node", ["tests/api/search-module-effectiveness.test.js"]);
  runStep("Handoff module effectiveness", "node", ["tests/api/handoff-module-effectiveness.test.js"]);
  runStep("Global flight shopping evidence foundation", "node", ["tests/api/global-flight-shopping-evidence-foundation.test.js"]);
  runStep("Global travel price truth foundation", "node", ["tests/api/global-travel-price-truth-foundation.test.js"]);
  runStep("Global travel decision quality effectiveness", "node", ["tests/api/global-travel-decision-quality-effectiveness.test.js"]);
  runStep("Public Beta email operations control plane", "node", ["tests/api/email-ops-control-plane.test.js"]);
  runStep("Public Beta email operations module effectiveness", "node", ["tests/api/email-ops-module-effectiveness.test.js"]);
  runStep("Public Beta email operations real mailbox adapter", "node", ["tests/api/email-ops-real-mailbox-adapter.test.js"]);
  runStep("Mail Takeover user intelligence", "node", ["tests/api/mail-takeover-user-intelligence.test.js"]);
  runStep("Mail Takeover UX effectiveness", "node", ["tests/api/mail-takeover-ux-effectiveness.test.js"]);
  runStep("Mail Takeover adversarial trust", "node", ["tests/api/mail-takeover-adversarial-trust.test.js"]);
  runStep("Smart Mail authorization and AI gating effectiveness", "node", ["tests/api/smart-mail-auth-ai-gating-effectiveness.test.js"]);
  runStep("Smart Mail intelligence quality effectiveness", "node", ["tests/api/smart-mail-intelligence-quality-effectiveness.test.js"]);
  runStep("Plugin marketplace discovery effectiveness", "node", ["tests/api/plugin-marketplace-discovery-effectiveness.test.js"]);
  runStep("In-app Help Feedback Support effectiveness", "node", ["tests/api/in-app-help-feedback-support-effectiveness.test.js"]);
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
    runStep("E2E runtime identity", "npx", ["playwright", "test", "tests/e2e/runtime-identity.spec.js", "--workers=1"]);
    runStep("E2E desktop branding and navigation", "npx", ["playwright", "test", "tests/e2e/desktop-branding-nav.spec.js", "--workers=1"]);
    runStep("E2E smoke", "npm", ["run", "test:e2e:smoke"]);
    settleGuiLaunch("E2E GUI launch settle before local workflows");
    runStep("E2E local workflows", "npm", ["run", "test:e2e:local"]);
    settleGuiLaunch("E2E GUI launch settle before security audit");
    runStep("E2E security audit", "npm", ["run", "test:e2e:security"]);
    settleGuiLaunch("E2E GUI launch settle before repair center");
    runStep("E2E repair center", "npm", ["run", "test:e2e:repair"]);
    runStep("E2E dispatch router", "npm", ["run", "test:e2e:dispatch"]);
    runStep("E2E commerce agent", "npm", ["run", "test:e2e:commerce-agent"]);
    runStep("E2E Global Shopping Basic AI mode", "npx", ["playwright", "test", "tests/e2e/global-shopping-basic-ai-mode.spec.js", "--workers=1"]);
    runStep("E2E Travel Basic AI mode", "npx", ["playwright", "test", "tests/e2e/travel-basic-ai-mode.spec.js", "--workers=1"]);
    runStep("E2E Public Beta user journey", "npx", ["playwright", "test", "tests/e2e/public-beta-user-journey.spec.js", "--workers=1"]);
    runStep("E2E Desktop UI simplification", "npx", ["playwright", "test", "tests/e2e/desktop-ui-simplification.spec.js", "--workers=1"]);
    runStep("E2E desktop assistant", "npm", ["run", "test:e2e:desktop-assistant"]);
    runStep("E2E cloud settings", "npm", ["run", "test:e2e:cloud"]);
    runStep("E2E settings user control", "npx", ["playwright", "test", "tests/e2e/settings-user-control.spec.js", "--workers=1"]);
    runStep("E2E in-app Help Feedback Support", "npx", ["playwright", "test", "tests/e2e/help-feedback-support.spec.js", "--workers=1"]);
    runStep("E2E Smart Mail authorization and AI gating", "npx", ["playwright", "test", "tests/e2e/smart-mail-auth-ai-gating.spec.js", "--workers=1"]);
    runStep("E2E Plugin marketplace discovery", "npx", ["playwright", "test", "tests/e2e/plugin-marketplace-discovery.spec.js", "--workers=1"]);
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
