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
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js",
    "apps/desktop/src/renderer/core/globalShoppingVaultBoundaryContract.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderContractReplayHarness;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS_VERSION, "4.1.2");

  const ready = api.buildGlobalShoppingProviderContractReplayHarness({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } },
    replayCases:[
      { caseId:"fixture_contract_case", label:"Fixture contract case", status:"pass", summary:"Fixture contract case 已脱敏，可用于回放。", caveat:"不回放 raw request/raw response。" },
      { caseId:"dry_run_contract_case", label:"Dry-run contract case", status:"pass", summary:"Dry-run contract case 仅保留 contract 级摘要。", caveat:"不读取 key，不使用真实 endpoint。" }
    ]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.harnessName, "global_shopping_provider_contract_replay_harness_v1");
  assert.equal(ready.replaySummary.readyForLaunchReadinessGate, true);
  assert.equal(ready.userFacingSummary.title, "Provider 合同回放器");
  assert.equal(ready.rows.some((item) => item.label.includes("合同回放边界")), true);

  const needsReview = api.buildGlobalShoppingProviderContractReplayHarness({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderContractReplayHarness({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Adapter 合同测试台已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } },
    replayRawResponse:true
  });
  assert.equal(blocked.status, "blocked");

  const replay = api.runGlobalShoppingProviderContractReplay({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(replay);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_CONTRACT_REPLAY_HARNESS PASS");
}

main();
