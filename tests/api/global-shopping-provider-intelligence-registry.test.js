const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntelligenceRegistry.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderIntelligenceRegistry;
  const result = api.getGlobalShoppingProviderIntelligence({ providerId:"amazon_japan" });
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY_VERSION, "4.2.8");
  assert.equal(result.providerIntelligence.providerId, "amazon_japan");
  assert.equal(result.providerIntelligence.adapterStatus.length > 0, true);
  assert.equal(result.providerIntelligence.coverageScore > 0, true);
  assert.equal(result.providerIntelligence.qualityScore > 0, true);
  console.log("GLOBAL_SHOPPING_PROVIDER_INTELLIGENCE_REGISTRY PASS");
}

main();
