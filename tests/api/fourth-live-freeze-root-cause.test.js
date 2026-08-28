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
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js"
  ]);

  const centerApi = windowRef.WeishanGlobalShoppingManualPlatformVisitPreparationCenter;
  const visitApi = windowRef.WeishanGlobalShoppingPlatformVisitPreparationViewModel;
  const pipelineApi = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator;

  const missingCenterInputs = centerApi.buildGlobalShoppingManualPlatformVisitPreparationCenter({});
  assert.equal(missingCenterInputs.status, "needs_review");
  assert.equal(missingCenterInputs.preparationSections.length, 6);

  const originalCenterApi = windowRef.WeishanGlobalShoppingManualPlatformVisitPreparationCenter;
  let activeDepth = 0;
  let maxActiveDepth = 0;
  windowRef.WeishanGlobalShoppingManualPlatformVisitPreparationCenter = {
    buildGlobalShoppingManualPlatformVisitPreparationCenter() {
      activeDepth += 1;
      maxActiveDepth = Math.max(maxActiveDepth, activeDepth);
      try {
        return visitApi.buildGlobalShoppingPlatformVisitPreparationViewModel({
          externalPlatformBoundaryBriefSummary:{ status:"ready" },
          finalUserSafetyChecklistSummary:{ status:"ready" }
        });
      } finally {
        activeDepth -= 1;
      }
    }
  };
  const boundedCycle = visitApi.buildGlobalShoppingPlatformVisitPreparationViewModel({
    externalPlatformBoundaryBriefSummary:{ status:"ready" },
    finalUserSafetyChecklistSummary:{ status:"ready" }
  });
  windowRef.WeishanGlobalShoppingManualPlatformVisitPreparationCenter = originalCenterApi;
  assert.equal(maxActiveDepth, 1);
  assert.equal(boundedCycle.status, "needs_review");

  let dryRunBuildCalls = 0;
  windowRef.WeishanGlobalShoppingProviderSandboxDryRunViewModel = {
    buildGlobalShoppingProviderSandboxDryRunViewModel() {
      dryRunBuildCalls += 1;
      return { status:"ready", title:"Provider Sandbox Dry Run", redacted:true };
    }
  };

  const pathologicalLegacyShape = pipelineApi.buildGlobalShoppingPricePipelineOrchestrator({
    providerSandboxDryRunHarnessSummary:{ status:"ready" },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready" },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear" }
  });
  assert.equal(dryRunBuildCalls, 0);
  assert.notEqual(pathologicalLegacyShape.providerSandboxDryRunViewModelSummary.status, "ready");

  const completeDryRunShape = pipelineApi.buildGlobalShoppingPricePipelineOrchestrator({
    offlineSandboxTraceInspectorSummary:{ status:"ready" },
    mockProviderResultNormalizerSummary:{ status:"ready" },
    manualActivationDryRunChecklistSummary:{ status:"ready" }
  });
  assert.equal(dryRunBuildCalls > 0, true);
  assert.equal(completeDryRunShape.providerSandboxDryRunViewModelSummary.status, "ready");

  const explicitSummary = pipelineApi.buildGlobalShoppingPricePipelineOrchestrator({
    providerSandboxDryRunViewModelSummary:{
      status:"ready",
      title:"Explicit Provider Sandbox Dry Run",
      userFacingSummary:{ resultLabel:"Explicit summary preserved", redacted:true },
      redacted:true
    }
  });
  assert.equal(explicitSummary.providerSandboxDryRunViewModelSummary.status, "ready");
  assert.equal(explicitSummary.providerSandboxDryRunViewModelSummary.title, "Explicit Provider Sandbox Dry Run");
  assert.equal(explicitSummary.providerSandboxDryRunViewModelSummary.userFacingSummary.resultLabel, "Explicit summary preserved");
  assert.equal(explicitSummary.safety.bookingUrl, null);
  assert.equal(JSON.stringify(explicitSummary).includes("token"), false);

  console.log("FOURTH_LIVE_FREEZE_ROOT_CAUSE PASS");
}

main();
