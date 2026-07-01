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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxIntegrationGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE_VERSION, "3.6.0");

  const ready = api.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({
    legalProviderFixtureSummary:{ status:"ready", redacted:true },
    providerCredentialSafetySummary:{ status:"ready", redacted:true },
    sandboxPriceFeedSummary:{ status:"ready", redacted:true },
    firstSandboxProviderConnectorSummary:{ status:"ready", redacted:true },
    providerAdapterRegistrySummary:{ status:"ready", redacted:true },
    providerSandboxDryRunHarnessSummary:{ status:"ready", redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", redacted:true },
    providerCoverageDashboardSummary:{ status:"ready", redacted:true },
    readOnlySourceTrustScoreSummary:{ status:"ready", redacted:true },
    pricePipelineOrchestratorSummary:{ status:"ready", redacted:true },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "只读 Provider Sandbox 接入闸门");
  assert.equal(ready.userFacingSummary.resultLabel, "可以创建只读 Sandbox 价格候选会话");

  const review = api.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({
    providerCredentialSafetySummary:{ status:"ready", redacted:true }
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({
    legalProviderFixtureSummary:{ status:"ready", redacted:true },
    providerCredentialSafetySummary:{ status:"ready", redacted:true },
    sandboxPriceFeedSummary:{ status:"ready", redacted:true },
    firstSandboxProviderConnectorSummary:{ status:"ready", redacted:true },
    providerAdapterRegistrySummary:{ status:"ready", redacted:true },
    providerSandboxDryRunHarnessSummary:{ status:"ready", redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", redacted:true },
    providerCoverageDashboardSummary:{ status:"ready", redacted:true },
    readOnlySourceTrustScoreSummary:{ status:"ready", redacted:true },
    pricePipelineOrchestratorSummary:{ status:"ready", redacted:true },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", redacted:true },
    networkEnabled:true
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("network_call_enabled"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_INTEGRATION_GATE PASS");
}

main();
