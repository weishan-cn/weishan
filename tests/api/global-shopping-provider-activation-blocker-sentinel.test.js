const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderActivationBlockerSentinel.js").WeishanGlobalShoppingProviderActivationBlockerSentinel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_VERSION, "3.3.0");
  const ready = api.buildGlobalShoppingProviderActivationBlockerSentinel({
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备"),
    adapterLaunchBoundaryVerifierSummary:readySummary("Adapter Launch Boundary Verifier", "Adapter Launch Boundary Verifier 已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter Policy Engine 已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter Security Regression Guard 已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Activation Blocker Sentinel");
  assert.equal(api.buildGlobalShoppingProviderActivationBlockerSentinel({ finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderActivationBlockerSentinel({ readApiKey:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL PASS");
}

main();
