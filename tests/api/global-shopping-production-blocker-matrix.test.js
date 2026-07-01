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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProductionBlockerMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingProductionBlockerMatrix;
  assert.equal(api.GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION, "3.3.0");

  const ready = api.buildGlobalShoppingProductionBlockerMatrix({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.matrixName, "global_shopping_production_blocker_matrix_v1");
  assert.equal(ready.userFacingSummary.title, "Production 阻断矩阵");
  assert.equal(ready.blockerCategories.some((item) => item.label === "无法务审批"), true);
  assert.equal(ready.blockerSummary.readyForHumanControlledPilotPlanning, true);

  const needsReview = api.buildGlobalShoppingProductionBlockerMatrix({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProductionBlockerMatrix({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", redacted:true },
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProductionBlockerMatrixAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX PASS");
}

main();
