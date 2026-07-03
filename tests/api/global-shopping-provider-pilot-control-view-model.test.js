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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderPilotControlViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderPilotControlViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION, "4.0.9");

  const ready = api.buildGlobalShoppingProviderPilotControlViewModel({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, rows:[{ rowId:"pilot", label:"Pilot 控制室", value:"Sandbox Pilot 控制室已准备", status:"pass", redacted:true }] },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true }, rows:[{ rowId:"incident", label:"事故演练", value:"Mock 事故演练已准备", status:"pass", redacted:true }] },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, rows:[{ rowId:"blocker", label:"阻断矩阵", value:"Production 阻断矩阵已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox Pilot 控制与阻断");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("Human-controlled pilot 仍需人工审批")), true);

  const needsReview = api.buildGlobalShoppingProviderPilotControlViewModel({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderPilotControlViewModel({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderPilotControlViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL PASS");
}

main();
