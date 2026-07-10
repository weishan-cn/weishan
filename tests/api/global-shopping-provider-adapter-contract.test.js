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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js");
  const api = windowRef.WeishanGlobalShoppingProviderAdapterContract;
  const result = api.buildGlobalShoppingProviderAdapterContract({ providerId:"amazon_japan" });
  const adapter = api.createGlobalShoppingProviderAdapter({ providerId:"amazon_japan" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION, "4.2.8");
  assert.equal(result.searchProducts.status, "planned");
  assert.equal(result.searchFlights.available, false);
  assert.equal(result.getPrice.networkEnabled, false);
  assert.equal(result.getTaxEstimate.readOnlyPreparation, true);
  assert.equal(result.getOfficialUrl.sourceType, "sandbox");
  assert.equal(result.syncMetadata.status, "planned");
  assert.equal(result.validateSource.available, false);
  assert.equal(result.getDataTimestamp.sourceType, "sandbox");
  assert.equal(result.getPrice.gatewayMetadata.gatewayMode, "sandbox_only");
  assert.equal(result.getPrice.permissionCheck.requiredPermission, "price_read");
  assert.equal(result.getPrice.requestContext.networkEnabled, false);
  assert.equal(Array.isArray(result.methods), true);
  assert.equal(adapter.searchHotels().status, "planned");
  assert.equal(adapter.syncMetadata().status, "planned");
  console.log("GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT PASS");
}

main();
