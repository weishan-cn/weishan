const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window.WeishanGlobalShoppingReleaseCandidateConfidenceBoard;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingReleaseCandidateConfidenceBoard.js");
  assert.equal(api.GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingReleaseCandidateConfidenceBoard({
    providerZeroLocked:true,
    noNetwork:true,
    noKey:true,
    noEndpoint:true,
    noExternalOpen:true,
    noPayment:true,
    noOrder:true,
    noTicketing:true,
    noRawPersistence:true,
    safetyCopyClean:true,
    candidateEvidenceReady:true,
    feeNormalizationReady:true,
    officialAnchorReady:true,
    userBoundaryClear:true,
    manualReviewRequired:true
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.paymentUrl, null);
  assert.equal(api.buildGlobalShoppingReleaseCandidateConfidenceBoard({
    providerZeroLocked:false,
    noNetwork:true,
    noKey:true,
    noEndpoint:true,
    noExternalOpen:true,
    noPayment:true,
    noOrder:true,
    noTicketing:true,
    noRawPersistence:true,
    safetyCopyClean:true,
    candidateEvidenceReady:true,
    feeNormalizationReady:true,
    officialAnchorReady:true,
    userBoundaryClear:true,
    manualReviewRequired:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReleaseCandidateConfidenceBoard({
    providerZeroLocked:true,
    noNetwork:true,
    noKey:true,
    noEndpoint:true,
    noExternalOpen:true,
    noPayment:true,
    noOrder:true,
    noTicketing:true,
    noRawPersistence:true,
    safetyCopyClean:false,
    candidateEvidenceReady:true,
    feeNormalizationReady:true,
    officialAnchorReady:true,
    userBoundaryClear:true,
    manualReviewRequired:true
  }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_RELEASE_CANDIDATE_CONFIDENCE_BOARD PASS");
}

main();
