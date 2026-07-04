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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateEvidenceUnifier.js",
    "apps/desktop/src/renderer/core/globalShoppingFeeNormalizationView.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialAnchorComparisonView.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserFacingCopyPolish.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderZeroStatusPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalGate.js",
    "apps/desktop/src/renderer/core/globalShoppingReleaseCandidateConfidenceBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL_VERSION, "4.2.3");
  const ready = api.buildGlobalShoppingPublicBetaViewModel({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备"),
    publicBetaSafetyCopyCenterSummary:readySummary("Public Beta Safety Copy Center", "Public Beta Safety Copy Center 已准备"),
    globalShoppingPublicBetaUserFacingCopyPolishSummary:readySummary("全球购 Public Beta", "全球购 Public Beta 已准备"),
    globalShoppingProviderZeroStatusPanelSummary:readySummary("Provider-Zero Status Panel", "Provider-Zero Status Panel 已准备"),
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化已准备"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点已准备"),
    publicBetaFinalGateSummary:readySummary("Public Beta Final Gate", "Public Beta Final Gate 已准备"),
    releaseCandidateConfidenceBoardSummary:readySummary("RC Confidence Board", "RC Confidence Board 已准备"),
    publicBetaFinalViewModelSummary:readySummary("Next Manual Review", "下一步仍需人工复核")
  });
  assert.equal(ready.viewModelName, "global_shopping_public_beta_view_model_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Global Shopping Public Beta Review");
  assert.equal(ready.safeToProceedWithHumanPublicBetaReview, true);
  assert.equal(ready.safeToProceedWithManualPublicBetaReview, true);
  assert.equal(ready.cards.length, 11);
  assert.equal(api.buildGlobalShoppingPublicBetaViewModel({ globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备") }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_VIEW_MODEL PASS");
}

main();
