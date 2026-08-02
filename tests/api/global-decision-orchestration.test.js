const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js", "globalCommerceMerchantTrust.js", "globalCommerceDecision.js",
  "globalDecisionKnowledge.js", "globalDecisionExplanation.js", "globalDecisionRisk.js", "globalDecisionRecommendation.js", "globalDecisionCommerceAdapter.js",
  "globalDecisionOrchestrator.js", "globalDecisionArtifact.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));

const orchestrator = windowRef.WeishanGlobalDecisionOrchestrator;
const artifact = windowRef.WeishanGlobalDecisionArtifact;
const candidate = (id, priceConfidence, status, merchantType, risk) => ({
  candidateId:id,
  pricing:{ currency:"JPY", basePrice:100, tax:10, shipping:0, priceConfidence },
  availability:{ status, quantity:status === "OUT_OF_STOCK" ? 0 : 1, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false },
  merchantTrust:{ merchantId:"merchant-" + id, merchantType, official:merchantType === "OFFICIAL", authorized:merchantType === "AUTHORIZED", marketplace:merchantType === "MARKETPLACE", individual:merchantType === "INDIVIDUAL", verified:merchantType === "OFFICIAL", rating:merchantType === "OFFICIAL" ? 4.7 : null, reviewCount:merchantType === "OFFICIAL" ? 120 : 0, fraudRisk:risk, evidence:merchantType === "OFFICIAL" ? [{ type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" }] : [] }
});
const candidates = [candidate("hotel-a", "HIGH", "IN_STOCK", "OFFICIAL", "LOW"), candidate("hotel-b", "MEDIUM", "LIMITED", "MARKETPLACE", "UNKNOWN"), candidate("hotel-c", "LOW", "OUT_OF_STOCK", "INDIVIDUAL", "HIGH")];
const request = { requestType:"COMPARE", businessDomain:"COMMERCE", question:"Which offline hotel option is easier to evaluate?", constraints:{ cancellation:"unknown" }, preferences:{ priority:"value" }, context:{ businessType:"HOTEL", region:"JP", currency:"JPY", constraints:{ cancellation:"unknown" }, userProvidedPreferences:{ priority:"value" } } };
const requestResult = orchestrator.createDecisionRequest(request);
assert.equal(requestResult.success, true);
assert.equal(requestResult.request.context.source, "USER_PROVIDED_ONLY");
assert.equal(orchestrator.createDecisionRequest(Object.assign({}, request, { token:"blocked" })).success, false);
assert.equal(orchestrator.createDecisionContext({ businessType:"HOTEL", accessToken:"blocked" }).success, false);
assert.equal(orchestrator.selectRecommendations([]).code, "DECISION_ALTERNATIVES_REQUIRED");
const result = orchestrator.createDecisionReport({ request, candidates });
assert.equal(result.success, true);
assert.equal(result.report.recommendation.userDecisionRequired, true);
assert.equal(result.report.userDecisionRequired, true);
assert.equal(result.report.recommendation.recommendation, "hotel-a");
assert.equal(result.report.alternatives.length, 2);
assert.equal(result.report.alternatives.every((item) => item.whyRecommended && item.advantages.length && item.risks.length), true);
assert.equal(result.report.facts.length, 3);
assert.equal(result.report.analysis.length, 1);
assert.equal(result.report.risks.length >= 1, true);
assert.equal(JSON.stringify(result).includes("merchantId"), false);
assert.equal(JSON.stringify(result).includes("score"), false);
const outputArtifact = artifact.createDecisionArtifact({ requestSummary:request.question, facts:result.report.facts, analysis:result.report.analysis, recommendation:result.report.recommendation, confidence:result.report.confidence });
assert.equal(outputArtifact.success, true);
assert.equal(outputArtifact.artifact.trackingEnabled, false);
assert.equal(outputArtifact.artifact.storage, "OFFLINE_CONTRACT_ONLY");
assert.equal(artifact.createDecisionArtifact(Object.assign({}, { requestSummary:"x", facts:[], analysis:[], recommendation:{}, confidence:"LOW" }, { providerResponse:"blocked" })).success, false);
const inputJson = JSON.stringify({ request, candidates });
orchestrator.createDecisionReport({ request, candidates });
assert.equal(JSON.stringify({ request, candidates }), inputJson);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(orchestrator.createDecisionReport({ request, candidates }))), JSON.parse(JSON.stringify(result)));
const getterInput = {};
Object.defineProperty(getterInput, "request", { get() { throw new Error("getter must not execute"); } });
assert.equal(orchestrator.createDecisionReport(getterInput).success, false);
console.log("GLOBAL_DECISION_ORCHESTRATION PASS");
