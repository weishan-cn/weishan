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

function readySummary(title, resultLabel) {
  return { status:"ready", userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderSandboxReleaseCandidateViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxReleaseCandidateViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingProviderSandboxReleaseCandidateViewModel({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox Release Candidate");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.disclosureRows.some((item) => item.value === "Manual release candidate review 仍需人工复核"), true);

  const needsReview = api.buildGlobalShoppingProviderSandboxReleaseCandidateViewModel({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderSandboxReleaseCandidateViewModel({
    offlineProviderAdapterContractKitSummary:{ status:"blocked", userFacingSummary:{ title:"Offline Provider Adapter Contract Kit", resultLabel:"离线 Adapter 合同已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Offline Provider Adapter Contract Kit", value:"离线 Adapter 合同已阻断", status:"blocked", redacted:true }], redacted:true },
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备")
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_RELEASE_CANDIDATE_VIEW_MODEL PASS");
}

main();
