const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js"]);
  const api = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate;
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION, "3.7.0");
  const ready = api.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:{ status:"compliant" } });
  assert.equal(ready.appVersion, "3.7.0");
  assert.equal(ready.status, "available");
  assert.equal(ready.userFacingSummary.title, "平台可用性");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ sourceType:"major_platform", itemType:"flight", partnerLinkPolicySummary:{ status:"compliant" } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", itemType:"flight", partnerLinkPolicySummary:{ status:"compliant" } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", partnerLinkPolicySummary:{ status:"compliant" }, restrictedCategory:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", partnerLinkPolicySummary:{ status:"compliant" }, productionProvider:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", partnerLinkPolicySummary:{ status:"compliant" }, bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", partnerLinkPolicySummary:{ status:"compliant" }, openExternal:true }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingPlatformAvailabilityGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:{ status:"compliant" }, token:"abc" }));
  assert.equal(/abc|https:\/\/blocked/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE PASS");
}
main();
