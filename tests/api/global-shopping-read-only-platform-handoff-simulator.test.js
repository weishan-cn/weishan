const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js",
    "apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPlatformHandoffSimulator.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION, "4.0.0");
  const input = {
    sandboxDecisionReviewViewModel:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 候选决策复核已准备", redacted:true }, redacted:true },
    sandboxCandidateComparisonWorkbench:{ status:"ready", recommendationSummary:{ recommendedCandidateId:"candidate_a", redacted:true }, userFacingSummary:{ resultLabel:"候选对比已准备", redacted:true }, redacted:true },
    providerEvidenceComparisonMatrix:{ status:"ready", userFacingSummary:{ resultLabel:"证据矩阵已准备", redacted:true }, redacted:true },
    readOnlyHandoffReadinessDrill:{ status:"ready", userFacingSummary:{ resultLabel:"交接演练已准备", redacted:true }, redacted:true },
    itemType:"flight",
    origin:"SHA",
    destination:"CTU",
    departureDate:"2026-07-15",
    passengerCount:1,
    currency:"CNY"
  };
  const ready = api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(input);
  assert.equal(ready.appVersion, "4.0.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "交接模拟已准备");
  assert.equal(ready.simulationSummary.hasDecisionReview, true);
  assert.equal(ready.simulationSummary.hasCandidateComparison, true);
  assert.equal(ready.simulationSummary.hasEvidenceMatrix, true);
  assert.equal(ready.simulationSummary.hasHandoffDrill, true);
  assert.equal(ready.simulationSummary.hasRecommendedCandidate, true);
  assert.equal(ready.simulationTimeline.length >= 5, true);
  assert.equal(ready.handoffHealth.noRealUrl, true);
  assert.equal(ready.handoffHealth.noExternalOpen, true);
  assert.equal(ready.handoffHealth.noDownloadExport, true);
  assert.equal(ready.handoffHealth.noNetwork, true);
  assert.equal(ready.handoffHealth.noIdentityCarry, true);
  assert.equal(ready.handoffHealth.noPlatformCredentialCarry, true);
  assert.equal(ready.handoffHealth.noPaymentCredentialCarry, true);
  assert.equal(ready.handoffHealth.noCheckoutPaymentTicketing, true);
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({ sandboxCandidateComparisonWorkbench:input.sandboxCandidateComparisonWorkbench, providerEvidenceComparisonMatrix:input.providerEvidenceComparisonMatrix, readOnlyHandoffReadinessDrill:input.readOnlyHandoffReadinessDrill, itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({ sandboxDecisionReviewViewModel:input.sandboxDecisionReviewViewModel, providerEvidenceComparisonMatrix:input.providerEvidenceComparisonMatrix, readOnlyHandoffReadinessDrill:input.readOnlyHandoffReadinessDrill, itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({ sandboxDecisionReviewViewModel:input.sandboxDecisionReviewViewModel, sandboxCandidateComparisonWorkbench:input.sandboxCandidateComparisonWorkbench, readOnlyHandoffReadinessDrill:input.readOnlyHandoffReadinessDrill, itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({ sandboxDecisionReviewViewModel:input.sandboxDecisionReviewViewModel, sandboxCandidateComparisonWorkbench:input.sandboxCandidateComparisonWorkbench, providerEvidenceComparisonMatrix:input.providerEvidenceComparisonMatrix, itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({ sandboxDecisionReviewViewModel:input.sandboxDecisionReviewViewModel, sandboxCandidateComparisonWorkbench:{ status:"ready", recommendationSummary:{}, redacted:true }, providerEvidenceComparisonMatrix:input.providerEvidenceComparisonMatrix, readOnlyHandoffReadinessDrill:input.readOnlyHandoffReadinessDrill, itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { bookingUrl:"https://blocked.example" })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { openExternal:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { download:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { networkEnabled:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { identityIncluded:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { platformCredentialIncluded:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { paymentCredentialIncluded:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { checkout:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { payment:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { ticketing:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { claimsAvailability:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { claimsLockedPrice:true })).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { claimsBookability:true })).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingReadOnlyPlatformHandoffSimulator(Object.assign({}, input, { token:"abc", secret:"def" })));
  assert.equal(/abc|def|token|secret/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR PASS");
}

main();
