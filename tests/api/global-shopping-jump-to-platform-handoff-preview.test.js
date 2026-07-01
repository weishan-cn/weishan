const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformHandoffPreview.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingJumpToPlatformHandoffPreview;
  assert.equal(api.GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION, "3.4.0");
  const deepLink = windowRef.WeishanGlobalShoppingExternalDeepLinkSafetyGate.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", sourceName:"Sandbox Platform", disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。" });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const partner = windowRef.WeishanGlobalShoppingPartnerLinkPolicy.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  const availability = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:partner });
  const sandbox = windowRef.WeishanGlobalShoppingSandboxDeepLinkCandidate.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability });
  const ready = api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill, sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  assert.equal(ready.appVersion, "3.4.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.cards[0].label, "目标平台");
  assert.equal(ready.cards[1].label, "可带入搜索条件");
  assert.equal(ready.cards[2].label, "平台自行下单");
  assert.equal(ready.cards[3].label, "Sandbox 跳转候选");
  assert.equal(ready.cards[4].label, "平台可用性");
  assert.equal(ready.cards[5].label, "合作/联盟链接政策");
  assert.ok(ready.handoffRows.length > 0);
  assert.ok(ready.prefillRows.length > 0);
  assert.ok(ready.disclosureRows.length > 0);
  assert.equal(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ searchParameterPrefillSummary:prefill }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:Object.assign({}, deepLink, { status:"blocked" }), searchParameterPrefillSummary:prefill }).status, "blocked");
  assert.equal(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:Object.assign({}, prefill, { status:"blocked" }) }).status, "blocked");
  assert.equal(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill, caveat:"立即购买" }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill, token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked\.example/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW PASS");
}
main();
