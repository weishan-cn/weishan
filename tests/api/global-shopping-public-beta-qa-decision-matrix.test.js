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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaQaDecisionMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaQaDecisionMatrix;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_VERSION, "4.1.4");

  const ready = api.buildGlobalShoppingPublicBetaQaDecisionMatrix({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(ready.status, "ready");
  assert.equal(JSON.stringify(Array.from(ready.allowedDecisions)), JSON.stringify(["continue_testing", "manual_review_required"]));
  assert.equal(ready.rows.some((item) => item.label === "Blocked Decisions"), true);
  assert.equal(ready.rules.some((item) => item.label === "Manual Review Items"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaQaDecisionMatrix({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaQaDecisionMatrix({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    provider:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX PASS");
}

main();
