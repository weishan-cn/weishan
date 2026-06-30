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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPlatformHandoffSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js",
    "apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffPacketPreview.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyHandoffPacketPreview;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION, "2.4.1");
  const ready = api.buildGlobalShoppingReadOnlyHandoffPacketPreview({
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核", redacted:true },
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", recommendationSummary:{ recommendedCandidateId:"candidate_a" }, userFacingSummary:{ resultLabel:"候选对比已准备", redacted:true }, redacted:true },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"证据矩阵已准备", redacted:true }, redacted:true },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接演练已准备", redacted:true }, redacted:true },
    readOnlyPlatformHandoffSimulatorSummary:{ status:"ready", userFacingSummary:{ title:"只读平台交接模拟器", resultLabel:"只读平台交接模拟已准备", redacted:true }, redacted:true },
    redactedSearchParameterPackSummary:{ status:"ready", allowedParameters:[{ key:"origin", valueLabel:"SHA" }], blockedParameters:[], userFacingSummary:{ title:"脱敏搜索参数包", resultLabel:"脱敏搜索参数包已准备", redacted:true }, redacted:true },
    userConfirmationChecklistSummary:{ status:"ready", confirmationItems:[{ itemId:"confirm_price", label:"确认价格", summary:"用户自行确认实时价格" }], userOnlyActions:[{ actionId:"platform_confirm" }], userFacingSummary:{ title:"用户确认清单", resultLabel:"用户确认清单已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.packetBoundary.previewOnly, true);
  assert.equal(ready.userFacingSummary.title, "只读交接包预览");
  assert.equal(ready.userFacingSummary.resultLabel, "交接包预览已准备");
  assert.equal(ready.packetHealth.noRealUrl, true);
  assert.equal(ready.packetSections.length, 4);
  assert.equal(api.buildGlobalShoppingReadOnlyHandoffPacketPreview({ bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyHandoffPacketPreview({}).status, "needs_review");
}

main();
