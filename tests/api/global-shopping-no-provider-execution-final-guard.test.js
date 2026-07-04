const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function readySummary(title, resultLabel) {
  return {
    status:"ready",
    title,
    userFacingSummary:{ title, resultLabel, redacted:true },
    rows:[{ rowId:title.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label:title, value:resultLabel, status:"pass", redacted:true }],
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    payment:false,
    order:false,
    ticketing:false,
    autoOpen:false,
    autoRefresh:false,
    fileWrite:false,
    download:false,
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoProviderExecutionFinalGuard.js"]);
  const api = windowRef.WeishanGlobalShoppingNoProviderExecutionFinalGuard;
  assert.equal(api.GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_VERSION, "4.2.0");
  const ready = api.buildGlobalShoppingNoProviderExecutionFinalGuard({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    safetySentinelSummary:{ status:"pass", title:"Safety Sentinel", userFacingSummary:{ title:"Safety Sentinel", resultLabel:"Safety Sentinel 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.guardName, "global_shopping_no_provider_execution_final_guard_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.guardSummary.readyForUserVisibleSafetyBoundaryExplainer, true);
  assert.equal(ready.userFacingSummary.resultLabel, "No-Provider-Execution Final Guard 已准备");
  const needsReview = api.buildGlobalShoppingNoProviderExecutionFinalGuard({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.guardSummary.readyForUserVisibleSafetyBoundaryExplainer, false);
  const blocked = api.buildGlobalShoppingNoProviderExecutionFinalGuard({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("open_external_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingNoProviderExecutionFinalGuardAuditDraft({ token:"abc", paymentUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD PASS");
}

main();
