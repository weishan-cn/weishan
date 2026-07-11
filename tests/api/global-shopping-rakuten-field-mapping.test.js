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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenFieldMapping.js");
  const api = windowRef.WeishanGlobalShoppingRakutenFieldMapping;
  const product = api.buildGlobalShoppingRakutenFieldMapping({ operation:"searchProducts" });
  const hotel = api.buildGlobalShoppingRakutenFieldMapping({ operation:"searchHotels" });

  assert.equal(product.operation.title, "itemName");
  assert.equal(product.operation.targetUrl, "itemUrl");
  assert.equal(hotel.operation.price, "hotelMinCharge");
  assert.equal(hotel.operation.targetUrl, "hotelInformationUrl");
  console.log("GLOBAL_SHOPPING_RAKUTEN_FIELD_MAPPING PASS");
}

main();
