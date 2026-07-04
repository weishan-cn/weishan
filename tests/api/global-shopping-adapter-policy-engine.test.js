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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingAdapterPolicyEngine.js"]);
  const api = windowRef.WeishanGlobalShoppingAdapterPolicyEngine;
  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_VERSION, "4.2.0");

  const ready = api.buildGlobalShoppingAdapterPolicyEngine({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备"),
    providerAdapterComplianceChecklistSummary:readySummary("Provider Adapter Compliance Checklist", "Adapter 合规清单已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.policyBoundary.canModifyRuntimeConfig, false);
  assert.equal(ready.policySummary.humanPolicyReviewRequired, true);
  assert.equal(JSON.stringify(ready).includes("secret"), false);

  const needsReview = api.buildGlobalShoppingAdapterPolicyEngine({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingAdapterPolicyEngine({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    modifyRuntimeConfig:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE PASS");
}

main();
