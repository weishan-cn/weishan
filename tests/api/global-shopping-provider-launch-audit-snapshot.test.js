const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderLaunchAuditSnapshot.js").WeishanGlobalShoppingProviderLaunchAuditSnapshot;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_VERSION, "3.5.0");
  const ready = api.buildGlobalShoppingProviderLaunchAuditSnapshot({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    humanReleaseEvidenceTimelineSummary:readySummary("Human Release Evidence Timeline", "人工发布证据时间线已准备"),
    sandboxActivationFinalReviewBoardSummary:readySummary("Sandbox Activation Final Review Board", "Sandbox 激活终审板已准备"),
    providerLaunchControlViewModelSummary:{ status:"ready", title:"Provider Launch Control Tower", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Launch Audit Snapshot");
  const needsReview = api.buildGlobalShoppingProviderLaunchAuditSnapshot({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderLaunchAuditSnapshot({
    adapterPolicyEngineSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Adapter Policy Engine", value:"已阻断", status:"blocked", redacted:true }], redacted:true }
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT PASS");
}

main();
