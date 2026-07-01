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
  return { status:"ready", userFacingSummary:{ title, resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderAdapterComplianceChecklist.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderAdapterComplianceChecklist;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingProviderAdapterComplianceChecklist({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    vaultBoundaryContractSummary:readySummary("Vault Boundary Contract", "Vault Boundary Contract 已准备"),
    providerLegalReviewDossierSummary:readySummary("Provider Legal Review Dossier", "Provider Legal Review Dossier 已准备"),
    productionBlockerMatrixSummary:readySummary("Production Blocker Matrix", "Production Blocker Matrix 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.complianceSummary.readyForReleaseCandidateViewModel, true);
  assert.equal(ready.complianceCategories.length, 6);

  const needsReview = api.buildGlobalShoppingProviderAdapterComplianceChecklist({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderAdapterComplianceChecklist({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    vaultBoundaryContractSummary:readySummary("Vault Boundary Contract", "Vault Boundary Contract 已准备"),
    providerLegalReviewDossierSummary:readySummary("Provider Legal Review Dossier", "Provider Legal Review Dossier 已准备"),
    productionBlockerMatrixSummary:readySummary("Production Blocker Matrix", "Production Blocker Matrix 已准备"),
    createProviderClient:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST PASS");
}

main();
