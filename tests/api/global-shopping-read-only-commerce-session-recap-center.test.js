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
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION, "3.9.0");
  const ready = api.buildGlobalShoppingReadOnlyCommerceSessionRecapCenter({
    externalPlatformExitRampPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"外部平台退出坡道已准备", redacted:true } },
    manualVisitSafetyBriefSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动访问安全简报已准备", redacted:true } },
    readOnlySessionClosurePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读会话关闭包已准备", redacted:true } },
    platformVisitPreparationViewModelSummary:{ status:"ready", title:"平台访问准备与最终安全清单", redacted:true },
    finalUserSafetyChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"最终用户安全清单已准备", redacted:true } },
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核流程已准备", redacted:true } },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"安全下一步已准备", redacted:true } },
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", userFacingSummary:{ resultLabel:"候选对比已准备", redacted:true } },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"证据矩阵已准备", redacted:true } },
    readOnlySourceTrustScoreSummary:{ status:"ready", userFacingSummary:{ resultLabel:"来源可信度评分已准备", redacted:true } },
    readOnlyHandoffPacketPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包预览已准备", redacted:true } },
    userActionBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"边界回执已准备", redacted:true } }
  });
  assert.equal(ready.appVersion, "3.9.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "只读全球购会话总结");
  assert.equal(ready.rows.some((row) => row.label === "会话总结不保存、不导出"), true);
  assert.equal(api.buildGlobalShoppingReadOnlyCommerceSessionRecapCenter({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyCommerceSessionRecapCenter({ export:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER PASS");
}

main();
