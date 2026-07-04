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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaCandidateViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION, "4.2.0");

  const ready = api.buildGlobalShoppingPublicBetaCandidateViewModel({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" })
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualCandidateReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Candidate Scope"), true);
  assert.equal(ready.cards.some((item) => item.label === "Production Boundary"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaCandidateViewModel({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" })
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualCandidateReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaCandidateViewModel({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "blocked", { candidateLockStatus:"blocked" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" })
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL PASS");
}

main();
