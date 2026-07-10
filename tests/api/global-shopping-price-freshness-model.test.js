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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingPriceFreshnessModel.js");
  const api = windowRef.WeishanGlobalShoppingPriceFreshnessModel;
  const fresh = api.buildGlobalShoppingPriceFreshnessModel({
    fetchedAt:"2026-07-09T00:00:00.000Z",
    now:"2026-07-09T00:03:00.000Z"
  });
  const stale = api.buildGlobalShoppingPriceFreshnessModel({
    fetchedAt:"2026-07-09T00:00:00.000Z",
    now:"2026-07-09T02:00:00.000Z"
  });

  assert.equal(api.GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL_VERSION, "4.2.8");
  assert.equal(fresh.freshnessLevel, "fresh");
  assert.equal(stale.freshnessLevel, "stale");
  console.log("GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL PASS");
}

main();
