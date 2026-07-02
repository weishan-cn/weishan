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
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderFinalSafetyViewModel.js").WeishanGlobalShoppingProviderFinalSafetyViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL_VERSION, "3.9.0");
  const ready = api.buildGlobalShoppingProviderFinalSafetyViewModel({
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    offlineActivationWarRoomSummary:readySummary("Offline Activation War Room", "Offline Activation War Room 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    providerNoActivationGuaranteeBoardSummary:readySummary("Provider No-Activation Guarantee Board", "Provider No-Activation Guarantee Board 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Final Safety Review");
  assert.equal(ready.safeToProceedWithHumanFinalSafetyReview, true);
  assert.equal(api.buildGlobalShoppingProviderFinalSafetyViewModel({ providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderFinalSafetyViewModel({ providerFinalSafetySealSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Provider Final Safety Seal", value:"已阻断", status:"blocked", redacted:true }], redacted:true } }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_VIEW_MODEL PASS");
}

main();
