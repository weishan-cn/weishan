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

function passSafetySummary(title, resultLabel) {
  return { status:"pass", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingAdapterSecurityRegressionGuard.js"]);
  const api = windowRef.WeishanGlobalShoppingAdapterSecurityRegressionGuard;
  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingAdapterSecurityRegressionGuard({
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    safetySentinelSummary:passSafetySummary("Safety Sentinel", "安全回归通过")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.guardBoundary.canPersistRawResponse, false);
  assert.equal(ready.guardSummary.manualSecurityReviewRequired, true);

  const needsReview = api.buildGlobalShoppingAdapterSecurityRegressionGuard({
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingAdapterSecurityRegressionGuard({
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter 边界差异检查器已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    mockIntegrationRegressionLabSummary:readySummary("Mock Integration Regression Lab", "Mock 集成回归实验室已准备"),
    safetySentinelSummary:passSafetySummary("Safety Sentinel", "安全回归通过"),
    generateEndpoint:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD PASS");
}

main();
