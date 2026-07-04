const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function summary(title, status) {
  return {
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineTrialReleaseGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaVisualQaConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialScenarioChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaStabilityAudit;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_VERSION, "4.2.1");

  const ready = api.buildGlobalShoppingPublicBetaStabilityAudit({
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    commerceAgentSmokeSummary:{ status:"ready", passedCount:18, totalCount:18, redacted:true },
    validationStatus:"ready",
    e2eStatus:"ready",
    buildStatus:"ready",
    appLaunchStatus:"ready",
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.1");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.knownWarnings[0], "既有 secret scan WARN 仅作为已知警告展示");

  const needsReview = api.buildGlobalShoppingPublicBetaStabilityAudit({
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaStabilityAudit({
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    commerceAgentSmokeSummary:{ status:"ready", passedCount:18, totalCount:18, redacted:true },
    validationStatus:"ready",
    e2eStatus:"ready",
    buildStatus:"ready",
    appLaunchStatus:"ready",
    push:true
  });
  assert.equal(blocked.status, "blocked");

  const secretLeakBlocked = api.buildGlobalShoppingPublicBetaStabilityAudit({
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    commerceAgentSmokeSummary:{ status:"ready", passedCount:18, totalCount:18, redacted:true },
    validationStatus:"ready",
    e2eStatus:"ready",
    buildStatus:"ready",
    appLaunchStatus:"ready",
    knownWarnings:["secret=abc123"]
  });
  assert.equal(secretLeakBlocked.status, "blocked");
  assert.equal(JSON.stringify(ready).includes("token"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT PASS");
}

main();
