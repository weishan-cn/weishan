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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineLaunchBlockerMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineLaunchBlockerMatrix;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION, "4.1.9");

  const matrix = api.buildGlobalShoppingOfflineLaunchBlockerMatrix({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate")
  });
  assert.equal(matrix.blockerMatrixStatus, "blocked");
  assert.equal(matrix.launchBlocked, true);
  assert.equal(matrix.releaseBlocked, true);
  assert.equal(matrix.providerBlocked, true);
  assert.equal(matrix.networkBlocked, true);
  assert.equal(matrix.externalOpenBlocked, true);
  assert.equal(matrix.transactionBlocked, true);
  assert.equal(matrix.paymentBlocked, true);
  assert.equal(matrix.orderBlocked, true);
  assert.equal(matrix.ticketingBlocked, true);
  assert.equal(matrix.manualReviewRequired, true);
  console.log("GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX PASS");
}

main();
