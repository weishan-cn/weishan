const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlySessionClosurePack;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION, "3.5.0");
  const ready = api.buildGlobalShoppingReadOnlySessionClosurePack({
    externalPlatformExitRampPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"外部平台退出坡道已准备", redacted:true } },
    manualVisitSafetyBriefSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动访问安全简报已准备", redacted:true } },
    platformVisitPreparationViewModelSummary:{ status:"ready", title:"平台访问准备与最终安全清单", redacted:true }
  });
  assert.equal(ready.appVersion, "3.5.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "只读会话关闭包已准备");
  assert.equal(api.buildGlobalShoppingReadOnlySessionClosurePack({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlySessionClosurePack({ export:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlySessionClosurePack({ confirmationStored:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlySessionClosurePack({ statesNoExportDownload:false }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK PASS");
}
main();
