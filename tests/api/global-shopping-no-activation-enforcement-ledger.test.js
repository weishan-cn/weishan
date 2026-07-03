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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoActivationEnforcementLedger.js"]);
  const api = windowRef.WeishanGlobalShoppingNoActivationEnforcementLedger;
  assert.equal(api.GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_VERSION, "4.1.2");
  const ready = api.buildGlobalShoppingNoActivationEnforcementLedger({
    ledgerMode:"offline_mock",
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    safetySentinelSummary:readySummary("Safety Regression Sentinel", "Safety Regression Sentinel 已准备")
  });
  assert.equal(ready.ledgerName, "global_shopping_no_activation_enforcement_ledger_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.ledgerMode, "offline_mock");
  assert.equal(ready.userFacingSummary.title, "No-Activation Enforcement Ledger");
  assert.equal(ready.enforcementSummary.readyForFinalUserTrustSummary, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.safety.order, false);
  assert.equal(ready.rows.some((row) => row.label === "Offline Distribution Readiness Center"), true);
  const needsReview = api.buildGlobalShoppingNoActivationEnforcementLedger({});
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.enforcementSummary.needsReviewEntryCount > 0, true);
  const blocked = api.buildGlobalShoppingNoActivationEnforcementLedger({
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    safetySentinelSummary:readySummary("Safety Regression Sentinel", "Safety Regression Sentinel 已准备"),
    executeRealBlock:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("real_block_execution_detected"), true);
  const json = JSON.stringify(api.buildGlobalShoppingNoActivationEnforcementLedger({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER PASS");
}

main();
