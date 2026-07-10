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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js");
  const api = windowRef.WeishanGlobalShoppingProviderErrorNormalizer;
  const timeout = api.buildGlobalShoppingProviderErrorNormalizer({ statusCode:408, message:"request timeout" });
  const unauthorized = api.buildGlobalShoppingProviderErrorNormalizer({ statusCode:401, message:"unauthorized" });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ERROR_NORMALIZER_VERSION, "4.2.8");
  assert.equal(timeout.category, "timeout");
  assert.equal(timeout.retryable, true);
  assert.equal(unauthorized.category, "unauthorized");
  assert.equal(unauthorized.retryable, false);
  console.log("GLOBAL_SHOPPING_PROVIDER_ERROR_NORMALIZER PASS");
}

main();
