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
  return window.WeishanGlobalShoppingPublicBetaOperatorConsole;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:title, label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaOperatorConsole.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION, "4.1.7");
  const ready = api.buildGlobalShoppingPublicBetaOperatorConsole({
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero 状态通过"),
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据通过"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化通过"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点通过"),
    publicBetaUserJourneyShellSummary:readySummary("Public Beta User Journey", "Public Beta User Journey 已准备"),
    safeSearchIntentMatrixSummary:readySummary("Safe Search Intent Matrix", "Safe Search Intent Matrix 已准备"),
    publicBetaUserBoundaryPanelSummary:readySummary("User Boundary Panel", "User Boundary Panel 已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备"),
    readOnlyComparisonBoardSummary:readySummary("Read-Only Comparison Board", "Read-Only Comparison Board 已准备"),
    resultTrustBadgePanelSummary:readySummary("Result Trust Badge", "Result Trust Badge 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingPublicBetaOperatorConsole({
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaOperatorConsole({
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero 状态通过"),
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据通过"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化通过"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点通过"),
    publicBetaUserJourneyShellSummary:readySummary("Public Beta User Journey", "Public Beta User Journey 已准备"),
    safeSearchIntentMatrixSummary:readySummary("Safe Search Intent Matrix", "Safe Search Intent Matrix 已准备"),
    publicBetaUserBoundaryPanelSummary:readySummary("User Boundary Panel", "User Boundary Panel 已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备"),
    readOnlyComparisonBoardSummary:readySummary("Read-Only Comparison Board", "Read-Only Comparison Board 已准备"),
    resultTrustBadgePanelSummary:readySummary("Result Trust Badge", "Result Trust Badge 已准备"),
    push:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE PASS");
}

main();
