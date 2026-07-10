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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderIntegrationManifest.js");
  const api = windowRef.WeishanGlobalShoppingProviderIntegrationManifest;
  const manifest = api.buildGlobalShoppingProviderIntegrationManifest({
    providerId:"amazon_us",
    officialDomain:"amazon.com",
    authType:"planned",
    capabilities:["search", "price_read"],
    permissions:["search", "price_read"],
    regions:["US", "GLOBAL"]
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_INTEGRATION_MANIFEST_VERSION, "4.2.8");
  assert.equal(manifest.dataPolicy.noApiKeyStorage, true);
  assert.equal(manifest.dataPolicy.noTokenStorage, true);
  assert.equal(manifest.officialDomain, "amazon.com");
  console.log("GLOBAL_SHOPPING_PROVIDER_INTEGRATION_MANIFEST PASS");
}

main();
