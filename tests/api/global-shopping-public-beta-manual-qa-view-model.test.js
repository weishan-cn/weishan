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

function summary(title, status) {
  return {
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaManualQaReportCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingTrialFeedbackSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcEvidenceSnapshot.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaManualQaViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaManualQaViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_VERSION, "4.1.4");

  const ready = api.buildGlobalShoppingPublicBetaManualQaViewModel({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualQaReview, true);
  assert.equal(ready.cards[0].label, "Public Beta Manual QA Report Center");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaManualQaViewModel({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaManualQaViewModel({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate", "blocked"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL PASS");
}

main();
