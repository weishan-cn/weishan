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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderCertificationFreezeLedger.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderCertificationFreezeLedger;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_VERSION, "3.4.0");

  const ready = api.buildGlobalShoppingProviderCertificationFreezeLedger({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    verifyE2eBuildSummary:readySummary("Verify / E2E / Build Summary", "Verify / E2E / Build 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.freezeBoundary.canPersistLedger, false);
  assert.equal(ready.freezeSummary.humanFreezeReviewRequired, true);

  const needsReview = api.buildGlobalShoppingProviderCertificationFreezeLedger({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderCertificationFreezeLedger({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    verifyE2eBuildSummary:readySummary("Verify / E2E / Build Summary", "Verify / E2E / Build 已准备"),
    persistLedger:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER PASS");
}

main();
