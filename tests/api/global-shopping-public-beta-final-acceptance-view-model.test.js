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
    status:status || "manual_review_required",
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalAcceptanceViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalAcceptanceViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_VERSION, "4.2.6");

  const ready = api.buildGlobalShoppingPublicBetaFinalAcceptanceViewModel({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock", "manual_review_required"),
    offlineReleaseCandidateAuditSummary:summary("Offline Release Candidate Audit", "manual_review_required"),
    zeroActionSafetyConsoleSummary:summary("Zero-Action Safety Console", "manual_review_required")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualFinalAcceptanceReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Zero Action Safety"), true);
  assert.equal(ready.feedbackSubmitEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaFinalAcceptanceViewModel({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock", "needs_review")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaFinalAcceptanceViewModel({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock", "blocked"),
    offlineReleaseCandidateAuditSummary:summary("Offline Release Candidate Audit", "manual_review_required"),
    zeroActionSafetyConsoleSummary:summary("Zero-Action Safety Console", "manual_review_required")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.paymentUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL PASS");
}

main();
