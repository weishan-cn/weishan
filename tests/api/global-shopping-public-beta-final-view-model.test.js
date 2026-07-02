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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalGate.js",
    "apps/desktop/src/renderer/core/globalShoppingReleaseCandidateConfidenceBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_VERSION, "4.0.3");
  const ready = api.buildGlobalShoppingPublicBetaFinalViewModel({
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualPublicBetaReview, true);
  assert.equal(ready.cards.length, 5);
  assert.equal(api.buildGlobalShoppingPublicBetaFinalViewModel({
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaFinalViewModel({
    publicBetaFinalGateSummary:{ status:"blocked", title:"Public Beta Final Gate", userFacingSummary:{ title:"Public Beta Final Gate", resultLabel:"Public Beta Final Gate 已阻断", redacted:true }, redacted:true },
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL PASS");
}

main();
