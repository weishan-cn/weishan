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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewCockpit.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformRealityCheckBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingUserFacingManualReviewFlow.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVerificationProgressTracker.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeNextActionPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingUserManualReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformVisitPreparationCenter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualPlatformVisitPreparationCenter;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_VERSION, "4.1.4");

  const ready = api.buildGlobalShoppingManualPlatformVisitPreparationCenter({
    userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", redacted:true },
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台核对进度已准备", redacted:true }, redacted:true },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"安全下一步已准备", redacted:true }, redacted:true, safeActionRows:[{ actionId:"review" }], forbiddenActionRows:[{ actionId:"forbidden_1" }] },
    platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台真实页面复核清单已准备", redacted:true }, realityChecks:[{ itemId:"price" }], redacted:true },
    manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.preparationBoundary.canOpenExternalNow, false);
  assert.equal(ready.preparationHealth.platformFinalAuthorityVisible, true);
  assert.equal(ready.preparationSections.length >= 6, true);

  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, userChoiceStored:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, download:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, paymentAuthorization:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, platformFinalAuthorityVisible:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:{ status:"ready" }, userManualDecisionVisible:false }).status, "needs_review");
  assert.equal(JSON.stringify(ready).includes("token"), false);
}

main();
