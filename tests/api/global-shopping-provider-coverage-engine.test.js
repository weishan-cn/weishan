const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderCoverageEngine.js");
  const api = windowRef.WeishanGlobalShoppingProviderCoverageEngine;
  const result = api.buildGlobalShoppingProviderCoverage({
    provider:{ countries:["JP"], categories:["product"], languages:["ja-JP", "en-US"] },
    market:{ country:"JP", language:"ja-JP" },
    category:"product"
  });
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_COVERAGE_ENGINE_VERSION, "4.2.8");
  assert.equal(result.countryCoverage, 1);
  assert.equal(result.categoryCoverage, 1);
  assert.equal(result.languageCoverage, 1);
  assert.equal(result.coverageScore >= 90, true);
  console.log("GLOBAL_SHOPPING_PROVIDER_COVERAGE_ENGINE PASS");
}

main();
