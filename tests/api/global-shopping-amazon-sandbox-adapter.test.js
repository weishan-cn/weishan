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
    "apps/desktop/src/renderer/core/globalShoppingAmazonSandboxAdapter.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingAmazonSandboxAdapter;
  const adapter = api.createGlobalShoppingAmazonSandboxAdapter({ providerId:"amazon_us" });
  const result = adapter.searchProducts({ query:"iphone", currency:"USD", capturedAt:"2026-07-10T00:00:00.000Z" });

  assert.equal(api.GLOBAL_SHOPPING_AMAZON_SANDBOX_ADAPTER_VERSION, "4.2.8");
  assert.equal(result.sourceType, "sandbox");
  assert.equal(result.dataConfidence, "mock");
  assert.equal(result.results[0].officialUrl.includes("amazon.com"), true);
  console.log("GLOBAL_SHOPPING_AMAZON_SANDBOX_ADAPTER PASS");
}

main();
