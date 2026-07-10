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
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderAdapter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxProviderAdapter;
  const adapter = api.createGlobalShoppingSandboxProviderAdapter({
    provider:{
      providerId:"trip_com",
      categories:["flight", "hotel"],
      capabilities:["search", "price_compare", "inventory_reference"],
      searchTemplates:{ flight:"https://www.trip.com/flights/?keyword={query}" }
    }
  });
  const flight = adapter.searchFlights({ query:"成都 上海", currency:"CNY", capturedAt:"2026-07-09T00:00:00.000Z" });
  const price = adapter.getPrice({ category:"flight", currency:"CNY", capturedAt:"2026-07-09T00:00:00.000Z" });

  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_ADAPTER_VERSION, "4.2.8");
  assert.equal(flight.status, "sandbox");
  assert.equal(flight.sourceType, "sandbox");
  assert.equal(flight.results[0].confidence, "mock");
  assert.equal(price.available, true);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_ADAPTER PASS");
}

main();
