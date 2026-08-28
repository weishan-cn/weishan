const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcCandidateReviewConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcEvidenceReviewChecklist.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcReviewViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRcReviewViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_VERSION, "4.2.8");
  const model = api.buildFlightWorkflowRcReviewViewModel({
    rcCandidateReviewSummary:{ status:"ready_for_review", reviewDecision:{ label:"可以开始 RC 复核" }, userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true }, rows:[{ rowId:"freeze_gate", label:"冻结检查", value:"冻结检查已准备", status:"pass", redacted:true }], redacted:true },
    rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, rows:[{ rowId:"release_readiness", label:"发布就绪证据", value:"证据完整", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(model.status, "ready_for_review");
  assert.equal(model.title, "只读 RC 候选复核");
  assert.equal(model.cards.length, 4);
  assert.equal(model.cards[0].label, "候选复核");
  assert.equal(model.riskRows[0].value, "复核不代表交易能力");
  assert.equal(model.bookingUrl, null);
  const audit = api.buildFlightWorkflowRcReviewViewModelAuditDraft({ token:"abc" });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);

  const calls = { review:0, checklist:0, regression:0, releaseRisk:0 };
  windowRef.WeishanFlightWorkflowRcCandidateReviewConsole = {
    buildFlightWorkflowRcCandidateReviewConsole:function () {
      calls.review += 1;
      return { status:"ready_for_review", safeToStartRcReview:true, rows:[], userFacingSummary:{ resultLabel:"ready" } };
    }
  };
  windowRef.WeishanFlightWorkflowRcEvidenceReviewChecklist = {
    buildFlightWorkflowRcEvidenceReviewChecklist:function () {
      calls.checklist += 1;
      return { status:"complete", rows:[], userFacingSummary:{ resultLabel:"complete" } };
    }
  };
  windowRef.WeishanFlightWorkflowRcRegressionAuditPack = {
    buildFlightWorkflowRcRegressionAuditPack:function () {
      calls.regression += 1;
      return { status:"passed", auditHealth:{}, userFacingSummary:{ resultLabel:"passed" } };
    }
  };
  windowRef.WeishanFlightWorkflowReadOnlyReleaseRiskLedger = {
    buildFlightWorkflowReadOnlyReleaseRiskLedger:function () {
      calls.releaseRisk += 1;
      return { status:"clear", riskSummary:{ safeToContinueReleaseCandidate:true }, userFacingSummary:{ resultLabel:"clear" } };
    }
  };
  const fallbackModel = api.buildFlightWorkflowRcReviewViewModel({});
  assert.equal(fallbackModel.status, "ready_for_review");
  assert.deepEqual(calls, { review:1, checklist:1, regression:1, releaseRisk:1 }, "each fallback summary must be built once per RC view-model build");
  console.log("FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL PASS");
}
main();
