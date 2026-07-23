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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlySearchResultRanker;
  const ranking = api.buildGlobalShoppingReadOnlySearchResultRanking({
    category:"product",
    candidates:[
      { platformName:"普通平台", isOfficial:false, sourceType:"aggregator", trustLevel:"review", priceLabel:"价格以平台页面为准", feeNote:"以平台页面为准" },
      { platformName:"Apple 官方", isOfficial:true, sourceType:"official", trustLevel:"high", priceLabel:"价格以平台页面为准", feeNote:"价格与促销以官网页面为准" },
      { platformName:"京东", isOfficial:false, sourceType:"major_platform", trustLevel:"high", priceLabel:"价格以平台页面为准", feeNote:"配送、优惠和到手价以平台页面为准" },
      { platformName:"淘宝", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", priceLabel:"价格以平台页面为准", feeNote:"店铺差异较大" }
    ]
  });
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_RANKER_VERSION, "4.2.8");
  assert.equal(ranking.topResults.length, 3);
  assert.equal(ranking.topResults[0].platformName, "Apple 官方");
  assert.match(ranking.rankingSummary, /2-3/);
  console.log("GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_RANKER PASS");
}

main();
