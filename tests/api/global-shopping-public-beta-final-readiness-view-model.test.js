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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalReadinessViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalReadinessViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingPublicBetaFinalReadinessViewModel({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "blocked", { blockerMatrixStatus:"blocked" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" })
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualFinalReadinessReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Launch Blockers"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaFinalReadinessViewModel({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "needs_review", { finalReadinessStatus:"needs_review" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "blocked", { blockerMatrixStatus:"blocked" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" })
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualFinalReadinessReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaFinalReadinessViewModel({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "blocked", { finalReadinessStatus:"blocked" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "blocked", { blockerMatrixStatus:"blocked" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" })
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL PASS");
}

main();
