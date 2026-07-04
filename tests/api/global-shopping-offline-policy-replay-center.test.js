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
  const api = load("apps/desktop/src/renderer/core/globalShoppingOfflinePolicyReplayCenter.js").WeishanGlobalShoppingOfflinePolicyReplayCenter;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_VERSION, "4.1.8");
  const ready = api.buildGlobalShoppingOfflinePolicyReplayCenter({
    providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "Provider Launch Audit Snapshot 已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter Boundary Diff Inspector 已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Offline Policy Replay Center");
  assert.equal(api.runGlobalShoppingOfflinePolicyReplay({ offlinePolicyReplayCenterSummary:ready }).status, "ready");
  assert.equal(api.buildGlobalShoppingOfflinePolicyReplayCenter({ providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "ok") }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER PASS");
}

main();
