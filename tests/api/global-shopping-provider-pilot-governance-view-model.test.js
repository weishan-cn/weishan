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
    "apps/desktop/src/renderer/core/globalShoppingHumanControlledSandboxProviderPilotPlanner.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderKillSwitchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingComplianceEvidencePack.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPilotGovernanceViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderPilotGovernanceViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_VERSION, "2.3.9");

  const ready = api.buildGlobalShoppingProviderPilotGovernanceViewModel({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true }, rows:[{ rowId:"planner", label:"Pilot 计划", value:"Pilot 计划器已准备", status:"pass", redacted:true }] },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true }, rows:[{ rowId:"drill", label:"Kill Switch", value:"Kill Switch 演练已准备", status:"pass", redacted:true }] },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, rows:[{ rowId:"pack", label:"合规证据", value:"合规证据包已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Pilot 治理与合规证据");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("不接真实 provider")), true);

  const needsReview = api.buildGlobalShoppingProviderPilotGovernanceViewModel({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderPilotGovernanceViewModel({
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Pilot 计划器已准备", redacted:true } },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true } },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true } },
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderPilotGovernanceViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL PASS");
}

main();
