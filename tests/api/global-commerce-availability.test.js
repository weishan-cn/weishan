const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalCommerceInputGuard.js", "globalCommerceAvailability.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core", file), "utf8"), context);
});
const availability = windowRef.WeishanGlobalCommerceAvailability;
const inStock = { status:"IN_STOCK", quantity:2, regionRestricted:false, shippingAvailable:true, preorder:false, backorder:false, estimatedDelivery:{ minDays:1, maxDays:3 } };
const result = availability.createAvailabilitySnapshot(inStock);
assert.equal(result.success, true);
assert.equal(result.snapshot.purchasable, true);
assert.deepEqual(JSON.parse(JSON.stringify(result.snapshot.reasonCodes)), ["IN_STOCK"]);
["LIMITED", "OUT_OF_STOCK", "PREORDER", "BACKORDER", "UNKNOWN"].forEach((status) => {
  const input = Object.assign({}, inStock, { status, quantity:status === "OUT_OF_STOCK" ? 0 : 2, preorder:status === "PREORDER", backorder:status === "BACKORDER" });
  const value = availability.createAvailabilitySnapshot(input);
  assert.equal(value.success, true);
});
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { status:"OUT_OF_STOCK", quantity:1 })).error.code, "AVAILABILITY_CONFLICT");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { status:"IN_STOCK", quantity:0 })).error.code, "AVAILABILITY_CONFLICT");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { status:"PREORDER", preorder:false })).error.code, "AVAILABILITY_CONFLICT");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { preorder:true, backorder:true })).error.code, "AVAILABILITY_CONFLICT");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { shippingAvailable:false, purchasable:true })).snapshot.purchasable, false);
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { regionRestricted:true, requestedRegion:"jp", allowedRegions:["JP"], blockedRegions:["JP"] })).snapshot.reasonCodes[0], "REGION_BLOCKED");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { regionRestricted:true, allowedRegions:["JP"] })).snapshot.reasonCodes[0], "REGION_REQUIRED");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { estimatedDelivery:{ minDays:4, maxDays:2 } })).error.code, "AVAILABILITY_INPUT_INVALID");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { quantity:1.5 })).error.code, "AVAILABILITY_INPUT_INVALID");
assert.equal(availability.createAvailabilitySnapshot(Object.assign({}, inStock, { quantity:"2" })).error.code, "AVAILABILITY_INPUT_INVALID");
assert.equal(availability.determinePurchasability(inStock).purchasable, true);

const compared = availability.compareAvailabilitySnapshots([
  Object.assign({}, inStock, { status:"UNKNOWN", quantity:null }),
  Object.assign({}, inStock, { status:"OUT_OF_STOCK", quantity:0 }),
  Object.assign({}, inStock, { status:"LIMITED", quantity:1 })
]);
assert.deepEqual(JSON.parse(JSON.stringify(compared.snapshots.map((item) => item.status))), ["LIMITED", "UNKNOWN", "OUT_OF_STOCK"]);
const unchanged = JSON.stringify(inStock);
availability.createAvailabilitySnapshot(inStock);
assert.equal(JSON.stringify(inStock), unchanged);
result.snapshot.status = "OUT_OF_STOCK";
assert.equal(availability.createAvailabilitySnapshot(inStock).snapshot.status, "IN_STOCK");
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(availability.createAvailabilitySnapshot(inStock))), JSON.parse(JSON.stringify(availability.createAvailabilitySnapshot(inStock))));
console.log("GLOBAL_COMMERCE_AVAILABILITY PASS");
