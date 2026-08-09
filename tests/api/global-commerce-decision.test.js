const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js", "globalCommerceMerchantTrust.js", "globalCommerceDecision.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core", file), "utf8"), context);
});
const decision = windowRef.WeishanGlobalCommerceDecision;
const base = {
  candidateId:"candidate-a",
  pricing:{ currency:"USD", basePrice:100, tax:0, shipping:0, discount:10, historicalPrice:150, priceConfidence:"HIGH" },
  availability:{ status:"IN_STOCK", quantity:1, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false, estimatedDelivery:{ minDays:1, maxDays:2 } },
  merchantTrust:{ merchantId:"merchant-a", merchantType:"OFFICIAL", official:true, verified:true, rating:4.5, reviewCount:100, fraudRisk:"LOW", evidence:[{ type:"OFFICIAL_DECLARATION", value:true, confidence:"HIGH" }, { type:"PLATFORM_VERIFICATION", value:true, confidence:"MEDIUM" }] },
  preferences:{ priceWeight:0.25, trustWeight:0.30, availabilityWeight:0.20, shippingWeight:0.10, promotionWeight:0.05, confidenceWeight:0.10 },
  futureUnknown:"discard"
};
const first = decision.createCommerceDecision(base);
assert.equal(first.success, true);
assert.equal(first.decision.decisionState, "ELIGIBLE");
assert.deepEqual(JSON.parse(JSON.stringify(first.decision.scores)), {
  priceScore:90, trustScore:89, availabilityScore:100, shippingScore:100, promotionScore:40, confidenceScore:100, recommendationScore:91.2
});
assert.equal(Object.prototype.hasOwnProperty.call(first.decision, "futureUnknown"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first.decision, "checkoutIntent"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first.decision, "redirectUrl"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first.decision, "analytics"), false);
assert.equal(first.decision.explanation.summaryCode, "STRONG_OFFLINE_MATCH");
assert.equal(first.decision.explanation.positiveReasons.includes("MERCHANT_TRUSTED"), true);
assert.equal(first.decision.explanation.scoreBreakdown.recommendationScore, 91.2);
assert.equal(decision.createDecisionInput(base).input.candidateId, "candidate-a");
assert.equal(decision.calculateDecisionScores(base).scores.promotionScore, 40);
assert.equal(decision.createDecisionExplanation(base).explanation.summaryCode, "STRONG_OFFLINE_MATCH");
assert.equal(decision.createCommerceDecision(Object.assign({}, base, { preferences:Object.assign({}, base.preferences, { priceWeight:0.9 }) })).error.code, "DECISION_WEIGHT_INVALID");
assert.equal(decision.createCommerceDecision(Object.assign({}, base, { availability:Object.assign({}, base.availability, { status:"OUT_OF_STOCK", quantity:0 }) })).decision.decisionState, "NOT_ELIGIBLE");
assert.equal(decision.createCommerceDecision(Object.assign({}, base, { merchantTrust:Object.assign({}, base.merchantTrust, { fraudRisk:"HIGH" }) })).decision.decisionState, "NOT_ELIGIBLE");
const conditional = decision.createCommerceDecision(Object.assign({}, base, {
  pricing:{ currency:"USD", basePrice:100, priceConfidence:"UNKNOWN" },
  merchantTrust:{ merchantId:"conditional", merchantType:"UNKNOWN", fraudRisk:"UNKNOWN" }
}));
assert.equal(conditional.decision.decisionState, "CONDITIONAL");
const unknown = decision.createCommerceDecision(Object.assign({}, base, {
  pricing:{ currency:"USD", basePrice:100, priceConfidence:"UNKNOWN" },
  availability:{ status:"PREORDER", quantity:1, regionRestricted:false, shippingAvailable:true, preorder:true, backorder:false },
  merchantTrust:{ merchantId:"unknown", merchantType:"UNKNOWN", fraudRisk:"UNKNOWN" }
}));
assert.equal(unknown.decision.decisionState, "UNKNOWN");
const mixed = decision.compareCommerceDecisions([base, Object.assign({}, base, { candidateId:"candidate-b", pricing:{ currency:"JPY", basePrice:90, priceConfidence:"HIGH" } })]);
assert.equal(mixed.comparable, false);
assert.equal(mixed.overallBest, null);
assert.deepEqual(JSON.parse(JSON.stringify(mixed.decisions.map((item) => item.candidateId))), ["candidate-a", "candidate-b"]);
const comparable = decision.compareCommerceDecisions([Object.assign({}, base, { candidateId:"low", pricing:{ currency:"USD", basePrice:100, priceConfidence:"HIGH" } }), base]);
assert.equal(comparable.comparable, true);
assert.equal(comparable.overallBest.candidateId, "candidate-a");
const inputText = JSON.stringify(base);
decision.createCommerceDecision(base);
assert.equal(JSON.stringify(base), inputText);
first.decision.candidateId = "changed";
assert.equal(decision.createCommerceDecision(base).decision.candidateId, "candidate-a");
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(decision.createCommerceDecision(base))), JSON.parse(JSON.stringify(first)));
console.log("GLOBAL_COMMERCE_DECISION PASS");
