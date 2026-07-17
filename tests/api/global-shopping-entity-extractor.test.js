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

  const sonyInput = "搜索 Sony WH-1000XM5 降噪耳机，收货到美国，预算 300 美元，比较日本和美国平台的商品价格、运费、税费及预计到手成本";
  const sonyClassification = classifier.buildGlobalShoppingIntentClassification({ userIntent:sonyInput });
  const sonyResult = api.buildGlobalShoppingEntityExtraction({
    userIntent:sonyInput,
    intentClassification:sonyClassification
  });
  assert.equal(sonyResult.entities.brand, "Sony");
  assert.equal(sonyResult.entities.model, "WH-1000XM5");
  assert.equal(sonyResult.entities.destinationCountry, "US");
  assert.equal(sonyResult.entities.budget, 300);
  assert.equal(sonyResult.entities.currency, "USD");
  assert.deepEqual(Array.from(sonyResult.entities.comparisonMarkets), ["JP", "US"]);

  const sonyXm4 = api.buildGlobalShoppingEntityExtraction({
    userIntent:"Sony WH-1000XM4，比较日本和美国平台",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"Sony WH-1000XM4，比较日本和美国平台" })
  });
  assert.equal(sonyXm4.entities.model, "WH-1000XM4");
  assert.deepEqual(Array.from(sonyXm4.entities.comparisonMarkets), ["JP", "US"]);

  const fuji = api.buildGlobalShoppingEntityExtraction({
    userIntent:"Fujifilm X-T5，收货到中国",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"Fujifilm X-T5，收货到中国" })
  });
  assert.equal(fuji.entities.brand, "Fujifilm");
  assert.equal(fuji.entities.model, "X-T5");
  assert.equal(fuji.entities.destinationCountry, "CN");

  const samsung = api.buildGlobalShoppingEntityExtraction({
    userIntent:"Samsung SM-S928B，预算 1000 美元",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"Samsung SM-S928B，预算 1000 美元" })
  });
  assert.equal(samsung.entities.brand, "Samsung");
  assert.equal(samsung.entities.model, "SM-S928B");
  assert.equal(samsung.entities.budget, 1000);
  assert.equal(samsung.entities.currency, "USD");

  const genericSony = api.buildGlobalShoppingEntityExtraction({
    userIntent:"日本索尼降噪耳机",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"日本索尼降噪耳机" })
  });
  assert.equal(genericSony.entities.brand, "索尼");
  assert.equal(genericSony.entities.model, "");

  const numericBudget = api.buildGlobalShoppingEntityExtraction({
    userIntent:"预算 300 美元，比较日本和美国平台的耳机",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"预算 300 美元，比较日本和美国平台的耳机" })
  });
  assert.equal(numericBudget.entities.model, "");
  assert.equal(numericBudget.entities.budget, 300);

  const prefixedVague = api.buildGlobalShoppingEntityExtraction({
    userIntent:"RUN-V2134-VAGUE-PRODUCT 买 iPhone",
    intentClassification:classifier.buildGlobalShoppingIntentClassification({ userIntent:"RUN-V2134-VAGUE-PRODUCT 买 iPhone" })
  });
  assert.equal(prefixedVague.entities.model, "");

  console.log("GLOBAL_SHOPPING_ENTITY_EXTRACTOR PASS");
}

main();
