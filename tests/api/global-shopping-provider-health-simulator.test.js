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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderHealthSimulator.js");
  const api = windowRef.WeishanGlobalShoppingProviderHealthSimulator;
  const timeout = api.buildGlobalShoppingProviderHealthSimulation({ providerId:"amazon_us", simulatedStatus:"timeout" });
  const slow = api.buildGlobalShoppingProviderHealthSimulation({ providerId:"booking", simulatedStatus:"slow" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_HEALTH_SIMULATOR_VERSION, "4.2.8");
  assert.equal(timeout.retryable, true);
  assert.equal(timeout.reason, "sandbox_timeout_simulation");
  assert.equal(slow.healthStatus, "slow");
  console.log("GLOBAL_SHOPPING_PROVIDER_HEALTH_SIMULATOR PASS");
}

main();
