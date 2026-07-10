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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js");
  const api = windowRef.WeishanGlobalShoppingProviderResponseNormalizer;
  const result = api.buildGlobalShoppingNormalizedProviderResponse({
    providerId:"amazon_us",
    category:"product",
    currency:"USD",
    response:{
      sourceType:"sandbox",
      results:[{
        title:"iPhone 16 Pro",
        category:"product",
        availability:"unknown",
        officialUrl:"https://www.amazon.com/s?k=iphone",
        timestamp:"2026-07-09T00:00:00.000Z"
      }]
    }
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_RESPONSE_NORMALIZER_VERSION, "4.2.8");
  assert.equal(result.normalizedResults[0].sourceType, "sandbox");
  assert.equal(result.normalizedResults[0].officialUrl.startsWith("https://"), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_RESPONSE_NORMALIZER PASS");
}

main();
