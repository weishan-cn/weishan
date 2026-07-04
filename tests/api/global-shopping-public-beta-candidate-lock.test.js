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
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateLock.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaCandidateLock;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION, "4.2.5");

  const good = api.buildGlobalShoppingPublicBetaCandidateLock({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    publicBetaFinalReadinessViewModelSummary:summary("Public Beta Final Readiness ViewModel", "ready"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate", "ready"),
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(good.appVersion, "4.2.5");
  assert.equal(good.candidateLockStatus, "manual_review_required");
  assert.equal(good.manualReviewRequired, true);
  assert.equal(good.lockedCapabilities.includes("provider"), true);
  assert.equal(good.lockedCapabilities.includes("launch"), true);
  assert.deepEqual(Array.from(good.allowedNextActions || []), ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"]);
  assert.equal(good.externalUrl, null);
  assert.equal(good.paymentUrl, null);
  assert.equal(good.buyButtonEnabled, false);

  const review = api.buildGlobalShoppingPublicBetaCandidateLock({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "needs_review", { finalReadinessStatus:"needs_review" })
  });
  assert.equal(review.candidateLockStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaCandidateLock({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    publicBetaFinalReadinessViewModelSummary:summary("Public Beta Final Readiness ViewModel", "ready"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate", "ready"),
    provider:true
  });
  assert.equal(blocked.candidateLockStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("provider"), true);
  assert.equal(blocked.blockedNextActions.includes("production_ready"), true);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK PASS");
}

main();
