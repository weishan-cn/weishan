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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingOfflineProviderGovernanceClosureBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_VERSION, "4.0.6");
  const ready = api.buildGlobalShoppingOfflineProviderGovernanceClosureBoard({
    boardMode:"offline_mock",
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    offlineActivationWarRoomSummary:readySummary("Offline Activation War Room", "Offline Activation War Room 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerFinalSafetyViewModelSummary:readySummary("Provider Final Safety Review", "Provider Final Safety Review 已准备")
  });
  assert.equal(ready.boardName, "global_shopping_offline_provider_governance_closure_board_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.boardMode, "offline_mock");
  assert.equal(ready.userFacingSummary.title, "Offline Provider Governance Closure Board");
  assert.equal(ready.closureSummary.readyForNoActivationComplianceSeal, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.safety.order, false);
  assert.equal(ready.rows.some((row) => row.label === "Provider Final Safety Seal"), true);

  const needsReview = api.buildGlobalShoppingOfflineProviderGovernanceClosureBoard({
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.closureSummary.needsReviewPanelCount > 0, true);

  const blocked = api.buildGlobalShoppingOfflineProviderGovernanceClosureBoard({
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    offlineActivationWarRoomSummary:readySummary("Offline Activation War Room", "Offline Activation War Room 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerFinalSafetyViewModelSummary:readySummary("Provider Final Safety Review", "Provider Final Safety Review 已准备"),
    push:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("push_detected"), true);

  const json = JSON.stringify(api.buildGlobalShoppingOfflineProviderGovernanceClosureBoard({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD PASS");
}

main();
