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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialEvidenceLedger.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaTrialEvidenceLedger;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_VERSION, "4.1.5");

  const ready = api.buildGlobalShoppingPublicBetaTrialEvidenceLedger({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot"),
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.rows.some((item) => item.label === "QA Evidence"), true);
  assert.equal(ready.sections.some((item) => item.label === "Manual Review Items"), true);
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaTrialEvidenceLedger({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaTrialEvidenceLedger({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    publicBetaRcEvidenceSnapshotSummary:summary("RC Evidence Snapshot"),
    export:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER PASS");
}

main();
