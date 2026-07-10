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
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingCategoryIntelligenceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketCategoryMatrix.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMarketCategoryMatrix;
  const result = api.buildGlobalShoppingMarketCategoryMatrix({
    market:"JP",
    categoryId:"hotel"
  });
  assert.equal(api.GLOBAL_SHOPPING_MARKET_CATEGORY_MATRIX_VERSION, "4.2.8");
  assert.equal(result.rowCount > 0, true);
  assert.equal(result.rows.some((item) => item.providerName.length > 0), true);
  console.log("GLOBAL_SHOPPING_MARKET_CATEGORY_MATRIX PASS");
}

main();
