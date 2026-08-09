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
const assessment = windowRef.WeishanGlobalCommerceAssessment;
const input = {
  pricing:{ currency:"USD", basePrice:20, tax:2, shipping:3 },
  availability:{ status:"IN_STOCK", quantity:1, regionRestricted:true, allowedRegions:["US"], blockedRegions:[], shippingAvailable:true, preorder:false, backorder:false },
  requestedRegion:"us",
  futureUnknown:"discard"
};
const first = assessment.createCommerceAssessment(input);
assert.equal(first.success, true);
assert.deepEqual(JSON.parse(JSON.stringify(first.commerceState)), {
  priceValid:true, availabilityValid:true, comparable:true, purchasable:true,
  currency:"USD", effectivePrice:25, availabilityStatus:"IN_STOCK", reasonCodes:["IN_STOCK"]
});
assert.equal(Object.prototype.hasOwnProperty.call(first, "futureUnknown"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, "decision"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, "checkoutIntent"), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, "analytics"), false);
assert.equal(assessment.createCommerceAssessment(Object.assign({}, input, { availability:Object.assign({}, input.availability, { shippingAvailable:false }) })).commerceState.purchasable, false);
assert.equal(assessment.createCommerceAssessment(Object.assign({}, input, { availability:Object.assign({}, input.availability, { blockedRegions:["US"] }) })).commerceState.reasonCodes[0], "REGION_BLOCKED");
const mixed = assessment.createCommerceAssessment(Object.assign({}, input, { pricing:[{ currency:"USD", basePrice:1 }, { currency:"JPY", basePrice:1 }] }));
assert.equal(mixed.commerceState.comparable, false);
assert.equal(mixed.commerceState.effectivePrice, null);
assert.equal(assessment.createCommerceAssessment(Object.assign({}, input, { pricing:{ currency:"USD", basePrice:-1 } })).success, false);
assert.equal(assessment.createCommerceAssessment(Object.assign({}, input, { availability:{ status:"IN_STOCK", quantity:0, shippingAvailable:true, preorder:false, backorder:false } })).success, false);
const before = JSON.stringify(input);
assessment.createCommerceAssessment(input);
assert.equal(JSON.stringify(input), before);
first.availability.status = "OUT_OF_STOCK";
assert.equal(assessment.createCommerceAssessment(input).availability.status, "IN_STOCK");
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(assessment.createCommerceAssessment(input))), JSON.parse(JSON.stringify(assessment.createCommerceAssessment(input))));
console.log("GLOBAL_COMMERCE_ASSESSMENT PASS");
