const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultModel.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlySearchResultModel;
  const item = api.buildGlobalShoppingReadOnlySearchResultModel({
    platformName:"京东",
    title:"iPhone 16 Pro",
    targetUrl:"https://search.jd.com/Search?keyword=iPhone%2016%20Pro",
    category:"ecommerce",
    sourceType:"major_platform",
    trustLevel:"high"
  });
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_MODEL_VERSION, "4.2.8");
  assert.equal(item.appVersion, "4.2.8");
  assert.equal(item.category, "product");
  assert.equal(item.readOnlyCandidate, true);
  assert.equal(item.notOrder, true);
  assert.equal(item.notPaymentObject, true);
  assert.equal(item.notProviderResponse, true);
  assert.equal(item.bookingUrl, null);
  assert.equal(item.checkoutUrl, null);
  assert.equal(item.paymentUrl, null);
  assert.equal(item.orderUrl, null);
  assert.match(item.priceLabel, /平台页面/);
  const blocked = api.buildGlobalShoppingReadOnlySearchResultModel({
    platformName:"Bad",
    title:"Bad",
    targetUrl:"https://example.com/checkout?id=1",
    category:"flight"
  });
  assert.equal(blocked.targetUrl, "");
  console.log("GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_MODEL PASS");
}

main();
