const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRankingEngine.js"
  ]);
  const registry = windowRef.WeishanGlobalShoppingProviderRegistry;
  const api = windowRef.WeishanGlobalShoppingProviderRankingEngine;
  const usResult = api.buildGlobalShoppingRankedProviderList({
    shoppingContext:{ userRegion:"US", destinationCountry:"US", preferredMarket:"US", language:"en-US", currency:"USD" },
    userIntent:{ category:"product", query:"iPhone" },
    providers:registry.listGlobalShoppingProviders().filter((item) => item.categories.includes("product"))
  });
  const japanResult = api.buildGlobalShoppingRankedProviderList({
    shoppingContext:{ userRegion:"JP", destinationCountry:"JP", preferredMarket:"JP", language:"ja-JP", currency:"JPY" },
    userIntent:{ category:"product", query:"任天堂" },
    providers:registry.listGlobalShoppingProviders().filter((item) => item.categories.includes("product"))
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_RANKING_ENGINE_VERSION, "4.2.8");
  assert.equal(usResult.rankedProviders.length >= 3, true);
  assert.match(usResult.rankedProviders[0].name, /Apple|Amazon|Best Buy/);
  assert.match(japanResult.rankedProviders[0].name, /Amazon Japan|Rakuten/);
  assert.equal(Array.isArray(usResult.rankedProviders[0].rankingReason), true);
  assert.equal(usResult.rankedProviders[0].totalScore >= usResult.rankedProviders[1].totalScore, true);
  console.log("GLOBAL_SHOPPING_PROVIDER_RANKING_ENGINE PASS");
}

main();
