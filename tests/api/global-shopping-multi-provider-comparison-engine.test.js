const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingComparisonMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingMultiProviderComparisonEngine.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMultiProviderComparisonEngine;
  const result = api.buildGlobalShoppingMultiProviderComparison({
    category:"product",
    candidates:[
      { platformName:"Amazon Japan", title:"Nintendo Switch", priceLabel:"到平台查看实时价格", trustLevel:"high", taxSummary:{ taxConfidence:"estimated" } },
      { platformName:"Rakuten", title:"Nintendo Switch", priceLabel:"到平台查看实时价格", trustLevel:"medium", taxSummary:{ taxConfidence:"possible" } },
      { platformName:"Apple 官方", title:"Nintendo Switch", priceLabel:"到平台查看实时价格", trustLevel:"high", taxSummary:{ taxConfidence:"unknown" } }
    ]
  });

  assert.equal(api.GLOBAL_SHOPPING_MULTI_PROVIDER_COMPARISON_ENGINE_VERSION, "4.2.8");
  assert.equal(result.winner.provider.length > 0, true);
  assert.equal(Array.isArray(result.alternatives), true);
  assert.equal(Array.isArray(result.tradeoffs), true);
  assert.equal(result.comparisonMatrix.rowCount >= 2, true);
  console.log("GLOBAL_SHOPPING_MULTI_PROVIDER_COMPARISON_ENGINE PASS");
}

main();
