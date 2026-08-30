const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadDispatch() {
  const window = {
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} }
  };
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, Blob });
  [
    "apps/desktop/src/renderer/core/homeUnifiedIntentRouter.js",
    "apps/desktop/src/renderer/core/dispatchRouter.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function loadSearch(savedCountry) {
  const window = {
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} },
    WeishanCommerceLocationPolicy:{
      locationHealthForCommerce() {
        return {
          shippingDestination:{ country:savedCountry, city:"Saved", configured:true, source:"manual" },
          hasShippingDestination:true,
          canShowPrice:true,
          canShowBookingButton:true,
          canShowCheckoutButton:false
        };
      }
    }
  };
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, setTimeout, clearTimeout, AbortController });
  [
    "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js",
    "apps/desktop/src/renderer/core/commerceSearch.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window.WeishanCommerceSearch;
}

function legacyPreemption(input) {
  const raw = String(input || "");
  const oldIphoneSpecificity = /\biPhone\s*\d+\b/i.test(raw);
  const oldShoppingObject = /MacBook|iPhone|手机|电脑|价格|比价|购买|买/i.test(raw);
  if (oldShoppingObject && !oldIphoneSpecificity && !/价格|比价|购买|买/i.test(raw)) return "coordination";
  return oldShoppingObject ? "shopping" : "ai_gateway";
}

const window = loadDispatch();
const home = window.WeishanHomeUnifiedIntentRouter;
const dispatch = window.WeishanDispatchRouter;
const humanCases = ["英国 iPhone 17pro", "阿根廷 iPhone 17pro", "阿根廷可口可乐", "荷兰可口可乐"];

assert.equal(legacyPreemption(humanCases[0]), "coordination");
assert.equal(legacyPreemption(humanCases[1]), "coordination");
assert.equal(legacyPreemption(humanCases[2]), "ai_gateway");
assert.equal(legacyPreemption(humanCases[3]), "ai_gateway");

for (const input of humanCases) {
  const decision = home.classifyHomeIntent(input);
  const plan = dispatch.classifyCommand(input);
  assert.equal(decision.destination, "COMMERCE", input);
  assert.equal(decision.searchScope.domain, "SHOPPING", input);
  assert.equal(decision.confidence, "high", input);
  assert.equal(plan.module, "commerceAgent", input);
  assert.equal(plan.targetRoute, "commerce", input);
}

for (const input of [
  "英国iPhone17pro",
  "阿根廷iPhone17pro",
  "荷兰可口可乐价格",
  "iPhone 17 Pro 英国价格",
  "iPhone 17 Pro 阿根廷多少钱",
  "可口可乐 荷兰价格",
  "Argentina iPhone 17 Pro",
  "Netherlands Coca-Cola",
  "United Kingdom iPhone 17 Pro",
  "英国 iPhone 17 Pro 多少钱",
  "我想买阿根廷的 iPhone 17 Pro",
  "比较英国和阿根廷 iPhone 17 Pro 价格"
]) {
  assert.equal(dispatch.classifyCommand(input).module, "commerceAgent", input);
}

assert.equal(dispatch.classifyCommand("在邮件里找英国 iPhone 17 Pro 的购买发票").module, "mail");
assert.notEqual(dispatch.classifyCommand("在项目里找阿根廷 iPhone 17 Pro 的设计文件").module, "commerceAgent");
assert.notEqual(dispatch.classifyCommand("iPhone 17 Pro 支持哪些卫星通信功能").module, "commerceAgent");

const search = loadSearch("United Kingdom");
assert.equal(search.routeMerchantNativeSource({ inputSummary:"阿根廷 iPhone 17pro" }).destinationMarket, "AR");
assert.deepEqual(Array.from(search.routeMerchantNativeSource({ inputSummary:"阿根廷 iPhone 17pro" }).eligibleSourceIds), ["tienda_centro_public_api"]);
assert.equal(search.routeMerchantNativeSource({ inputSummary:"荷兰可口可乐" }).destinationMarket, "NL");
assert.deepEqual(Array.from(search.routeMerchantNativeSource({ inputSummary:"荷兰可口可乐" }).eligibleSourceIds), ["prijsprofeet_public_api"]);
assert.deepEqual(Array.from(search.routeMerchantNativeSource({ query:"Coca-Cola", inputSummary:"荷兰可口可乐" }).eligibleSourceIds), ["prijsprofeet_public_api"]);
assert.equal(search.routeMerchantNativeSource({ inputSummary:"英国 iPhone 17pro" }).destinationMarket, "GB");
assert.deepEqual(Array.from(search.routeMerchantNativeSource({ inputSummary:"英国 iPhone 17pro" }).eligibleSourceIds), []);

console.log("HOME_GLOBAL_SHOPPING_DISPATCH_REAL_PRICE PASS cases=4 coordination=0 aiGateway=0");
