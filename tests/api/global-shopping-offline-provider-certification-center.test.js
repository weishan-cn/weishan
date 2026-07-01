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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineProviderCertificationCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineProviderCertificationCenter;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_VERSION, "3.3.0");

  const ready = api.buildGlobalShoppingOfflineProviderCertificationCenter({
    providerSandboxReleaseCandidateViewModelSummary:readySummary("Provider Sandbox Release Candidate", "Provider Sandbox Release Candidate 已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.certificationSummary.humanCertificationReviewRequired, true);
  assert.equal(ready.certificationSummary.readyForMockIntegrationRegressionLab, true);

  const needsReview = api.buildGlobalShoppingOfflineProviderCertificationCenter({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineProviderCertificationCenter({
    providerSandboxReleaseCandidateViewModelSummary:readySummary("Provider Sandbox Release Candidate", "Provider Sandbox Release Candidate 已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const malformed = api.buildGlobalShoppingOfflineProviderCertificationCenter("bad-input");
  assert.equal(["needs_review", "blocked"].includes(malformed.status), true);
  assert.equal(JSON.stringify(ready).includes("token"), false);

  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER PASS");
}

main();
