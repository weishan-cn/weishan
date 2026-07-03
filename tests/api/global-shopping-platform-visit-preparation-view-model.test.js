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
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformVisitPreparationCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformBoundaryBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalUserSafetyChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPlatformVisitPreparationViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION, "4.0.7");

  const ready = api.buildGlobalShoppingPlatformVisitPreparationViewModel({
    manualPlatformVisitPreparationCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台访问准备已完成", redacted:true }, redacted:true },
    externalPlatformBoundaryBriefSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台边界说明已准备", redacted:true }, boundaryStatements:[{ statementId:"s1", label:"边界", statement:"Weishan 不代表外部平台" }], redacted:true },
    finalUserSafetyChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"最终安全清单已准备", redacted:true }, safetyItems:[{ itemId:"i1", label:"不要把候选价当最终价", summary:"到平台核对实时价格" }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.cards[0].cardId, "visit_preparation");
  assert.equal(ready.cards[1].cardId, "platform_boundary");
  assert.equal(ready.cards[2].cardId, "final_safety");
  assert.equal(ready.cards[3].cardId, "next_step");
  assert.equal(ready.preparationRows.length >= 4, true);
  assert.equal(ready.boundaryRows.length >= 1, true);
  assert.equal(ready.finalSafetyRows.length >= 1, true);
  assert.equal(ready.disclosureRows.length >= 2, true);

  assert.equal(api.buildGlobalShoppingPlatformVisitPreparationViewModel({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformVisitPreparationViewModel({ manualPlatformVisitPreparationCenterSummary:{ status:"blocked" } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformVisitPreparationViewModel({ networkEnabled:true }).status, "blocked");
  assert.equal(JSON.stringify(ready).includes("bookingUrl"), false);
  assert.equal(JSON.stringify(ready).includes("token"), false);
}

main();
