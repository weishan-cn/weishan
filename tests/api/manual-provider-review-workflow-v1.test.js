const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore(["apps/desktop/src/renderer/core/manualProviderReviewWorkflowV1.js"]);
const api = windowRef.WeishanManualProviderReviewWorkflowV1;

function main() {
  assert.equal(api.MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_VERSION, "4.2.6");
  assert.equal(api.REVIEW_STATES.includes("approved_for_limited_beta"), true);
  assert.equal(api.REVIEW_STATES.includes("approved_for_future_readonly"), true);

  const draft = api.buildManualProviderReviewWorkflowV1Draft();
  assert.equal(draft.status, "local manual review workflow only");
  assert.equal(draft.mode, "limited beta review only");
  assert.equal(draft.productionActivation, "disabled");
  assert.equal(draft.payment, "disabled");
  assert.equal(draft.order, "disabled");
  assert.equal(draft.bookingUrl, "disabled");
  assert.equal(draft.identityUpload, "disabled");
  assert.equal(draft.auditDraft.eventType, "MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_DRAFT");
  assert.equal(draft.auditDraft.approvedForLimitedBetaCount, 1);
  assert.equal(draft.auditDraft.fullProductionApprovalCount, 0);
  assert.equal(draft.auditDraft.paymentApprovalCount, 0);
  assert.equal(draft.auditDraft.orderApprovalCount, 0);
  assert.equal(draft.auditDraft.identityUploadApprovalCount, 0);
  assert.equal(draft.auditDraft.redacted, true);

  const flight = api.evaluateManualProviderReviewForBeta(api.buildSampleFlightProviderReview());
  assert.equal(flight.allowedForLimitedBeta, true);
  assert.equal(flight.manualReviewState, "approved_for_limited_beta");
  assert.equal(flight.fullProductionApproval, false);
  assert.equal(flight.paymentApproval, false);
  assert.equal(flight.orderApproval, false);
  assert.equal(flight.bookingUrlApproval, false);
  assert.equal(flight.identityUploadApproval, false);
  assert.equal(flight.auditDraft.approvedForLimitedBetaCount, 1);
  assert.equal(flight.auditDraft.fullProductionApprovalCount, 0);

  const product = api.evaluateManualProviderReviewForBeta(api.buildSampleRejectedProviderReview());
  assert.equal(product.allowedForLimitedBeta, false);
  assert.equal(product.blockedReasons.includes("limited beta flight only"), true);
  assert.notEqual(product.manualReviewState, "approved_for_limited_beta");

  const restricted = api.evaluateManualProviderReviewForBeta({ providerId:"restricted_provider", providerCategory:"restricted" });
  assert.equal(restricted.allowedForLimitedBeta, false);
  assert.equal(restricted.manualReviewState, "blocked");
  assert.equal(restricted.blockedReasons.includes("restricted category blocked"), true);

  const incomplete = api.evaluateManualProviderReviewForBeta({ providerId:"flight_provider", providerCategory:"flight" });
  assert.equal(incomplete.allowedForLimitedBeta, false);
  assert.equal(incomplete.missingFields.length > 0, true);

  const dangerous = api.evaluateManualProviderReviewForBeta(Object.assign(api.buildSampleFlightProviderReview(), { bookingUrl:"https://provider.example/book" }));
  assert.equal(dangerous.allowedForLimitedBeta, false);
  assert.equal(dangerous.blockedReasons.includes("write / booking / payment / identity surface present"), true);

  assert.equal(api.assertManualProviderReviewWorkflowV1Safe(draft), true);
  console.log("MANUAL_PROVIDER_REVIEW_WORKFLOW_V1_CORE PASS");
}

main();
