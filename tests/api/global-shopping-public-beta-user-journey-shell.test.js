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
  return window.WeishanGlobalShoppingPublicBetaUserJourneyShell;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaUserJourneyShell.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION, "4.1.6");
  const ready = api.buildGlobalShoppingPublicBetaUserJourneyShell({
    appVersion:"4.1.6",
    shellMode:"user_journey_only",
    userIntent:"全球购只读候选价整理",
    normalizedCategory:"flight",
    readonlySearchPlan:"只读搜索计划",
    candidateEvidenceStep:"候选价整理",
    feeNormalizationStep:"费用归一化步骤",
    officialAnchorStep:"官方价锚点步骤",
    userBoundaryStep:"用户边界确认",
    operatorConsoleSummary:{ status:"ready" },
    categoryExpansionShellSummary:{ status:"ready" },
    finalOfflineBetaAuditSummary:{ status:"ready" },
    publicBetaAcceptanceBoardSummary:{ status:"ready" }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(api.buildGlobalShoppingPublicBetaUserJourneyShell({
    appVersion:"4.1.6",
    shellMode:"user_journey_only",
    readonlySearchPlan:"只读搜索计划"
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaUserJourneyShell({
    appVersion:"4.1.6",
    shellMode:"user_journey_only",
    provider:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL PASS");
}

main();
