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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenRequestSchema.js");
  const api = windowRef.WeishanGlobalShoppingRakutenRequestSchema;
  const product = api.buildGlobalShoppingRakutenRequestSchema({ operation:"searchProducts" });
  const hotel = api.buildGlobalShoppingRakutenRequestSchema({ operation:"searchHotels" });

  assert.equal(product.operation.endpointName, "rakuten_ichiba_item_search");
  assert.equal(product.operation.requiredParameters.includes("keyword"), true);
  assert.equal(hotel.operation.endpointName, "rakuten_travel_keyword_hotel_search");
  assert.equal(hotel.operation.optionalParameters.includes("responseType"), true);
  console.log("GLOBAL_SHOPPING_RAKUTEN_REQUEST_SCHEMA PASS");
}

main();
