const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp, Math });
[
  "globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js",
  "globalCommerceMerchantTrust.js", "globalCommerceDecision.js", "globalDecisionKnowledge.js",
  "globalDecisionExplanation.js", "globalDecisionRisk.js", "globalDecisionRecommendation.js",
  "globalDecisionCommerceAdapter.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));

const knowledge = windowRef.WeishanGlobalDecisionKnowledge;
const explanation = windowRef.WeishanGlobalDecisionExplanation;
const risk = windowRef.WeishanGlobalDecisionRisk;
const recommendation = windowRef.WeishanGlobalDecisionRecommendation;
const adapter = windowRef.WeishanGlobalDecisionCommerceAdapter;

const candidate = {
  candidateId:"hotel-a", pricing:{ currency:"JPY", basePrice:100, tax:10, shipping:0, priceConfidence:"MEDIUM" },
  availability:{ status:"LIMITED", quantity:1, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false },
  merchantTrust:{ merchantId:"hotel-merchant", merchantType:"OFFICIAL", official:true, verified:true, rating:4.7, reviewCount:300, fraudRisk:"LOW", evidence:[{ type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" }] }
};
const input = { candidate, alternatives:["hotel-b", "hotel-c"] };
assert.equal(knowledge.splitDecisionKnowledge([{ kind:"FACT", code:"A", summary:"Known declared fact." }, { kind:"ANALYSIS", code:"B", summary:"Analysis based on facts." }, { kind:"RECOMMENDATION", code:"C", summary:"A non-binding recommendation." }]).facts.length, 1);
assert.equal(knowledge.createDecisionKnowledge([{ kind:"FACT", code:"A", summary:"x", token:"blocked" }]).success, false);
assert.equal(explanation.createDecisionExplanation({ recommendationReason:"Declared evidence supports this option.", keyAdvantages:["Declared availability"], keyRisks:["Evidence is limited."], alternatives:["other"], confidence:"LOW", explanationType:"LIMITED_EVIDENCE_OFFLINE" }).success, true);
assert.equal(explanation.createDecisionExplanation({ recommendationReason:"x", keyAdvantages:[], keyRisks:[], alternatives:[], confidence:"LOW", explanationType:"LIMITED_EVIDENCE_OFFLINE" }).success, false);
assert.equal(risk.createRiskAssessment([{ type:"PRICE_RISK", reason:"Price evidence is limited." }]).risks[0].type, "PRICE_RISK");
assert.equal(recommendation.createRecommendationOutput({ recommendation:"hotel-a", whyRecommended:"Declared evidence supports it.", advantages:["Declared trust"], risks:["Evidence is limited."], alternatives:["hotel-b"], confidence:"MEDIUM" }).output.userDecisionRequired, true);
const result = adapter.createCommerceDecisionIntelligence(input);
assert.equal(result.success, true);
assert.equal(result.decisionIntelligence.recommendation.userDecisionRequired, true);
assert.equal(result.decisionIntelligence.recommendation.userChoiceReminder.includes("final decision is yours"), true);
assert.equal(result.decisionIntelligence.knowledge.facts.length, 3);
assert.equal(result.decisionIntelligence.knowledge.analysis.length, 1);
assert.equal(result.decisionIntelligence.knowledge.recommendations.length, 1);
assert.equal(result.decisionIntelligence.explanation.explanationType, "EVIDENCE_BASED_OFFLINE");
assert.equal(result.decisionIntelligence.risks.length >= 1, true);
assert.equal(JSON.stringify(result).includes("merchantId"), false);
assert.equal(JSON.stringify(result).includes("token"), false);
assert.equal(JSON.stringify(input), JSON.stringify({ candidate, alternatives:["hotel-b", "hotel-c"] }));
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(adapter.createCommerceDecisionIntelligence(input))), JSON.parse(JSON.stringify(result)));
const getterInput = {};
Object.defineProperty(getterInput, "candidate", { get() { throw new Error("getter must not execute"); } });
assert.equal(adapter.createCommerceDecisionIntelligence(getterInput).success, false);
console.log("GLOBAL_DECISION_INTELLIGENCE PASS");
