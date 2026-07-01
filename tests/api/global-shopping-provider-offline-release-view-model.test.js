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

function readySummary(title, resultLabel, status = "ready") {
  return { status, title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:status === "blocked" ? "blocked" : "pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderOfflineReleaseViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderOfflineReleaseViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_VERSION, "3.6.0");

  const ready = api.buildGlobalShoppingProviderOfflineReleaseViewModel({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 离线发布闸门与激活复核");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithManualOfflineReleaseReview, true);

  const needsReview = api.buildGlobalShoppingProviderOfflineReleaseViewModel({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderOfflineReleaseViewModel({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已阻断", "blocked")
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL PASS");
}

main();
