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
    "apps/desktop/src/renderer/core/globalShoppingMockProviderResultNormalizer.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMockProviderResultNormalizer;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER_VERSION, "2.5.0");

  const ready = api.buildGlobalShoppingMockProviderResultNormalizer({
    offlineSandboxTraceInspectorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Trace 检查已准备", redacted:true }, redacted:true },
    offlineMockSandboxSessionRunnerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Mock 会话已准备", redacted:true }, redacted:true },
    mockAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, redacted:true },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合同回放器已准备", redacted:true }, redacted:true },
    mockResults:[
      { providerId:"fixture_a", totalPrice:930, currency:"CNY", responseShape:"fixture_quote", bookingUrl:null, payment:false, order:false, redacted:true }
    ]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Mock Provider 结果归一化器");
  assert.equal(Array.isArray(ready.rows), true);
  assert.equal(ready.rows.length > 0, true);
  assert.equal(Array.isArray(ready.normalizedResults), true);
  assert.equal(ready.normalizedResults.length, 1);
  assert.equal(ready.normalizedResults[0].bookingUrl, null);

  const needsReview = api.buildGlobalShoppingMockProviderResultNormalizer({
    offlineSandboxTraceInspectorSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"离线 Trace 检查仍需复核", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockProviderResultNormalizer({
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\//i.test(safeJson), false);
  assert.equal(safeJson.includes("\"bookingUrl\":\"https://"), false);
  console.log("GLOBAL_SHOPPING_MOCK_PROVIDER_RESULT_NORMALIZER PASS");
}

main();
