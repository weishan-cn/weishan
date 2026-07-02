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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js",
    "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingNextFeatureReadinessGate;
  assert.equal(api.GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION, "4.0.3");
  const ready = api.buildGlobalShoppingNextFeatureReadinessGate({
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"会话总结已准备", redacted:true } },
    userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ resultLabel:"信任闭环摘要已准备", redacted:true } },
    readOnlySessionClosurePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读会话关闭包已准备", redacted:true } },
    externalPlatformExitRampPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"外部平台退出坡道已准备", redacted:true } },
    finalUserSafetyChecklistSummary:{ status:"ready", userFacingSummary:{ resultLabel:"最终用户安全清单已准备", redacted:true } },
    safetyRegressionSentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.appVersion, "4.0.3");
  assert.equal(ready.status, "ready");
  assert.equal(ready.rows.some((row) => row.label === "下一功能闸门不接真实 provider"), true);
  assert.equal(api.buildGlobalShoppingNextFeatureReadinessGate({ callNetwork:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE PASS");
}

main();
