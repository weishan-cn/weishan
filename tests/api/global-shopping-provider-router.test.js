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
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRankingEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRouter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderRouter;
  const usProduct = api.buildGlobalShoppingProviderRoute({
    shoppingContext:{ userRegion:"US", destinationCountry:"US", preferredMarket:"US", language:"en-US", currency:"USD" },
    userIntent:{ category:"product", query:"iPhone" }
  });
  const japanProduct = api.buildGlobalShoppingProviderRoute({
    shoppingContext:{ userRegion:"JP", destinationCountry:"JP", preferredMarket:"JP", language:"ja-JP", currency:"JPY" },
    userIntent:{ category:"product", query:"任天堂" }
  });
  const euHotel = api.buildGlobalShoppingProviderRoute({
    shoppingContext:{ userRegion:"DE", destinationCountry:"FR", preferredMarket:"FR", language:"de-DE", currency:"EUR" },
    userIntent:{ category:"hotel", query:"Paris hotel" }
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ROUTER_VERSION, "4.2.8");
  assert.equal(usProduct.candidateProviders.length >= 3, true);
  assert.match(usProduct.candidateProviders[0].name, /Apple|Amazon|Best Buy/);
  assert.match(japanProduct.candidateProviders[0].name, /Amazon Japan|Rakuten/);
  assert.equal(euHotel.candidateProviders.some((item) => item.name === "Booking.com"), true);
  assert.equal(usProduct.candidateProviders[0].routingScore >= usProduct.candidateProviders[1].routingScore, true);
  assert.equal(typeof usProduct.candidateProviders[0].adapterCapability.productSearch, "boolean");
  assert.equal(usProduct.candidateProviders[0].adapterStatus.sourceType, "sandbox");
  console.log("GLOBAL_SHOPPING_PROVIDER_ROUTER PASS");
}

main();
