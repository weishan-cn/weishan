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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaQaOperationsViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaQaOperationsViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingPublicBetaQaOperationsViewModel({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualQaOperationsReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Allowed Decisions"), true);
  assert.equal(ready.rows.some((item) => item.label === "Blocked Decisions"), true);
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaQaOperationsViewModel({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualQaOperationsReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaQaOperationsViewModel({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger", "blocked"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL PASS");
}

main();
