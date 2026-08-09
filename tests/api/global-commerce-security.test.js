const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalCommerceInputGuard.js", "globalCommercePricing.js", "globalCommerceAvailability.js", "globalCommerceAssessment.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core", file), "utf8"), context);
});
const pricing = windowRef.WeishanGlobalCommercePricing;
const availability = windowRef.WeishanGlobalCommerceAvailability;
const assessment = windowRef.WeishanGlobalCommerceAssessment;

let getterCalls = 0;
const getter = {};
Object.defineProperty(getter, "input", { get() { getterCalls += 1; return {}; } });
const setter = {};
Object.defineProperty(setter, "input", { set() {} });
const methods = { toJSON() { throw Error("must not run"); }, toString() { throw Error("must not run"); }, valueOf() { throw Error("must not run"); } };
const circular = {};
circular.self = circular;
const polluted = JSON.parse('{"__proto__":{"x":1}}');
const symbol = { value:Symbol("x") };
const iterator = { [Symbol.iterator]:function () { throw Error("must not run"); } };
const unsafe = [getter, setter, methods, circular, polluted, symbol, iterator, { value:NaN }, { value:Infinity }, { value:-Infinity }];

const publicFunctions = [
  [pricing.createPriceSnapshot, pricing],
  [pricing.validatePriceSnapshot, pricing],
  [pricing.calculateEffectivePrice, pricing],
  [pricing.comparePriceSnapshots, pricing],
  [pricing.createPricingAssessment, pricing],
  [availability.createAvailabilitySnapshot, availability],
  [availability.validateAvailabilitySnapshot, availability],
  [availability.determinePurchasability, availability],
  [availability.compareAvailabilitySnapshots, availability],
  [availability.createAvailabilityAssessment, availability],
  [assessment.createCommerceAssessment, assessment]
];

unsafe.forEach((input) => publicFunctions.forEach(([fn, owner]) => {
  const result = fn.call(owner, input);
  assert.equal(result.success, false);
  assert.equal(result.error.code, "COMMERCE_INPUT_REJECTED");
  assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false);
}));
assert.equal(getterCalls, 0);

["token", "accessToken", "refreshToken", "apiKey", "secret", "password", "authorization", "cookie", "endpoint", "providerResponse", "stack", "internalError", "rawError", "credentials"].forEach((key) => {
  const marker = "sensitive-" + key;
  const input = Object.assign({ currency:"USD", basePrice:1 }, { [key]:marker });
  const result = pricing.createPriceSnapshot(input);
  assert.equal(result.error.code, "COMMERCE_INPUT_REJECTED");
  assert.equal(JSON.stringify(result).includes(marker), false);
});

const unknown = pricing.createPriceSnapshot({ currency:"USD", basePrice:1, futureField:"discard" });
assert.equal(unknown.success, true);
assert.equal(Object.prototype.hasOwnProperty.call(unknown.snapshot, "futureField"), false);
console.log("GLOBAL_COMMERCE_SECURITY PASS");
