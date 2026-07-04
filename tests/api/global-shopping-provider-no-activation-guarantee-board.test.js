const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderNoActivationGuaranteeBoard.js").WeishanGlobalShoppingProviderNoActivationGuaranteeBoard;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD_VERSION, "4.2.3");
  const ready = api.buildGlobalShoppingProviderNoActivationGuaranteeBoard({
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    offlineActivationWarRoomSummary:readySummary("Offline Activation War Room", "Offline Activation War Room 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter Security Regression Guard 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider No-Activation Guarantee Board");
  assert.equal(api.buildGlobalShoppingProviderNoActivationGuaranteeBoard({ providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderNoActivationGuaranteeBoard({ createProviderClient:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_NO_ACTIVATION_GUARANTEE_BOARD PASS");
}

main();
