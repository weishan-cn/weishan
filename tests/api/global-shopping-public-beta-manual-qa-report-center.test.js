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
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffPack.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineTrialReleaseGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaManualQaReportCenter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaManualQaReportCenter;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingPublicBetaManualQaReportCenter({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    manualLaunchHandoffViewModelSummary:summary("Manual Launch Handoff View Model"),
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    validationSummary:"人工 QA 结果待确认",
    e2eSummary:"commerce-agent 18/18 smoke passed",
    buildSummary:"build passed",
    appLaunchSummary:"app launch passed",
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.4");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaManualQaReportCenter({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaManualQaReportCenter({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    manualLaunchHandoffViewModelSummary:summary("Manual Launch Handoff View Model"),
    publicBetaRcConsoleSummary:summary("Public Beta RC Console"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    export:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(ready).includes("token"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER PASS");
}

main();
