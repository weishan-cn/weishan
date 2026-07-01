const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingUserFacingManualReviewFlow.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVerificationProgressTracker.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeNextActionPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingUserManualReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformVisitPreparationCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformBoundaryBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalUserSafetyChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingExternalPlatformExitRampPreview;
  assert.equal(api.GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION, "3.1.0");
  const ready = api.buildGlobalShoppingExternalPlatformExitRampPreview({
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核流程已准备", redacted:true } },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台核对进度已准备", redacted:true } },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"安全下一步已准备", redacted:true } },
    userManualReviewViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核与安全下一步已准备", redacted:true } },
    manualPlatformVisitPreparationCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台访问准备已完成", redacted:true } },
    externalPlatformBoundaryBriefSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台边界说明已准备", redacted:true } },
    finalUserSafetyChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"最终安全清单已准备", redacted:true } },
    platformVisitPreparationViewModelSummary:{ status:"ready", title:"平台访问准备与最终安全清单", userFacingSummary:{ resultLabel:"平台访问准备已完成", redacted:true } }
  });
  assert.equal(ready.appVersion, "3.1.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "外部平台退出坡道已准备");
  assert.equal(ready.rows[0].label, "外部平台退出坡道预览");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitRampPreview({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitRampPreview({ generateLink:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitRampPreview({ openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitRampPreview({ persistUserChoice:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitRampPreview({ statesNoGeneratedLink:false }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW PASS");
}
main();
