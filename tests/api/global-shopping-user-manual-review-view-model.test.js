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
    "apps/desktop/src/renderer/core/globalShoppingUserFacingManualReviewFlow.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVerificationProgressTracker.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeNextActionPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingUserManualReviewViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingUserManualReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_VERSION, "2.4.1");
  const ready = api.buildGlobalShoppingUserManualReviewViewModel({
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台核对进度已准备", redacted:true }, redacted:true, progressRows:[{ itemId:"price", label:"实时价格", status:"user_must_verify", summary:"到平台后人工核对实时价格", redacted:true }] },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"安全下一步已准备", redacted:true }, redacted:true, safeActionRows:[{ actionId:"manual_verify", label:"到平台后人工核对实时价格", kind:"safe", redacted:true }], forbiddenActionRows:[{ actionId:"forbidden_1", label:"立即购买：已阻断", kind:"blocked", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "用户手动复核与安全下一步");
  assert.equal(ready.rows.some((row) => row.value === "平台核对进度不保存勾选"), true);
  assert.equal(ready.rows.some((row) => row.value === "安全下一步不打开平台"), true);
  assert.equal(ready.userFacingSummary.resultLabel, "用户手动复核与安全下一步已准备");
  assert.equal(api.buildGlobalShoppingUserManualReviewViewModel({ openExternal:true }).status, "blocked");
}

main();
