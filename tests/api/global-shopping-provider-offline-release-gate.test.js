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
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderOfflineReleaseGate.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderOfflineReleaseGate;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_VERSION, "4.1.8");

  const ready = api.buildGlobalShoppingProviderOfflineReleaseGate({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    providerCertificationViewModelSummary:readySummary("Provider Certification View Model", "Provider 离线认证视图已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.8");
  assert.equal(ready.releaseBoundary.canCreateRelease, false);
  assert.equal(ready.releaseSummary.humanReleaseReviewRequired, true);
  assert.equal(JSON.stringify(ready).includes("token"), false);

  const needsReview = api.buildGlobalShoppingProviderOfflineReleaseGate({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderOfflineReleaseGate({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    providerCertificationViewModelSummary:readySummary("Provider Certification View Model", "Provider 离线认证视图已准备"),
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  const malformed = api.buildGlobalShoppingProviderOfflineReleaseGate(null);
  assert.equal(["needs_review", "blocked"].includes(malformed.status), true);

  console.log("GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE PASS");
}

main();
