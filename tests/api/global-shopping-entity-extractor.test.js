const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingIntentClassifier.js",
    "apps/desktop/src/renderer/core/globalShoppingEntityExtractor.js"
  ]);
  const classifier = windowRef.WeishanGlobalShoppingIntentClassifier;
  const api = windowRef.WeishanGlobalShoppingEntityExtractor;
  const classification = classifier.buildGlobalShoppingIntentClassification({ userIntent:"帮我找 Apple iPhone 16 Pro 东京价格 2026-08-10" });
  const result = api.buildGlobalShoppingEntityExtraction({
    userIntent:"帮我找 Apple iPhone 16 Pro 东京价格 2026-08-10",
    intentClassification:classification
  });

  assert.equal(api.GLOBAL_SHOPPING_ENTITY_EXTRACTOR_VERSION, "4.2.8");
  assert.equal(result.intentType, "product");
  assert.equal(result.entities.brand, "Apple");
  assert.match(result.entities.model, /iPhone/i);
  assert.equal(result.entities.city, "东京");
  assert.equal(result.entities.date, "2026-08-10");
  console.log("GLOBAL_SHOPPING_ENTITY_EXTRACTOR PASS");
}

main();
