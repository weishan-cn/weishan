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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaQaFreezeGate.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaQaFreezeGate;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingPublicBetaQaFreezeGate({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    publicBetaQaOperationsViewModelSummary:summary("Public Beta QA Operations View Model"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.allowedNextActions.join("|"), "continue_testing|manual_review_required");
  assert.equal(ready.rows.some((item) => item.label === "Frozen Scope"), true);
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaQaFreezeGate({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    publicBetaQaOperationsViewModelSummary:summary("Public Beta QA Operations View Model")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaQaFreezeGate({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    publicBetaQaOperationsViewModelSummary:summary("Public Beta QA Operations View Model"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(blocked).includes("token"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE PASS");
}

main();
