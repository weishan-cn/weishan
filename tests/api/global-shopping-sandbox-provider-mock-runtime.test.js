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
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderMockRuntime.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxProviderMockRuntime;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION, "2.3.2");
  const ready = api.buildGlobalShoppingSandboxProviderMockRuntime({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", redacted:true },
    credentialIsolationReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证隔离准备度已通过", redacted:true } },
    providerContractSelectionBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同/授权选择板已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Sandbox Provider Mock Runtime");
  assert.equal(ready.safeToProceedWithMockAdapterRuntimeHardening, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不接真实 provider")), true);
  const needsReview = api.buildGlobalShoppingSandboxProviderMockRuntime({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingSandboxProviderMockRuntime({
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审查档案已准备", redacted:true } },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证接口桩已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", redacted:true },
    credentialIsolationReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"凭证隔离准备度已通过", redacted:true } },
    providerContractSelectionBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同/授权选择板已准备", redacted:true } },
    network:true
  });
  assert.equal(blocked.status, "blocked");
  const dryRun = api.runGlobalShoppingSandboxProviderMockRuntimeDryRun({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(dryRun);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME PASS");
}

main();
