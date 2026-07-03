const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function summary(title) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel:title + " 已准备", redacted:true }, rows:[{ rowId:title, label:title, value:title + " 已准备", status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingCategoryResultSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyComparisonBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingResultTrustBadgePanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialReadinessPack.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaTrialReadinessPack;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION, "4.1.6");
  const ready = api.buildGlobalShoppingPublicBetaTrialReadinessPack({
    packMode:"trial_readiness_pack_only",
    publicBetaUserJourneyShellSummary:summary("Public Beta User Journey"),
    categoryResultSimulatorSummary:summary("Category Result Simulator"),
    readOnlyComparisonBoardSummary:summary("Read-Only Comparison Board"),
    resultTrustBadgePanelSummary:summary("Result Trust Badge"),
    publicBetaOperatorConsoleSummary:summary("Public Beta Operator Console"),
    finalOfflineBetaAuditSummary:summary("Final Offline Beta Audit")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.6");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(JSON.stringify(ready.supportedCategories), JSON.stringify(["flight", "hotel", "product"]));
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingPublicBetaTrialReadinessPack({
    publicBetaUserJourneyShellSummary:summary("Public Beta User Journey")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaTrialReadinessPack({
    publicBetaUserJourneyShellSummary:summary("Public Beta User Journey"),
    categoryResultSimulatorSummary:summary("Category Result Simulator"),
    readOnlyComparisonBoardSummary:summary("Read-Only Comparison Board"),
    resultTrustBadgePanelSummary:summary("Result Trust Badge"),
    publicBetaOperatorConsoleSummary:summary("Public Beta Operator Console"),
    finalOfflineBetaAuditSummary:summary("Final Offline Beta Audit"),
    push:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK PASS");
}

main();
