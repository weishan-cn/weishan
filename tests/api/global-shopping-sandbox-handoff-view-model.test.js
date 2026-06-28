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
    "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js"
  ]);
  const partner = windowRef.WeishanGlobalShoppingPartnerLinkPolicy.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  const availability = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:partner });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const sandbox = windowRef.WeishanGlobalShoppingSandboxDeepLinkCandidate.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability });
  const api = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION, "2.1.93");
  const ready = api.buildGlobalShoppingSandboxHandoffViewModel({ sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  assert.equal(ready.appVersion, "2.1.93");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Sandbox 跳转候选与平台可用性");
  assert.equal(ready.cards[0].label, "Sandbox 跳转候选");
  assert.equal(ready.cards[1].label, "平台可用性");
  assert.equal(ready.cards[2].label, "合作/联盟链接政策");
  assert.equal(ready.safeToProceedWithPartnerFixtureAdapter, true);
  assert.equal(api.buildGlobalShoppingSandboxHandoffViewModel({ sandboxDeepLinkCandidateSummary:Object.assign({}, sandbox, { status:"needs_review" }), platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingSandboxHandoffViewModel({ sandboxDeepLinkCandidateSummary:Object.assign({}, sandbox, { status:"blocked" }), platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner }).status, "blocked");
  console.log("GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL PASS");
}
main();
