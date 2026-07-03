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
  return window.WeishanGlobalShoppingPublicBetaFinalGate;
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
    externalUrl:null,
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
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalGate.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE_VERSION, "4.0.9");
  const ready = api.buildGlobalShoppingPublicBetaFinalGate({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化已准备"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.gateMode, "final_gate_only");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingPublicBetaFinalGate({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaFinalGate({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化已准备"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备"),
    push:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_GATE PASS");
}

main();
