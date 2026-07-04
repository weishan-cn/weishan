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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingOfflineSandboxTraceInspector.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingOfflineSandboxTraceInspector;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION, "4.1.8");

  const ready = api.buildGlobalShoppingOfflineSandboxTraceInspector({
    offlineMockSandboxSessionRunnerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"离线 Mock 会话已准备", redacted:true }, redacted:true },
    readOnlySandboxActivationReadinessCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 激活准备中心已准备", redacted:true }, redacted:true },
    manualProviderActivationHandoffPacketSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工激活交接包已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "离线 Sandbox Trace 检查器");
  assert.equal(Array.isArray(ready.rows), true);
  assert.equal(ready.rows.length > 0, true);
  assert.equal(ready.auditDraft.fileWrite, false);
  assert.equal(ready.auditDraft.download, false);

  const needsReview = api.buildGlobalShoppingOfflineSandboxTraceInspector({
    offlineMockSandboxSessionRunnerSummary:{ status:"needs_review", userFacingSummary:{ resultLabel:"离线 Mock 会话仍需复核", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineSandboxTraceInspector({
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\//i.test(safeJson), false);
  assert.equal(safeJson.includes("\"bookingUrl\":\"https://"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR PASS");
}

main();
