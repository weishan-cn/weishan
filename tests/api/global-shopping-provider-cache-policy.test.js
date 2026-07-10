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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderCachePolicy.js");
  const api = windowRef.WeishanGlobalShoppingProviderCachePolicy;
  const metadata = api.buildGlobalShoppingProviderCachePolicy({ providerId:"amazon_japan", dataType:"metadata" });
  const price = api.buildGlobalShoppingProviderCachePolicy({ providerId:"amazon_japan", dataType:"price" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CACHE_POLICY_VERSION, "4.2.8");
  assert.equal(metadata.cacheable, true);
  assert.equal(metadata.ttl, 86400);
  assert.equal(price.ttl, 300);
  console.log("GLOBAL_SHOPPING_PROVIDER_CACHE_POLICY PASS");
}

main();
