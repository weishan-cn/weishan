const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderFallbackEngine.js");
  const api = windowRef.WeishanGlobalShoppingProviderFallbackEngine;
  const result = api.buildGlobalShoppingProviderFallbackPlan({
    currentProvider:{ providerId:"amazon_us", name:"Amazon" },
    candidateProviders:[
      { providerId:"amazon_us", name:"Amazon", countries:["US"], languages:["en-US"], category:"product" },
      { providerId:"rakuten_japan", name:"Rakuten", countries:["JP"], languages:["ja-JP"], category:"product" },
      { providerId:"apple_official", name:"Apple 官方", countries:["US"], languages:["en-US"], category:"product", capabilities:["official_store"], officialDomains:["apple.com"] }
    ],
    providerHealth:{ healthStatus:"timeout" },
    providerHealthMap:{
      rakuten_japan:{ healthStatus:"healthy" },
      apple_official:{ healthStatus:"healthy" }
    },
    regionContext:{ country:"JP", language:"ja-JP" }
  });

  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackProviderName, "Rakuten");
  assert.equal(result.fallbackStrategy.level, "same_country_market");
  assert.equal(Array.isArray(result.fallbackTrace), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_FALLBACK_CHAIN PASS");
}

main();
