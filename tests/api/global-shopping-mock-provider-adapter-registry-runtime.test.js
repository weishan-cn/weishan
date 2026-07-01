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
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderMockRuntime.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderMockRuntimeViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMockProviderAdapterRegistryRuntime;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION, "3.2.0");

  const ready = api.buildGlobalShoppingMockProviderAdapterRegistryRuntime({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", redacted:true },
    mockAdapters:[
      { adapterId:"fixture_adapter", providerType:"official_candidate", adapterMode:"fixture", status:"registered", redacted:true },
      { adapterId:"contract_adapter", providerType:"partner_candidate", adapterMode:"contract_only", status:"registered", redacted:true }
    ]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.runtimeName, "global_shopping_mock_provider_adapter_registry_runtime_v1");
  assert.equal(ready.registryRuntimeBoundary.canRegisterRealProvider, false);
  assert.equal(ready.registryRuntimeSummary.registeredMockAdapterCount, 2);
  assert.equal(ready.registryRuntimeSummary.readyForContractReplay, true);
  assert.equal(ready.userFacingSummary.title, "Mock Provider Adapter 注册运行时");
  assert.equal(ready.rows.some((item) => item.label.includes("Mock Adapter")), true);

  const partialWindowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js"
  ]);
  const partialApi = partialWindowRef.WeishanGlobalShoppingMockProviderAdapterRegistryRuntime;
  const needsReview = partialApi.buildGlobalShoppingMockProviderAdapterRegistryRuntime({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockProviderAdapterRegistryRuntime({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", redacted:true },
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingMockProviderAdapterRegistryRuntimeAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME PASS");
}

main();
