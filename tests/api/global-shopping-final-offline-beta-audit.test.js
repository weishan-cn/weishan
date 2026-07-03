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
  return window.WeishanGlobalShoppingFinalOfflineBetaAudit;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:title, label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingFinalOfflineBetaAudit.js");
  assert.equal(api.GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT_VERSION, "4.0.5");
  const ready = api.buildGlobalShoppingFinalOfflineBetaAudit({
    publicBetaOperatorConsoleSummary:readySummary("Public Beta Operator Console", "Public Beta Operator Console 已准备"),
    categoryExpansionShellSummary:readySummary("Category Expansion Shell", "Flight / Hotel / Product 只读外壳已准备"),
    publicBetaUserJourneyShellSummary:readySummary("Public Beta User Journey", "Public Beta User Journey 已准备"),
    safeSearchIntentMatrixSummary:readySummary("Safe Search Intent Matrix", "Safe Search Intent Matrix 已准备"),
    publicBetaUserBoundaryPanelSummary:readySummary("User Boundary Panel", "User Boundary Panel 已准备"),
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "安全文案通过")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.noProvider, true);
  assert.equal(api.buildGlobalShoppingFinalOfflineBetaAudit({
    publicBetaOperatorConsoleSummary:readySummary("Public Beta Operator Console", "Public Beta Operator Console 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalOfflineBetaAudit({
    publicBetaOperatorConsoleSummary:readySummary("Public Beta Operator Console", "Public Beta Operator Console 已准备"),
    categoryExpansionShellSummary:readySummary("Category Expansion Shell", "Flight / Hotel / Product 只读外壳已准备"),
    publicBetaUserJourneyShellSummary:readySummary("Public Beta User Journey", "Public Beta User Journey 已准备"),
    safeSearchIntentMatrixSummary:readySummary("Safe Search Intent Matrix", "Safe Search Intent Matrix 已准备"),
    publicBetaUserBoundaryPanelSummary:readySummary("User Boundary Panel", "User Boundary Panel 已准备"),
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "安全文案通过"),
    noNetwork:false
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_FINAL_OFFLINE_BETA_AUDIT PASS");
}

main();
