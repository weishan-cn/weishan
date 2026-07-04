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
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineTrialReleaseGate.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcEvidenceSnapshot.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingPublicBetaRcEvidenceSnapshot({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaRcEvidenceSnapshot({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaRcEvidenceSnapshot({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    export:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT PASS");
}

main();
