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
const trust = windowRef.WeishanGlobalCommerceMerchantTrust;
const decision = windowRef.WeishanGlobalCommerceDecision;
let calls = 0;
const getter = {};
Object.defineProperty(getter, "value", { get() { calls += 1; return 1; } });
const setter = {};
Object.defineProperty(setter, "value", { set() {} });
const circular = {};
circular.self = circular;
const unsafe = [
  getter, setter, { toJSON() { throw Error("must not run"); } }, { toString() { throw Error("must not run"); } },
  { valueOf() { throw Error("must not run"); } }, { [Symbol.iterator]:function () { throw Error("must not run"); } },
  circular, JSON.parse('{"__proto__":{"polluted":true}}'), { value:Symbol("x") }, { value:1n }, { value:NaN }, { value:Infinity }, { value:-Infinity }
];
const publicFunctions = [
  trust.createMerchantTrustSnapshot, trust.validateMerchantTrustSnapshot, trust.normalizeTrustEvidence,
  trust.calculateMerchantTrustScore, trust.compareMerchantTrustSnapshots, trust.createMerchantTrustAssessment,
  decision.createDecisionInput, decision.validateDecisionInput, decision.calculateDecisionScores,
  decision.createDecisionExplanation, decision.createCommerceDecision, decision.compareCommerceDecisions
];
unsafe.forEach((input) => publicFunctions.forEach((fn) => {
  const result = fn(input);
  assert.equal(result.success, false);
  assert.equal(result.error.code, "COMMERCE_INPUT_REJECTED");
  assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false);
}));
assert.equal(calls, 0);

["token", "accessToken", "refreshToken", "apiKey", "secret", "password", "authorization", "cookie", "endpoint", "providerResponse", "stack", "internalError", "rawError", "credentials"].forEach((key) => {
  const marker = "sensitive-" + key;
  const input = Object.assign({ merchantId:"m", merchantType:"UNKNOWN" }, { [key]:marker });
  const result = trust.createMerchantTrustSnapshot(input);
  assert.equal(result.error.code, "COMMERCE_INPUT_REJECTED");
  assert.equal(JSON.stringify(result).includes(marker), false);
});
const projected = decision.createCommerceDecision({
  candidateId:"safe",
  pricing:{ currency:"USD", basePrice:1 },
  availability:{ status:"IN_STOCK", quantity:1, shippingAvailable:true, preorder:false, backorder:false },
  merchantTrust:{ merchantId:"safe-merchant", merchantType:"UNKNOWN" },
  userProfile:"discard",
  redirectUrl:"discard",
  analytics:"discard"
});
assert.equal(projected.success, true);
["userProfile", "redirectUrl", "analytics", "merchantId"].forEach((key) => assert.equal(Object.prototype.hasOwnProperty.call(projected.decision, key), false));
console.log("GLOBAL_COMMERCE_MERCHANT_DECISION_SECURITY PASS");
