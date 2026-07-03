const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingCandidateConfidenceExplainer.js"]);
  const api = windowRef.WeishanGlobalShoppingCandidateConfidenceExplainer;
  assert.equal(api.GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION, "4.0.8");
  const ready = api.buildGlobalShoppingCandidateConfidenceExplainer({
    providerEvidenceTrace:{ evidenceItems:[
      { candidateId:"candidate_1", sourceId:"official_anchor", sourceName:"官方参考价", evidenceType:"official_anchor", evidenceStatus:"pass", trustLabel:"high" },
      { candidateId:"candidate_1", sourceId:"source_trust", sourceName:"来源可信度", evidenceType:"source_trust", evidenceStatus:"pass", trustLabel:"high" },
      { candidateId:"candidate_1", sourceId:"price_normalization", sourceName:"税费归一化", evidenceType:"tax_fee_normalization", evidenceStatus:"pass", trustLabel:"medium" },
      { candidateId:"candidate_1", sourceId:"covered_lowest", sourceName:"覆盖较低价", evidenceType:"covered_lowest", evidenceStatus:"pass", trustLabel:"medium" }
    ] },
    readOnlySourceTrustScore:{ status:"ready" },
    providerCoverageDashboard:{ status:"ready" },
    normalizedPriceCandidateBoard:{ status:"ready" },
    candidateItems:[{ candidateId:"candidate_1", sourceId:"official_anchor", sourceName:"官方参考价" }]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.confidenceExplanations[0].confidenceLabel, "high");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{ evidenceItems:[] }, candidateItems:[{ candidateId:"x" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{}, candidateItems:[{ candidateId:"x" }], claimsLowestPriceGuarantee:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{}, candidateItems:[{ candidateId:"x" }], claimsBestPriceGuarantee:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{}, candidateItems:[{ candidateId:"x" }], claimsOfficialEndorsement:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{}, candidateItems:[{ candidateId:"x" }], claimsAvailability:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingCandidateConfidenceExplainer({ providerEvidenceTrace:{}, candidateItems:[{ candidateId:"x" }], payment:true }).status, "blocked");
  assert.equal(/token|secret|apiKey/i.test(JSON.stringify(ready)), false);
  console.log("GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER PASS");
}
main();