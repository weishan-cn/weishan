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
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuthAbstraction.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRequestSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenResponseSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenFieldMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRateLimitModel.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenErrorMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuditTrace.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRealProviderAdapterContractLayer.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingRakutenRealProviderAdapterContractLayer;
  const result = api.buildGlobalShoppingRakutenRealProviderAdapterContractLayer({ providerId:"rakuten_japan", operation:"searchProducts" });

  assert.equal(result.status, "documented");
  assert.equal(result.authentication.authType, "app_id_access_key");
  assert.equal(result.requestSchema.operation.endpointName, "rakuten_ichiba_item_search");
  assert.equal(result.responseSchema.operation.topLevelFields.includes("items"), true);
  assert.equal(result.fieldMapping.operation.targetUrl, "itemUrl");
  assert.equal(result.transactionEnabled, false);
  assert.equal(result.credentialStorageAllowed, false);
  console.log("GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_CONTRACT_LAYER PASS");
}

main();
