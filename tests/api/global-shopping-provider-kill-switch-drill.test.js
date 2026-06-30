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
    "apps/desktop/src/renderer/core/globalShoppingProductionBlockerMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderIncidentDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanControlledSandboxProviderPilotPlanner.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderKillSwitchDrill.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderKillSwitchDrill;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_VERSION, "2.3.8");

  const ready = api.buildGlobalShoppingProviderKillSwitchDrill({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    rollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.killSwitchSummary.readyForComplianceEvidencePack, true);
  assert.equal(ready.killSwitchTriggers.length, 5);

  const needsReview = api.buildGlobalShoppingProviderKillSwitchDrill({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderKillSwitchDrill({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    rollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    safetySentinelSummary:{ status:"pass", redacted:true },
    disableRealProvider:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderKillSwitchDrillAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL PASS");
}

main();
