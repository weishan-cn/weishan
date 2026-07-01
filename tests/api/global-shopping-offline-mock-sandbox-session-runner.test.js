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

function readySummary(resultLabel) {
  return { status:"ready", userFacingSummary:{ resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingOfflineMockSandboxSessionRunner.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingOfflineMockSandboxSessionRunner;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION, "3.3.0");

  const ready = api.buildGlobalShoppingOfflineMockSandboxSessionRunner({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    providerContractReplayHarnessSummary:readySummary("合同回放已准备"),
    mockProviderAdapterRegistryRuntimeSummary:readySummary("Mock Registry 已准备"),
    vaultBoundaryContractSummary:readySummary("Vault 边界已准备"),
    productionBlockerMatrixSummary:readySummary("Production 阻断矩阵已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.sessionTimeline.length, 5);

  const needsReview = api.buildGlobalShoppingOfflineMockSandboxSessionRunner({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineMockSandboxSessionRunner({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    providerContractReplayHarnessSummary:readySummary("合同回放已准备"),
    mockProviderAdapterRegistryRuntimeSummary:readySummary("Mock Registry 已准备"),
    vaultBoundaryContractSummary:readySummary("Vault 边界已准备"),
    productionBlockerMatrixSummary:readySummary("Production 阻断矩阵已准备"),
    persistRawResponse:true
  });
  assert.equal(blocked.status, "blocked");

  const session = api.runGlobalShoppingOfflineMockSandboxSession({ network:false });
  assert.equal(session.bookingUrl, null);

  const audit = api.buildGlobalShoppingOfflineMockSandboxSessionRunnerAuditDraft({ secret:"abc", orderUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER PASS");
}

main();
