const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxCandidateComparisonWorkbench.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxCandidateComparisonWorkbench;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION, "3.7.0");

  const ready = api.buildGlobalShoppingSandboxCandidateComparisonWorkbench({
    sandboxPriceCandidateResultBoard:{
      candidateItems:[
        { candidateId:"candidate_a", sourceName:"Official Fixture", sourceType:"official", totalPrice:920, taxesAndFees:120, officialAnchorStatus:"pass", coveredLowestStatus:"pass", handoffReadinessStatus:"pass", redacted:true },
        { candidateId:"candidate_b", sourceName:"Partner Fixture", sourceType:"partner", totalPrice:938, taxesAndFees:138, officialAnchorStatus:"needs_review", coveredLowestStatus:"needs_review", handoffReadinessStatus:"needs_review", redacted:true }
      ]
    },
    providerEvidenceTrace:{
      evidenceItems:[
        { candidateId:"candidate_a", evidenceType:"official_anchor", evidenceStatus:"pass", traceSummary:"官方参考价证据完整", redacted:true },
        { candidateId:"candidate_a", evidenceType:"covered_lowest", evidenceStatus:"pass", traceSummary:"已覆盖来源较低候选", redacted:true },
        { candidateId:"candidate_a", evidenceType:"handoff_preview", evidenceStatus:"pass", traceSummary:"交接演练参数完整", redacted:true }
      ]
    },
    candidateConfidenceExplainer:{
      confidenceExplanations:[
        { candidateId:"candidate_a", confidenceLabel:"high", redacted:true },
        { candidateId:"candidate_b", confidenceLabel:"medium", redacted:true }
      ]
    },
    readOnlySourceTrustScore:{
      trustScores:[
        { sourceId:"Official Fixture", trustLabel:"high", redacted:true },
        { sourceId:"Partner Fixture", trustLabel:"medium", redacted:true }
      ]
    },
    normalizedPriceCandidateBoard:{
      normalizedCandidates:[
        { candidateId:"candidate_a", sourceName:"Official Fixture", sourceType:"official", totalPrice:920, taxesAndFees:120, redacted:true },
        { candidateId:"candidate_b", sourceName:"Partner Fixture", sourceType:"partner", totalPrice:938, taxesAndFees:138, redacted:true }
      ]
    }
  });

  assert.equal(ready.appVersion, "3.7.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Sandbox 候选对比工作台");
  assert.equal(ready.comparisonSummary.candidateCount, 2);
  assert.equal(ready.comparisonSummary.hasOfficialAnchorCandidate, true);
  assert.equal(ready.comparisonSummary.hasHandoffReadyCandidate, true);
  assert.equal(ready.recommendationSummary.recommendationLabel, "review_first");
  assert.equal(ready.candidateRows[0].recommendationLabel, "review_first");
  assert.equal(ready.comparisonBoundary.canGenerateBookingUrl, false);
  assert.equal(ready.comparisonBoundary.canGeneratePaymentUrl, false);
  assert.equal(ready.comparisonBoundary.canGenerateOrderUrl, false);

  const blocked = api.buildGlobalShoppingSandboxCandidateComparisonWorkbench({ networkEnabled:true });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH PASS");
}

main();
