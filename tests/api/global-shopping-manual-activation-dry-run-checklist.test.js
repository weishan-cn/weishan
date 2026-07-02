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
  return {
    status:"ready",
    userFacingSummary:{ title, resultLabel, redacted:true },
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingManualActivationDryRunChecklist.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualActivationDryRunChecklist;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION, "4.0.2");

  const ready = api.buildGlobalShoppingManualActivationDryRunChecklist({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("只读 Sandbox 激活准备中心", "Sandbox 激活准备中心已准备"),
    offlineSandboxTraceInspectorSummary:readySummary("离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包", "人工激活交接包已准备"),
    releaseFreezeGateSummary:readySummary("Sandbox Provider Release Freeze Gate", "Release Freeze Gate 已准备"),
    providerReadinessSignOffPacketSummary:readySummary("Provider 准备签核包", "准备签核包已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "人工激活 Dry-run 检查清单");
  assert.equal(Array.isArray(ready.rows), true);
  assert.equal(ready.rows.length > 0, true);
  assert.equal(ready.auditDraft.payment, false);
  assert.equal(ready.auditDraft.order, false);

  const needsReview = api.buildGlobalShoppingManualActivationDryRunChecklist({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("只读 Sandbox 激活准备中心", "Sandbox 激活准备中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualActivationDryRunChecklist({
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\//i.test(safeJson), false);
  assert.equal(safeJson.includes("\"bookingUrl\":\"https://"), false);
  console.log("GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST PASS");
}

main();
