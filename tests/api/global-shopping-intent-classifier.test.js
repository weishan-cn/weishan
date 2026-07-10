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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingIntentClassifier.js");
  const api = windowRef.WeishanGlobalShoppingIntentClassifier;
  const hotel = api.buildGlobalShoppingIntentClassification({ userIntent:"帮我找东京酒店 8月10日入住" });
  const flight = api.buildGlobalShoppingIntentClassification({ userIntent:"帮我找成都到上海最便宜机票" });
  const product = api.buildGlobalShoppingIntentClassification({ userIntent:"帮我比较 iPhone 16 Pro 价格" });

  assert.equal(api.GLOBAL_SHOPPING_INTENT_CLASSIFIER_VERSION, "4.2.8");
  assert.equal(hotel.intentType, "hotel");
  assert.equal(flight.intentType, "flight");
  assert.equal(product.intentType, "product");
  assert.equal(typeof hotel.confidence, "number");
  assert.equal(product.entities.product.length > 0, true);
  console.log("GLOBAL_SHOPPING_INTENT_CLASSIFIER PASS");
}

main();
