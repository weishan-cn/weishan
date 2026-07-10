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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingDataSourceModel.js");
  const api = windowRef.WeishanGlobalShoppingDataSourceModel;
  const sandbox = api.buildGlobalShoppingDataSourceModel({
    providerId:"amazon_japan",
    sourceType:"sandbox",
    sourceStatus:"sandbox",
    trustLevel:"high"
  });
  const official = api.buildGlobalShoppingDataSourceModel({
    providerId:"amazon_japan",
    sourceType:"official_api"
  });

  assert.equal(api.GLOBAL_SHOPPING_DATA_SOURCE_MODEL_VERSION, "4.2.8");
  assert.equal(sandbox.sourceType, "sandbox");
  assert.equal(sandbox.dataPolicy.networkAccess, false);
  assert.equal(official.sourceType, "unknown");
  console.log("GLOBAL_SHOPPING_DATA_SOURCE_MODEL PASS");
}

main();
