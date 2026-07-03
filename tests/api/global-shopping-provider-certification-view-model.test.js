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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderCertificationViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderCertificationViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingProviderCertificationViewModel({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 离线认证与边界锁");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.disclosureRows.some((item) => item.value === "Human certification review 仍需人工复核"), true);

  const needsReview = api.buildGlobalShoppingProviderCertificationViewModel({
    offlineProviderCertificationCenterSummary:readySummary("Offline Provider Certification Center", "离线 Provider 认证中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderCertificationViewModel({
    offlineProviderCertificationCenterSummary:{ status:"blocked", userFacingSummary:{ title:"Offline Provider Certification Center", resultLabel:"离线 Provider 认证已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Offline Provider Certification Center", value:"离线 Provider 认证已阻断", status:"blocked", redacted:true }], redacted:true },
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备")
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL PASS");
}

main();
