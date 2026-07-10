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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingDataProvenance.js");
  const api = windowRef.WeishanGlobalShoppingDataProvenance;
  const result = api.buildGlobalShoppingDataProvenance({
    decisionId:"amazon_japan:product:1",
    providerId:"amazon_japan",
    source:"sandbox",
    timestamp:"2026-07-10T00:00:00.000Z",
    transformations:["provider_sandbox_adapter", "response_normalizer", "decision_engine"]
  });

  assert.equal(api.GLOBAL_SHOPPING_DATA_PROVENANCE_VERSION, "4.2.8");
  assert.equal(result.transformations.length, 3);
  assert.equal(result.providerId, "amazon_japan");
  console.log("GLOBAL_SHOPPING_DATA_PROVENANCE PASS");
}

main();
