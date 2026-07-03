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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingAdapterBoundaryDiffInspector.js"]);
  const api = windowRef.WeishanGlobalShoppingAdapterBoundaryDiffInspector;
  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_VERSION, "4.1.5");

  const ready = api.buildGlobalShoppingAdapterBoundaryDiffInspector({
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    safetySentinelSummary:readySummary("Safety Sentinel", "安全回归通过")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.diffBoundary.canPersistRawRequest, false);
  assert.equal(ready.diffSummary.manualBoundaryDiffReviewRequired, true);

  const needsReview = api.buildGlobalShoppingAdapterBoundaryDiffInspector({
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingAdapterBoundaryDiffInspector({
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备"),
    safetySentinelSummary:readySummary("Safety Sentinel", "安全回归通过"),
    createProviderClient:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR PASS");
}

main();
