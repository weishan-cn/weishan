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
    rawUserTextStored:false,
    rawResponseStored:false,
    secretStored:false,
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingNoActivationComplianceSeal.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingNoActivationComplianceSeal;
  assert.equal(api.GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL_VERSION, "4.2.3");
  const ready = api.buildGlobalShoppingNoActivationComplianceSeal({
    sealMode:"readonly",
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter Security Regression Guard 已准备"),
    safetySentinelSummary:readySummary("Safety Regression Sentinel", "Safety Regression Sentinel 已准备")
  });
  assert.equal(ready.sealName, "global_shopping_no_activation_compliance_seal_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.sealMode, "readonly");
  assert.equal(ready.complianceSummary.readyForFinalReadinessHandoffSimulator, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.rows.some((row) => row.label === "Provider Activation Blocker Sentinel"), true);

  const needsReview = api.buildGlobalShoppingNoActivationComplianceSeal({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingNoActivationComplianceSeal({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter Security Regression Guard 已准备"),
    safetySentinelSummary:readySummary("Safety Regression Sentinel", "Safety Regression Sentinel 已准备"),
    createProviderClient:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("provider_client_detected"), true);

  const json = JSON.stringify(api.buildGlobalShoppingNoActivationComplianceSeal({ apiKey:"abc", paymentUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_NO_ACTIVATION_COMPLIANCE_SEAL PASS");
}

main();
