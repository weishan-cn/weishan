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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenResponseSchema.js");
  const api = windowRef.WeishanGlobalShoppingRakutenResponseSchema;
  const product = api.buildGlobalShoppingRakutenResponseSchema({ operation:"searchProducts" });
  const hotel = api.buildGlobalShoppingRakutenResponseSchema({ operation:"searchHotels" });

  assert.equal(product.operation.topLevelFields.includes("items"), true);
  assert.equal(product.operation.itemFields.includes("itemUrl"), true);
  assert.equal(hotel.operation.topLevelFields.includes("hotels"), true);
  assert.equal(hotel.operation.itemFields.includes("hotelInformationUrl"), true);
  console.log("GLOBAL_SHOPPING_RAKUTEN_RESPONSE_SCHEMA PASS");
}

main();
