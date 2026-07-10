const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderHealthEngine.js");
  const api = windowRef.WeishanGlobalShoppingProviderHealthEngine;
  const result = api.buildGlobalShoppingProviderHealth({
    adapterStatus:{ status:"planned" },
    dataQuality:{ qualityLevel:"medium" },
    freshness:{ freshnessLevel:"recent" }
  });
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_HEALTH_ENGINE_VERSION, "4.2.8");
  assert.equal(result.healthStatus, "limited");
  console.log("GLOBAL_SHOPPING_PROVIDER_HEALTH_ENGINE PASS");
}

main();
