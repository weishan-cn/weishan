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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingSandboxAdapterRegistry.js");
  const api = windowRef.WeishanGlobalShoppingSandboxAdapterRegistry;
  const registry = api.listGlobalShoppingSandboxAdapters();
  const booking = api.findGlobalShoppingSandboxAdapter({ providerId:"booking", category:"hotel" });

  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_ADAPTER_REGISTRY_VERSION, "4.2.8");
  assert.equal(Array.isArray(registry), true);
  assert.equal(registry.length >= 3, true);
  assert.equal(booking.status, "sandbox_ready");
  assert.equal(booking.adapterGlobal, "WeishanGlobalShoppingBookingSandboxAdapter");
  console.log("GLOBAL_SHOPPING_SANDBOX_ADAPTER_REGISTRY PASS");
}

main();
