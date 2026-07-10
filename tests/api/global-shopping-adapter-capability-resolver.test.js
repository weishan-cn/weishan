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
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingAdapterCapabilityResolver;
  const amazon = api.buildGlobalShoppingAdapterCapabilityResult({
    provider:{ providerId:"amazon_us", categories:["product"], capabilities:["search", "detail_page", "cross_border_reference"] }
  });
  const booking = api.buildGlobalShoppingAdapterCapabilityResult({
    provider:{ providerId:"booking", categories:["hotel"], capabilities:["search", "price_compare", "official_referral"] }
  });

  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_CAPABILITY_RESOLVER_VERSION, "4.2.8");
  assert.equal(amazon.productSearch, true);
  assert.equal(amazon.flightSearch, false);
  assert.equal(booking.hotelSearch, true);
  assert.equal(Array.isArray(booking.availableData), true);
  console.log("GLOBAL_SHOPPING_ADAPTER_CAPABILITY_RESOLVER PASS");
}

main();
