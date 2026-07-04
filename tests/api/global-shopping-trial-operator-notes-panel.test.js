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
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingTrialOperatorNotesPanel.js"]);
  const api = windowRef.WeishanGlobalShoppingTrialOperatorNotesPanel;
  assert.equal(api.GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION, "4.2.4");

  const panel = api.buildGlobalShoppingTrialOperatorNotesPanel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" })
  });
  assert.equal(panel.notesStatus, "manual_review_required");
  assert.equal(panel.operatorNotes.includes("运营备注不保存、不上传、不创建任务"), true);
  assert.equal(panel.nextManualAction, "manual_review_required");
  assert.equal(panel.externalUrl, null);

  const needsReview = api.buildGlobalShoppingTrialOperatorNotesPanel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "needs_review", { evidenceReviewStatus:"needs_review" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" })
  });
  assert.equal(needsReview.notesStatus, "needs_review");

  const blocked = api.buildGlobalShoppingTrialOperatorNotesPanel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    createIssue:true
  });
  assert.equal(blocked.notesStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("provider"), true);
  console.log("GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL PASS");
}

main();
