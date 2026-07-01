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
  return { status:"ready", userFacingSummary:{ title, resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingHumanActivationRunbookCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingHumanActivationRunbookCenter;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingHumanActivationRunbookCenter({
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    manualActivationCommandCenterSummary:readySummary("人工激活指挥中心", "人工激活指挥中心已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "人工激活 Dry-run 检查清单已准备"),
    manualActivationHandoffPacketSummary:readySummary("人工激活交接包", "人工激活交接包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.runbookSummary.manualActivationStillRequired, true);
  assert.equal(ready.runbookSummary.readyForAdapterComplianceChecklist, true);

  const needsReview = api.buildGlobalShoppingHumanActivationRunbookCenter({
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanActivationRunbookCenter({
    mockSandboxQaMatrixSummary:readySummary("Mock Sandbox QA Matrix", "Mock Sandbox QA 矩阵已准备"),
    manualActivationCommandCenterSummary:readySummary("人工激活指挥中心", "人工激活指挥中心已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "人工激活 Dry-run 检查清单已准备"),
    manualActivationHandoffPacketSummary:readySummary("人工激活交接包", "人工激活交接包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备"),
    sendEmail:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER PASS");
}

main();
