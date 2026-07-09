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
    "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchSimulationViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderLaunchSimulationViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingProviderLaunchSimulationViewModel({
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true }, rows:[{ rowId:"approval", label:"人工审批模拟", value:"审批模拟闸门已准备", status:"pass", redacted:true }] },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true }, rows:[{ rowId:"drill", label:"Mock 启动演练", value:"Mock 启动演练已准备", status:"pass", redacted:true }] },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true }, rows:[{ rowId:"rollback", label:"回滚预案", value:"回滚预案已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 启动模拟与回滚预案");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("不执行回滚")), true);

  const needsReview = api.buildGlobalShoppingProviderLaunchSimulationViewModel({
    humanApprovalSimulationGateSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"审批模拟仍需复核", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderLaunchSimulationViewModel({
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderLaunchSimulationViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL PASS");
}

main();
