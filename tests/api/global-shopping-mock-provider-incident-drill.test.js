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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingMockProviderIncidentDrill.js"]);
  const api = windowRef.WeishanGlobalShoppingMockProviderIncidentDrill;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION, "4.1.3");

  const ready = api.buildGlobalShoppingMockProviderIncidentDrill({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.drillName, "global_shopping_mock_provider_incident_drill_v1");
  assert.equal(ready.userFacingSummary.title, "Mock Provider 事故演练");
  assert.equal(ready.incidentTimeline.length, 6);
  assert.equal(ready.incidentSummary.readyForProductionBlockerMatrix, true);

  const needsReview = api.buildGlobalShoppingMockProviderIncidentDrill({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockProviderIncidentDrill({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", redacted:true },
    executeRollback:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingMockProviderIncidentDrillAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL PASS");
}

main();
