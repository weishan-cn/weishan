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
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoLaunchAssuranceGate.js"]);
  const api = windowRef.WeishanGlobalShoppingNoLaunchAssuranceGate;
  assert.equal(api.GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingNoLaunchAssuranceGate({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.noLaunch, true);
  assert.equal(ready.noReleaseMutation, true);
  assert.equal(ready.noPush, true);
  assert.equal(ready.noProvider, true);
  assert.equal(ready.noNetwork, true);
  assert.equal(ready.noExternalOpen, true);
  assert.equal(ready.noTransaction, true);
  assert.equal(ready.manualReviewRequired, true);

  const blocked = api.buildGlobalShoppingNoLaunchAssuranceGate({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    push:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE PASS");
}

main();
