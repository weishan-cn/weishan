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
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxProviderRollbackPlan;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION, "4.0.2");

  const ready = api.buildGlobalShoppingSandboxProviderRollbackPlan({
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", checks:[], failures:[], warnings:[], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.planName, "global_shopping_sandbox_provider_rollback_plan_v1");
  assert.equal(ready.rollbackBoundary.canExecuteRollback, false);
  assert.equal(ready.rollbackSummary.readyForFutureSandboxRollbackReview, true);
  assert.equal(ready.rows.some((item) => item.label.includes("回滚预案边界")), true);

  const needsReview = api.buildGlobalShoppingSandboxProviderRollbackPlan({
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxProviderRollbackPlan({
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    safetyRegressionSummary:{ status:"pass", checks:[], failures:[], warnings:[], redacted:true },
    executeRollback:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingSandboxProviderRollbackPlanAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN PASS");
}

main();
