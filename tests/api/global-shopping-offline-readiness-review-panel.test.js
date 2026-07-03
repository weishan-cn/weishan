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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineReadinessReviewPanel.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineReadinessReviewPanel;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_VERSION, "4.1.5");

  const ready = api.buildGlobalShoppingOfflineReadinessReviewPanel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(ready.status, "manual_review_required");
  assert.equal(ready.knownLimitations.includes("不创建 release"), true);

  const needsReview = api.buildGlobalShoppingOfflineReadinessReviewPanel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineReadinessReviewPanel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineTrialReleaseGateSummary:summary("Offline Trial Release Gate"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    push:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL PASS");
}

main();
