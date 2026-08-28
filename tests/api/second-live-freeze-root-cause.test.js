const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadReadOnlyCardWithFlightReviewStubs() {
  const calls = { review:0, regression:0, releaseRisk:0 };
  let reviewInput = null;
  const windowRef = {
    WeishanFlightWorkflowRcCandidateReviewConsole:{
      buildFlightWorkflowRcCandidateReviewConsole:function () {
        return { status:"ready_for_review", safeToStartRcReview:true, userFacingSummary:{ resultLabel:"ready" } };
      }
    },
    WeishanFlightWorkflowRcEvidenceReviewChecklist:{
      buildFlightWorkflowRcEvidenceReviewChecklist:function () {
        return { status:"complete", userFacingSummary:{ resultLabel:"complete" } };
      }
    },
    WeishanFlightWorkflowRcReviewViewModel:{
      buildFlightWorkflowRcReviewViewModel:function (input) {
        calls.review += 1;
        reviewInput = input;
        return { status:"ready_for_review", userFacingSummary:{ resultLabel:"ready" } };
      }
    },
    WeishanFlightWorkflowRcRegressionAuditPack:{
      buildFlightWorkflowRcRegressionAuditPack:function () {
        calls.regression += 1;
        return { status:"passed", auditHealth:{ status:"passed" }, userFacingSummary:{ resultLabel:"passed" } };
      }
    },
    WeishanFlightWorkflowReadOnlyReleaseRiskLedger:{
      buildFlightWorkflowReadOnlyReleaseRiskLedger:function () {
        calls.releaseRisk += 1;
        return { status:"clear", riskSummary:{ safeToContinueReleaseCandidate:true }, userFacingSummary:{ resultLabel:"clear" } };
      }
    }
  };
  windowRef.window = windowRef;
  const context = vm.createContext({ window:windowRef, console, URL });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js"), "utf8"),
    context,
    { filename:"readOnlyPriceCandidateCardViewModel.js" }
  );
  return { api:windowRef.WeishanReadOnlyPriceCandidateCardViewModel, calls, reviewInput:function () { return reviewInput; } };
}

function main() {
  const harness = loadReadOnlyCardWithFlightReviewStubs();
  harness.api.buildReadOnlyPriceCandidateCardViewModel({});

  assert.deepEqual(harness.calls, { review:1, regression:1, releaseRisk:1 });
  assert.equal(harness.reviewInput().rcRegressionAuditSummary.status, "passed");
  assert.equal(harness.reviewInput().releaseRiskLedgerSummary.status, "clear");
  assert.equal(harness.reviewInput().rcRegressionAuditSummary.auditHealth.status, "passed");
  assert.equal(harness.reviewInput().releaseRiskLedgerSummary.riskSummary.safeToContinueReleaseCandidate, true);

  console.log("SECOND_LIVE_FREEZE_ROOT_CAUSE PASS");
}

main();
