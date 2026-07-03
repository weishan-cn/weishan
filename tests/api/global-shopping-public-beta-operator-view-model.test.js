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
  return window.WeishanGlobalShoppingPublicBetaOperatorViewModel;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:title, label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaOperatorViewModel.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingPublicBetaOperatorViewModel({
    publicBetaOperatorConsoleSummary:readySummary("Public Beta Operator Console", "Public Beta Operator Console 已准备"),
    categoryExpansionShellSummary:readySummary("Category Expansion Shell", "Flight / Hotel / Product 只读外壳已准备"),
    publicBetaUserJourneyShellSummary:readySummary("Public Beta User Journey", "Public Beta User Journey 已准备"),
    safeSearchIntentMatrixSummary:readySummary("Safe Search Intent Matrix", "Safe Search Intent Matrix 已准备"),
    publicBetaUserBoundaryPanelSummary:readySummary("User Boundary Panel", "User Boundary Panel 已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备"),
    readOnlyComparisonBoardSummary:readySummary("Read-Only Comparison Board", "Read-Only Comparison Board 已准备"),
    resultTrustBadgePanelSummary:readySummary("Result Trust Badge", "Result Trust Badge 已准备"),
    publicBetaTrialReadinessPackSummary:readySummary("Public Beta Trial Readiness Pack", "Public Beta Trial Readiness Pack 已准备"),
    finalManualAcceptanceConsoleSummary:readySummary("Final Manual Acceptance Console", "Final Manual Acceptance Console 已准备"),
    publicBetaFeedbackPlaceholderSummary:readySummary("Feedback Placeholder", "Feedback Placeholder 已准备"),
    publicBetaFinalManualViewModelSummary:readySummary("Public Beta Final Manual View Model", "Public Beta Final Manual View Model 已准备"),
    finalOfflineBetaAuditSummary:readySummary("Final Offline Beta Audit", "最终离线审计通过"),
    publicBetaAcceptanceBoardSummary:readySummary("Public Beta Acceptance Board", "Public Beta Acceptance Board 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.cards.length, 15);
  assert.equal(ready.safeToProceedWithManualPublicBetaAcceptanceReview, true);
  assert.equal(ready.safeToProceedWithManualTrialReview, true);
  assert.equal(ready.trialReadinessRows[0].label, "Public Beta Trial Readiness Pack");
  assert.equal(ready.manualAcceptanceRows[0].label, "Final Manual Acceptance Console");
  assert.equal(ready.feedbackPlaceholderRows[0].label, "Feedback Placeholder");
  assert.equal(api.buildGlobalShoppingPublicBetaOperatorViewModel({
    publicBetaOperatorConsoleSummary:readySummary("Public Beta Operator Console", "Public Beta Operator Console 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaOperatorViewModel({
    publicBetaOperatorConsoleSummary:{ status:"blocked", userFacingSummary:{ title:"Public Beta Operator Console", resultLabel:"blocked", redacted:true }, rows:[], redacted:true },
    categoryExpansionShellSummary:readySummary("Category Expansion Shell", "Flight / Hotel / Product 只读外壳已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备"),
    readOnlyComparisonBoardSummary:readySummary("Read-Only Comparison Board", "Read-Only Comparison Board 已准备"),
    resultTrustBadgePanelSummary:readySummary("Result Trust Badge", "Result Trust Badge 已准备"),
    publicBetaTrialReadinessPackSummary:readySummary("Public Beta Trial Readiness Pack", "Public Beta Trial Readiness Pack 已准备"),
    finalManualAcceptanceConsoleSummary:readySummary("Final Manual Acceptance Console", "Final Manual Acceptance Console 已准备"),
    publicBetaFeedbackPlaceholderSummary:readySummary("Feedback Placeholder", "Feedback Placeholder 已准备"),
    publicBetaFinalManualViewModelSummary:readySummary("Public Beta Final Manual View Model", "Public Beta Final Manual View Model 已准备"),
    finalOfflineBetaAuditSummary:readySummary("Final Offline Beta Audit", "最终离线审计通过"),
    publicBetaAcceptanceBoardSummary:readySummary("Public Beta Acceptance Board", "Public Beta Acceptance Board 已准备")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL PASS");
}

main();
