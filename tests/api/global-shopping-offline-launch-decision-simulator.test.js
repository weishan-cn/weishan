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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineLaunchDecisionSimulator.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineLaunchDecisionSimulator;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_VERSION, "3.2.0");

  const ready = api.buildGlobalShoppingOfflineLaunchDecisionSimulator({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备"),
    providerOfflineReleaseViewModelSummary:{ status:"ready", title:"Provider 离线发布闸门与激活复核", userFacingSummary:{ title:"Provider 离线发布闸门与激活复核", resultLabel:"发布视图已准备", redacted:true }, rows:[{ rowId:"view", label:"View", value:"发布视图已准备", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "3.2.0");
  assert.equal(ready.decisionBoundary.canCreateRelease, false);
  assert.equal(ready.decisionSummary.humanLaunchDecisionRequired, true);
  assert.equal(JSON.stringify(ready).includes("token"), false);

  const needsReview = api.buildGlobalShoppingOfflineLaunchDecisionSimulator({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineLaunchDecisionSimulator({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备"),
    providerOfflineReleaseViewModelSummary:{ status:"ready", title:"Provider 离线发布闸门与激活复核", userFacingSummary:{ resultLabel:"发布视图已准备", redacted:true }, rows:[{ rowId:"view", label:"View", value:"发布视图已准备", status:"pass", redacted:true }], redacted:true },
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR PASS");
}

main();
