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
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingRegionalProviderSelector.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingRegionalProviderSelector;
  const result = api.buildGlobalShoppingRegionalProviderCandidates({
    regionContext:{ country:"JP", market:"JP", language:"ja-JP" },
    category:"product",
    providers:windowRef.WeishanGlobalShoppingProviderRegistry.listGlobalShoppingProviders().filter((item) => item.categories.indexOf("product") >= 0)
  });

  assert.equal(api.GLOBAL_SHOPPING_REGIONAL_PROVIDER_SELECTOR_VERSION, "4.2.8");
  assert.equal(result.candidates.length > 0, true);
  assert.match(result.candidates[0].regionReason, /地区|市场|语言/);
  assert.equal(typeof result.candidates[0].marketMatched, "boolean");
  console.log("GLOBAL_SHOPPING_REGIONAL_PROVIDER_SELECTOR PASS");
}

main();
