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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoProviderProductionBoundary.js"]);
  const api = windowRef.WeishanGlobalShoppingNoProviderProductionBoundary;
  assert.equal(api.GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION, "4.2.6");

  const good = api.buildGlobalShoppingNoProviderProductionBoundary({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate", "ready"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate", "ready"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready")
  });
  assert.equal(good.boundaryStatus, "manual_review_required");
  assert.equal(good.noProvider, true);
  assert.equal(good.noProductionProvider, true);
  assert.equal(good.noNetwork, true);
  assert.equal(good.noExternalOpen, true);
  assert.equal(good.noPayment, true);
  assert.equal(good.noOrder, true);
  assert.equal(good.noTicketing, true);
  assert.equal(good.noReleaseMutation, true);
  assert.equal(good.noPush, true);

  const blocked = api.buildGlobalShoppingNoProviderProductionBoundary({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate", "ready"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate", "ready"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready"),
    payment:true
  });
  assert.equal(blocked.boundaryStatus, "blocked");
  assert.equal(blocked.noPayment, false);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.paymentButtonEnabled, false);
  console.log("GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY PASS");
}

main();
