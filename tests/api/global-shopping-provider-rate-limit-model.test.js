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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderRateLimitModel.js");
  const api = windowRef.WeishanGlobalShoppingProviderRateLimitModel;
  const result = api.buildGlobalShoppingProviderRateLimitModel({
    providerId:"amazon_japan",
    limit:120,
    window:"1m",
    remaining:118,
    resetAt:"sandbox-reset"
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_RATE_LIMIT_MODEL_VERSION, "4.2.8");
  assert.equal(result.limit, 120);
  assert.equal(result.window, "1m");
  assert.equal(result.sourceType, "sandbox");
  console.log("GLOBAL_SHOPPING_PROVIDER_RATE_LIMIT_MODEL PASS");
}

main();
