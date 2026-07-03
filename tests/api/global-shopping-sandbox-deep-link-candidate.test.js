const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxDeepLinkCandidate;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION, "4.1.2");
  const partner = windowRef.WeishanGlobalShoppingPartnerLinkPolicy.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  const availability = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:partner });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const ready = api.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability });
  assert.equal(ready.appVersion, "4.1.2");
  assert.equal(ready.status, "ready");
  assert.equal(ready.deepLinkCandidate.disabledToOpen, true);
  assert.equal(ready.deepLinkCandidate.bookingUrl, null);
  assert.equal(api.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceType:"major_platform", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingSandboxDeepLinkCandidate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", itemType:"flight", searchParameterPrefillSummary:{ status:"blocked" }, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxDeepLinkCandidate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:{ status:"blocked" }, platformAvailabilitySummary:availability }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxDeepLinkCandidate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability, openExternal:true }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingSandboxDeepLinkCandidate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability, token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE PASS");
}
main();
