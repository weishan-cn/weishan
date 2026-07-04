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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingHumanApprovalEvidenceBinder.js"]);
  const api = windowRef.WeishanGlobalShoppingHumanApprovalEvidenceBinder;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_VERSION, "4.2.2");

  const ready = api.buildGlobalShoppingHumanApprovalEvidenceBinder({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备"),
    verifyE2eBuildSummary:readySummary("Verify / E2E / Build Summary", "Verify / E2E / Build 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.evidenceSummary.humanApprovalStillRequired, true);

  const needsReview = api.buildGlobalShoppingHumanApprovalEvidenceBinder({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanApprovalEvidenceBinder({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanActivationRunbookCenterSummary:readySummary("Human Activation Runbook Center", "人工激活运行手册已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备"),
    verifyE2eBuildSummary:readySummary("Verify / E2E / Build Summary", "Verify / E2E / Build 已准备"),
    uploadEvidence:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER PASS");
}

main();
