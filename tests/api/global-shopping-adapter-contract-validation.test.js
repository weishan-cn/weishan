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
  const contractApi = windowRef.WeishanGlobalShoppingProviderAdapterContract;
  const adapterApi = windowRef.WeishanGlobalShoppingAmazonSandboxAdapter;
  const adapter = adapterApi.createGlobalShoppingAmazonSandboxAdapter({ providerId:"amazon_us" });
  const result = contractApi.validateAdapterContract({
    adapter,
    providerId:"amazon_us",
    operation:"searchProducts",
    payload:{ query:"iphone", currency:"USD", capturedAt:"2026-07-10T00:00:00.000Z" }
  });

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.checkedMethods.includes("getOfficialUrl"), true);
  console.log("GLOBAL_SHOPPING_ADAPTER_CONTRACT_VALIDATION PASS");
}

main();
