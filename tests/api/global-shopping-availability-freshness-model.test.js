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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingAvailabilityFreshnessModel.js");
  const api = windowRef.WeishanGlobalShoppingAvailabilityFreshnessModel;
  const recent = api.buildGlobalShoppingAvailabilityFreshnessModel({
    checkedAt:"2026-07-09T00:00:00.000Z",
    now:"2026-07-09T00:20:00.000Z",
    availabilityStatus:"limited"
  });

  assert.equal(api.GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL_VERSION, "4.2.8");
  assert.equal(recent.availabilityStatus, "limited");
  assert.equal(recent.freshnessLevel, "recent");
  console.log("GLOBAL_SHOPPING_AVAILABILITY_FRESHNESS_MODEL PASS");
}

main();
