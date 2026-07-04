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
  const api = load("apps/desktop/src/renderer/core/globalShoppingOfflineProviderReadinessDecisionMatrix.js").WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingOfflineProviderReadinessDecisionMatrix({
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Offline Provider Readiness Decision Matrix");
  assert.equal(api.buildGlobalShoppingOfflineProviderReadinessDecisionMatrix({ finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingOfflineProviderReadinessDecisionMatrix({ push:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX PASS");
}

main();
