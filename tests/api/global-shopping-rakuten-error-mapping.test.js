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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenErrorMapping.js");
  const api = windowRef.WeishanGlobalShoppingRakutenErrorMapping;
  const result = api.buildGlobalShoppingRakutenErrorMapping({});

  assert.equal(Array.isArray(result.mappings), true);
  assert.equal(result.mappings.some((item) => item.normalizedCategory === "rate_limit"), true);
  assert.equal(result.networkExecutionEnabled, false);
  console.log("GLOBAL_SHOPPING_RAKUTEN_ERROR_MAPPING PASS");
}

main();
