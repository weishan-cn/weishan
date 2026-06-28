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
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceFeedGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFixtureViewModel.js"
  ]);
  const legal = windowRef.WeishanGlobalShoppingLegalProviderFixtureAdapter.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } });
  const credential = windowRef.WeishanGlobalShoppingProviderCredentialSafetyReview.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture" });
  const feed = windowRef.WeishanGlobalShoppingSandboxPriceFeedGate.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legal, providerCredentialSafetySummary:credential, normalizedSourceInputs:legal.normalizedSourceInputs });
  const api = windowRef.WeishanGlobalShoppingProviderFixtureViewModel;
  const ready = api.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:legal, providerCredentialSafetySummary:credential, sandboxPriceFeedSummary:feed });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "合法 Provider Fixture 与 Sandbox 价格 Feed");
  assert.equal(ready.safeToProceedWithReadOnlyPriceProviderSandbox, true);
  assert.equal(ready.cards.length, 4);
  assert.equal(api.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:Object.assign({}, legal, { status:"needs_review" }), providerCredentialSafetySummary:credential, sandboxPriceFeedSummary:feed }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:Object.assign({}, legal, { status:"blocked" }), providerCredentialSafetySummary:credential, sandboxPriceFeedSummary:feed }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL PASS");
}
main();
