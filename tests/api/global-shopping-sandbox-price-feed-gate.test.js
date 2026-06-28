const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingLegalProviderFixtureAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCredentialSafetyReview.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceFeedGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxPriceFeedGate;
  const legal = windowRef.WeishanGlobalShoppingLegalProviderFixtureAdapter.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } });
  const credential = windowRef.WeishanGlobalShoppingProviderCredentialSafetyReview.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture" });
  const ready = api.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legal, providerCredentialSafetySummary:credential, normalizedSourceInputs:legal.normalizedSourceInputs });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Sandbox 价格 Feed 闸门");
  assert.equal(api.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:Object.assign({}, legal, { status:"needs_review" }), providerCredentialSafetySummary:credential, normalizedSourceInputs:legal.normalizedSourceInputs }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legal, providerCredentialSafetySummary:Object.assign({}, credential, { status:"blocked" }), normalizedSourceInputs:legal.normalizedSourceInputs }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legal, providerCredentialSafetySummary:credential, normalizedSourceInputs:legal.normalizedSourceInputs, productionProvider:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE PASS");
}
main();
