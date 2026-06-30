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
    "apps/desktop/src/renderer/core/globalShoppingVaultBoundaryContract.js",
    "apps/desktop/src/renderer/core/globalShoppingLegalApprovalWorkflowBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderMockRuntimeViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderMockRuntimeViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_VERSION, "2.3.5");
  const ready = api.buildGlobalShoppingProviderMockRuntimeViewModel({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, rows:[{ rowId:"mock", label:"Mock Runtime", value:"已准备", status:"pass", redacted:true }], safeToProceedWithMockAdapterRuntimeHardening:true },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true }, rows:[{ rowId:"vault", label:"Vault 边界", value:"已准备", status:"pass", redacted:true }] },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true }, rows:[{ rowId:"legal", label:"法务审批流程", value:"已准备", status:"pass", redacted:true }] }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Mock Runtime 与审批准备");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("不打开平台")), true);
  const needsReview = api.buildGlobalShoppingProviderMockRuntimeViewModel({
    sandboxProviderMockRuntimeSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 仍需复核", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderMockRuntimeViewModel({
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true } },
    sendEmail:true
  });
  assert.equal(blocked.status, "blocked");
  const audit = api.buildGlobalShoppingProviderMockRuntimeViewModelAuditDraft({ key:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL PASS");
}

main();
