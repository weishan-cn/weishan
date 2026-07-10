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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js");
  const api = windowRef.WeishanGlobalShoppingProviderVersionRegistry;
  const result = api.getGlobalShoppingProviderVersionRecord({ providerId:"amazon_us" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_VERSION_REGISTRY_VERSION, "4.2.8");
  assert.equal(result.providerId, "amazon_us");
  assert.equal(result.status, "testing");
  assert.equal(result.adapterVersion, "4.2.8-sandbox");
  assert.equal(result.contractVersion, "4.2.8");
  assert.equal(result.compatibility, "sandbox_only");
  console.log("GLOBAL_SHOPPING_PROVIDER_VERSION_REGISTRY PASS");
}

main();
