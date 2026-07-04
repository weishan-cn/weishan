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

function summary(title, status, extra) {
  return Object.assign({
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 已准备"), status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFreezeEvidenceSummary.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFreezeEvidenceSummary;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_VERSION, "4.2.1");

  const ready = api.buildGlobalShoppingPublicBetaFreezeEvidenceSummary({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required"),
    publicBetaFreezeReviewViewModelSummary:summary("Public Beta Freeze Review View Model"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Public Beta Freeze Evidence Summary");
  assert.equal(ready.rows.some((item) => item.label === "Freeze Evidence"), true);
  assert.equal(ready.bookingUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaFreezeEvidenceSummary({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    publicBetaFreezeReviewViewModelSummary:summary("Public Beta Freeze Review View Model"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaFreezeEvidenceSummary({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required"),
    publicBetaFreezeReviewViewModelSummary:summary("Public Beta Freeze Review View Model"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY PASS");
}

main();
