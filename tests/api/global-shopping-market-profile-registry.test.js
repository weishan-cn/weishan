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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingMarketProfileRegistry.js");
  const api = windowRef.WeishanGlobalShoppingMarketProfileRegistry;
  const japan = api.getGlobalShoppingMarketProfile({ country:"JP" });
  const fallback = api.getGlobalShoppingMarketProfile({ country:"BR" });

  assert.equal(api.GLOBAL_SHOPPING_MARKET_PROFILE_REGISTRY_VERSION, "4.2.8");
  assert.equal(japan.marketProfile.currency, "JPY");
  assert.equal(japan.marketProfile.preferredProviders.includes("amazon_japan"), true);
  assert.equal(fallback.marketProfile.currency, "USD");
  console.log("GLOBAL_SHOPPING_MARKET_PROFILE_REGISTRY PASS");
}

main();
