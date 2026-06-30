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
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderLaunchReadinessViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION, "2.4.1");

  const ready = api.buildGlobalShoppingProviderLaunchReadinessViewModel({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, rows:[{ rowId:"mock_registry", label:"Mock Adapter 注册", value:"只允许 mock / fixture / dry_run / contract_only", status:"pass", redacted:true }] },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true }, rows:[{ rowId:"contract_replay", label:"合同回放", value:"只回放脱敏 contract case", status:"pass", redacted:true }] },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, rows:[{ rowId:"launch_readiness", label:"启动准备", value:"真实 sandbox provider 仍需人工审批", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 启动准备与合同回放");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("不接真实 provider")), true);

  const needsReview = api.buildGlobalShoppingProviderLaunchReadinessViewModel({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"Mock Adapter 注册仍需复核", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderLaunchReadinessViewModel({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderLaunchReadinessViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL PASS");
}

main();
