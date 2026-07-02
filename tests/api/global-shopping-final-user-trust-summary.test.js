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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingFinalUserTrustSummary.js"]);
  const api = windowRef.WeishanGlobalShoppingFinalUserTrustSummary;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_VERSION, "4.0.4");
  const ready = api.buildGlobalShoppingFinalUserTrustSummary({
    summaryMode:"offline_mock",
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:readySummary("verify/e2e/build summary", "verify/e2e/build 已准备")
  });
  assert.equal(ready.summaryName, "global_shopping_final_user_trust_summary_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.summaryMode, "offline_mock");
  assert.equal(ready.userFacingSummary.title, "Final User Trust Summary");
  assert.equal(ready.trustSummary.readyForProviderSafetyDistributionMatrix, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.safety.order, false);
  assert.equal(ready.rows.some((row) => row.label === "Offline Distribution Readiness Center"), true);
  const needsReview = api.buildGlobalShoppingFinalUserTrustSummary({});
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.trustSummary.needsReviewSectionCount > 0, true);
  const blocked = api.buildGlobalShoppingFinalUserTrustSummary({
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:readySummary("verify/e2e/build summary", "verify/e2e/build 已准备"),
    persistUserText:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("raw_user_text_persistence_detected"), true);
  const json = JSON.stringify(api.buildGlobalShoppingFinalUserTrustSummary({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY PASS");
}

main();
