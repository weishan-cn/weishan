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
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderOnboardingRegistry.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderOnboardingRegistry;
  const amazon = api.getGlobalShoppingProviderOnboarding({ providerId:"amazon_us" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ONBOARDING_REGISTRY_VERSION, "4.2.8");
  assert.equal(Array.isArray(api.listGlobalShoppingProviderOnboardingRecords()), true);
  assert.equal(amazon.record.providerId, "amazon_us");
  assert.equal(amazon.record.adapterStatus, "sandbox");
  console.log("GLOBAL_SHOPPING_PROVIDER_ONBOARDING_REGISTRY PASS");
}

main();
