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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js",
    "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js",
    "apps/desktop/src/renderer/core/globalShoppingCommerceSessionRecapViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingCommerceSessionRecapViewModel;
  assert.equal(api.GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION, "4.0.6");
  const ready = api.buildGlobalShoppingCommerceSessionRecapViewModel({
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"会话总结已准备", redacted:true }, rows:[{ rowId:"a", label:"会话总结", value:"已准备", status:"pass", redacted:true }] },
    userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"信任闭环摘要已准备", redacted:true }, rows:[{ rowId:"b", label:"信任闭环", value:"已准备", status:"pass", redacted:true }] },
    nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"下一功能准备评估已完成", redacted:true }, rows:[{ rowId:"c", label:"下一功能准备", value:"已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.appVersion, "4.0.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "只读全球购会话总结与下一步准备");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows[0].value, "当前只展示本次只读全球购会话总结、信任闭环和下一功能准备度");
  assert.equal(api.buildGlobalShoppingCommerceSessionRecapViewModel({ readOnlyCommerceSessionRecapCenterSummary:{ status:"needs_review" } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingCommerceSessionRecapViewModel({ openExternal:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL PASS");
}

main();
