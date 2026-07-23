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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyLaunchCandidateFreezeGate.js",
    "apps/desktop/src/renderer/core/flightWorkflowEvidenceFreezePack.js",
    "apps/desktop/src/renderer/core/flightWorkflowLaunchCandidateFreezeViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowLaunchCandidateFreezeViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_VERSION, "4.2.8");
  const vmModel = api.buildFlightWorkflowLaunchCandidateFreezeViewModel({
    freezeGateSummary:{ status:"ready_to_freeze", freezeGateNextStep:"可以冻结只读发布候选", userFacingSummary:{ resultLabel:"准备冻结只读发布候选" }, freezeDecision:{ safeToFreeze:true }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true },
    evidenceFreezePackSummary:{ status:"ready", freezePackNextStep:"可以冻结证据包", userFacingSummary:{ resultLabel:"证据冻结包已就绪" }, safeToFreeze:true, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true },
    pilotExitCriteriaSummary:{ status:"met" },
    launchCandidateReadinessSummary:{ status:"ready" }
  });
  assert.equal(vmModel.status, "ready_to_freeze");
  assert.equal(vmModel.title, "只读发布候选冻结检查");
  assert.equal(vmModel.cards[0].label, "冻结状态");
  assert.equal(vmModel.cards[1].label, "证据包");
  assert.equal(vmModel.riskRows[0].value, "安全红线正常");
  assert.equal(vmModel.freezeGateRows.length > 0, true);
  assert.equal(vmModel.evidencePackRows.length > 0, true);
  assert.equal(vmModel.rcReviewStatus, "ready_for_review");
  assert.equal(vmModel.rcEvidenceStatus, "complete");
  assert.equal(vmModel.safeToStartRcReview, true);
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(vmModel.fileWrite, false);
  const audit = api.buildFlightWorkflowLaunchCandidateFreezeViewModelAuditDraft({
    freezeGateSummary:{ status:"ready_to_freeze", freezeGateNextStep:"可以冻结只读发布候选", userFacingSummary:{ resultLabel:"准备冻结只读发布候选" }, freezeDecision:{ safeToFreeze:true }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true },
    evidenceFreezePackSummary:{ status:"ready", freezePackNextStep:"可以冻结证据包", userFacingSummary:{ resultLabel:"证据冻结包已就绪" }, safeToFreeze:true, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true },
    pilotExitCriteriaSummary:{ status:"met" },
    launchCandidateReadinessSummary:{ status:"ready" }
  });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL_AUDIT_DRAFT");
  assert.equal(audit.status, "ready_to_freeze");
  assert.equal(audit.fileWrite, false);
  assert.equal(JSON.stringify(audit).includes("password"), false);
  console.log("FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_FREEZE_VIEW_MODEL PASS");
}

main();
