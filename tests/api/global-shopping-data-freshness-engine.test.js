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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingDataFreshnessEngine.js");
  const api = windowRef.WeishanGlobalShoppingDataFreshnessEngine;
  const fresh = api.buildGlobalShoppingDataFreshness({
    timestamp:"2026-07-10T00:00:00.000Z",
    now:"2026-07-10T00:03:00.000Z"
  });
  const expired = api.buildGlobalShoppingDataFreshness({
    timestamp:"2026-07-08T00:00:00.000Z",
    now:"2026-07-10T00:00:00.000Z"
  });

  assert.equal(api.GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_VERSION, "4.2.8");
  assert.equal(fresh.freshnessLevel, "fresh");
  assert.equal(expired.freshnessLevel, "expired");
  assert.equal(expired.isUsable, false);
  console.log("GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE PASS");
}

main();
