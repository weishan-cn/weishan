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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderZeroRuntimeLock.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderZeroRuntimeLock;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_VERSION, "4.2.1");
  const ready = api.buildGlobalShoppingProviderZeroRuntimeLock({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备"),
    safetyRegressionSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.lockName, "global_shopping_provider_zero_runtime_lock_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Provider-Zero Runtime Lock 已准备");
  assert.equal(api.buildGlobalShoppingProviderZeroRuntimeLock({ globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderZeroRuntimeLock({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备"),
    safetyRegressionSummary:{ status:"pass", redacted:true },
    network:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK PASS");
}

main();
