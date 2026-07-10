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
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenSandboxAdapter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingRakutenSandboxAdapter;
  const adapter = api.createGlobalShoppingRakutenSandboxAdapter({ providerId:"rakuten_japan" });
  const result = adapter.searchProducts({ query:"switch", currency:"JPY", capturedAt:"2026-07-10T00:00:00.000Z" });

  assert.equal(api.GLOBAL_SHOPPING_RAKUTEN_SANDBOX_ADAPTER_VERSION, "4.2.8");
  assert.equal(result.sourceType, "sandbox");
  assert.equal(result.results[0].confidence, "mock");
  assert.equal(result.results[0].officialUrl.includes("rakuten"), true);
  console.log("GLOBAL_SHOPPING_RAKUTEN_SANDBOX_ADAPTER PASS");
}

main();
