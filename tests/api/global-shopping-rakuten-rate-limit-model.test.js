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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenRateLimitModel.js");
  const api = windowRef.WeishanGlobalShoppingRakutenRateLimitModel;
  const result = api.buildGlobalShoppingRakutenRateLimitModel({});

  assert.equal(result.exactLimitKnown, false);
  assert.equal(result.policy, "identical_request_burst_sensitive");
  assert.equal(result.networkExecutionEnabled, false);
  console.log("GLOBAL_SHOPPING_RAKUTEN_RATE_LIMIT_MODEL PASS");
}

main();
