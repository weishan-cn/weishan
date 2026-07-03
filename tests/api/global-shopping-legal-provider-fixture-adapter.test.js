const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingLegalProviderFixtureAdapter.js"]);
  const api = windowRef.WeishanGlobalShoppingLegalProviderFixtureAdapter;
  assert.equal(api.GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION, "4.1.2");
  const ready = api.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerRegion:"CN", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", officialFixturePrice:{ title:"SHA-CTU", basePrice:900, taxAmount:120, currency:"CNY" } });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "合法 Provider Fixture 适配器");
  assert.equal(ready.normalizedSourceInputs.length, 1);
  assert.equal(ready.providerFixture.productionDisabled, true);
  assert.equal(api.buildGlobalShoppingLegalProviderFixtureAdapter({ providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture" }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"blocked", providerStatus:"fixture", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", canFetchLivePrice:true, officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 }, token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(/abc|https:\/\/blocked/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER PASS");
}
main();
