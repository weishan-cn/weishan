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

function summary(title, status, extra) {
  return Object.assign({
    status:status || "manual_review_required",
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualScenarioReviewBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingManualScenarioReviewBoard;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION, "4.2.5");

  const review = api.buildGlobalShoppingManualScenarioReviewBoard({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(review.scenarioReviewStatus, "manual_review_required");
  assert.equal(review.scenarioCoverage.includes("manual_acceptance"), true);
  assert.equal(review.scenarioCoverage.includes("no_data_retention"), true);
  assert.equal(review.blockedScenarioReviewActions.includes("persist_scenario_review"), true);
  assert.equal(review.scenarioRedactionRules.includes("providerPayload"), true);
  assert.equal(review.scenarioInputPersistence, false);

  const needsReview = api.buildGlobalShoppingManualScenarioReviewBoard({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center", "needs_review")
  });
  assert.equal(needsReview.scenarioReviewStatus, "needs_review");

  const blocked = api.buildGlobalShoppingManualScenarioReviewBoard({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    persistScenarioReview:true
  });
  assert.equal(blocked.scenarioReviewStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("scenario review persistence"), true);
  console.log("GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD PASS");
}

main();
