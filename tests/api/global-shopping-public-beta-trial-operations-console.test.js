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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialOperationsConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaTrialOperationsConsole;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingPublicBetaTrialOperationsConsole({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot"),
    publicBetaManualQaViewModelSummary:summary("Public Beta Manual QA View Model"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.operationsStatus, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.nextManualAction, "manual_review_required");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaTrialOperationsConsole({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.nextManualAction, "continue_testing");

  const blocked = api.buildGlobalShoppingPublicBetaTrialOperationsConsole({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot"),
    publicBetaManualQaViewModelSummary:summary("Public Beta Manual QA View Model"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.nextManualAction, "blocked");

  const autoPublishBlocked = api.buildGlobalShoppingPublicBetaTrialOperationsConsole({
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot"),
    publicBetaManualQaViewModelSummary:summary("Public Beta Manual QA View Model"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    title:"production_ready"
  });
  assert.equal(autoPublishBlocked.status, "blocked");
  assert.equal(JSON.stringify(autoPublishBlocked).includes("token"), false);

  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE PASS");
}

main();
