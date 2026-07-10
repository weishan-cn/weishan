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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js");
  const api = windowRef.WeishanGlobalShoppingProviderCapabilityModel;
  const result = api.buildGlobalShoppingProviderCapabilityModel({
    providerId:"apple_official",
    capabilities:["search", "detail_page", "official_store"]
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CAPABILITY_MODEL_VERSION, "4.2.8");
  assert.equal(result.search, "available");
  assert.equal(result.price, "planned");
  assert.equal(result.officialProduct, "available");
  assert.equal(result.taxInfo, "disabled");
  assert.equal(result.summary.available.includes("search"), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_CAPABILITY PASS");
}

main();
