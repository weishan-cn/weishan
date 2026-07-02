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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingAdapterBoundaryLock.js"]);
  const api = windowRef.WeishanGlobalShoppingAdapterBoundaryLock;
  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_VERSION, "3.9.0");

  const ready = api.buildGlobalShoppingAdapterBoundaryLock({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备"),
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    vaultBoundaryContractSummary:readySummary("Vault Boundary Contract", "Vault Boundary Contract 已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.lockSummary.manualBoundaryReviewRequired, true);

  const needsReview = api.buildGlobalShoppingAdapterBoundaryLock({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingAdapterBoundaryLock({
    offlineProviderAdapterContractKitSummary:readySummary("Offline Provider Adapter Contract Kit", "离线 Adapter 合同套件已准备"),
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    vaultBoundaryContractSummary:readySummary("Vault Boundary Contract", "Vault Boundary Contract 已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true },
    modifyRuntimeConfig:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK PASS");
}

main();
