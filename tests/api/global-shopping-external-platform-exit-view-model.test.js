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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingExternalPlatformExitViewModel;
  assert.equal(api.GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION, "3.5.0");
  const ready = api.buildGlobalShoppingExternalPlatformExitViewModel({
    externalPlatformExitRampPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"外部平台退出坡道已准备", redacted:true } },
    manualVisitSafetyBriefSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动访问安全简报已准备", redacted:true } },
    readOnlySessionClosurePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读会话关闭包已准备", redacted:true } }
  });
  assert.equal(ready.appVersion, "3.5.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "外部平台手动访问前最终说明");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitViewModel({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitViewModel({ openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingExternalPlatformExitViewModel({ externalPlatformExitRampPreviewSummary:{ status:"blocked" } }).status, "blocked");
  console.log("GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL PASS");
}
main();
