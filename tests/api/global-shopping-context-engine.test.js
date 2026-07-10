const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of [].concat(files)) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingRegionIntelligenceEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingContextEngine.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingContextEngine;
  const explicit = api.buildGlobalShoppingContext({
    userSelectedCountry:"US",
    destinationCountry:"JP",
    language:"zh-CN",
    currency:"USD"
  });
  const inferred = api.buildGlobalShoppingContext({
    ipRegion:"JP",
    query:"东京酒店"
  });
  const european = api.buildGlobalShoppingContext({
    systemRegion:"DE",
    normalizedFields:{ shippingCountry:"FR" }
  });

  assert.equal(api.GLOBAL_SHOPPING_CONTEXT_ENGINE_VERSION, "4.2.8");
  assert.equal(explicit.userRegion, "US");
  assert.equal(explicit.destinationCountry, "JP");
  assert.equal(explicit.source.userRegion, "user_selected_country");
  assert.equal(inferred.userRegion, "JP");
  assert.equal(inferred.currency, "JPY");
  assert.equal(european.destinationCountry, "FR");
  assert.equal(european.preferredMarket, "FR");
  assert.equal(explicit.regionContext.country, "US");
  assert.equal(explicit.regionContext.source.country, "user_selected_country");
  assert.equal(explicit.confidence > 0.9, true);
  console.log("GLOBAL_SHOPPING_CONTEXT_ENGINE PASS");
}

main();
