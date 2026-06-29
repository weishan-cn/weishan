const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js",
    "apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPlatformHandoffSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformHandoffSimulationViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPlatformHandoffSimulationViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL_VERSION, "2.2.6");
  const ready = api.buildGlobalShoppingPlatformHandoffSimulationViewModel({
    readOnlyPlatformHandoffSimulatorSummary:windowRef.WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({
      sandboxDecisionReviewViewModel:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 候选决策复核已准备", redacted:true }, redacted:true },
      sandboxCandidateComparisonWorkbench:{ status:"ready", recommendationSummary:{ recommendedCandidateId:"candidate_a", redacted:true }, userFacingSummary:{ resultLabel:"候选对比已准备", redacted:true }, redacted:true },
      providerEvidenceComparisonMatrix:{ status:"ready", userFacingSummary:{ resultLabel:"证据矩阵已准备", redacted:true }, redacted:true },
      readOnlyHandoffReadinessDrill:{ status:"ready", userFacingSummary:{ resultLabel:"交接演练已准备", redacted:true }, redacted:true },
      itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1
    }),
    redactedSearchParameterPackSummary:windowRef.WeishanGlobalShoppingRedactedSearchParameterPack.buildGlobalShoppingRedactedSearchParameterPack({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 }),
    userConfirmationChecklistSummary:windowRef.WeishanGlobalShoppingUserConfirmationChecklist.buildGlobalShoppingUserConfirmationChecklist({})
  });
  assert.equal(ready.appVersion, "2.2.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "只读平台交接模拟");
  assert.equal(ready.cards.some((item) => item.cardId === "handoff_simulator"), true);
  assert.equal(ready.cards.some((item) => item.cardId === "parameter_pack"), true);
  assert.equal(ready.cards.some((item) => item.cardId === "confirmation_checklist"), true);
  assert.equal(ready.cards.some((item) => item.cardId === "next_step"), true);
  assert.equal(ready.simulationRows.length > 0, true);
  assert.equal(ready.parameterPackRows.length > 0, true);
  assert.equal(ready.confirmationChecklistRows.length > 0, true);
  assert.equal(ready.disclosureRows.length >= 4, true);
  assert.ok(ready.caveat.includes("非敏感搜索参数准备"));
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ redactedSearchParameterPackSummary:ready.redactedSearchParameterPackSummary, userConfirmationChecklistSummary:ready.userConfirmationChecklistSummary }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:ready.readOnlyPlatformHandoffSimulatorSummary, userConfirmationChecklistSummary:ready.userConfirmationChecklistSummary }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:ready.readOnlyPlatformHandoffSimulatorSummary, redactedSearchParameterPackSummary:ready.redactedSearchParameterPackSummary }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"blocked" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, realEndpointDetected:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, hasRealApiKey:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, networkEnabled:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, rawResponseStored:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, payment:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, order:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, ticketing:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ readOnlyPlatformHandoffSimulatorSummary:{ status:"ready" }, redactedSearchParameterPackSummary:{ status:"ready" }, userConfirmationChecklistSummary:{ status:"ready" }, export:true }).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingPlatformHandoffSimulationViewModel({ token:"abc", secret:"def" }));
  assert.equal(/abc|def|https?:\/\//i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PLATFORM_HANDOFF_SIMULATION_VIEW_MODEL PASS");
}

main();
