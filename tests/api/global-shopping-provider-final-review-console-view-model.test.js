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
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderFinalReviewConsoleViewModel.js").WeishanGlobalShoppingProviderFinalReviewConsoleViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_VERSION, "4.2.8");
  const ready = api.buildGlobalShoppingProviderFinalReviewConsoleViewModel({
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    offlineProviderReadinessDecisionMatrixSummary:readySummary("Offline Provider Readiness Decision Matrix", "Offline Provider Readiness Decision Matrix 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Final Review Console");
  assert.equal(ready.safeToProceedWithFinalOfflineProviderReview, true);
  assert.equal(api.buildGlobalShoppingProviderFinalReviewConsoleViewModel({ finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderFinalReviewConsoleViewModel({ finalOfflineLaunchReviewConsoleSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Final Offline Launch Review Console", value:"已阻断", status:"blocked", redacted:true }], redacted:true } }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL PASS");
}

main();
