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
      { providerId:"amazon_us", name:"Amazon" },
      { providerId:"apple_official", name:"Apple 官方" },
      { providerId:"bestbuy", name:"Best Buy" }
    ],
    adapterAvailable:false
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_FALLBACK_ENGINE_VERSION, "4.2.8");
  assert.equal(result.usedFallback, true);
  assert.equal(result.fallbackProviderName, "Apple 官方");
  assert.equal(Array.isArray(result.fallbackChain), true);
  assert.equal(result.fallbackStrategy.level, "global_platform");
  assert.equal(Array.isArray(result.fallbackStrategy.levels), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_FALLBACK_ENGINE PASS");
}

main();
