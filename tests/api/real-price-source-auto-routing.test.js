const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRouter() {
  const window = {};
  window.window = window;
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js"), "utf8"),
    vm.createContext({ window }),
    { filename:"merchantNativeSourceEligibilityRouter.js" }
  );
  return window.WeishanMerchantNativeSourceEligibilityRouter;
}

function loadSearch(country, bridge) {
  const window = {
    window:null,
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} },
    WeishanCommerceLocalLawCompliance:{
      evaluateLocalLawCompliance() {
        return { canSearchProvider:true, canDisplayPrice:true, canShowRedirectButton:true, canCheckout:false, canPay:false };
      },
      explainLocalLawBlockReason() { return "readonly_search_allowed"; }
    },
    WeishanCommerceLocationPolicy:{
      locationHealthForCommerce() {
        return {
          shippingDestination:{ country, city:"Test", configured:true, source:"manual" },
          hasShippingDestination:true,
          canShowPrice:true,
          canShowBookingButton:true,
          canShowCheckoutButton:false
        };
      }
    },
    weishanGlobalShopping:bridge,
    WeishanPrijsProfeetReadonlyAdapter:{ normalizeResult() { return { ok:false, status:{}, candidates:[] }; } },
    WeishanTiendaCentroReadonlyAdapter:{ normalizeResult() { return { ok:false, status:{}, candidates:[] }; } }
  };
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, setTimeout, clearTimeout, AbortController });
  [
    "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js",
    "apps/desktop/src/renderer/core/commerceSearch.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

async function main() {
  const router = loadRouter();
  const route = (query, destinationMarket) => router.routeEligibleMerchantNativeSources({ query, destinationMarket, destinationMarketSource:"manual" });

  assert.deepEqual(Array.from(route("IPHONE 17", "United Kingdom").eligibleSourceIds), []);
  assert.deepEqual(Array.from(route("IPHONE 17", "Argentina").eligibleSourceIds), ["tienda_centro_public_api"]);
  assert.deepEqual(Array.from(route("Coca-Cola Original", "Netherlands").eligibleSourceIds), ["prijsprofeet_public_api", "cc_asian_market_public_api", "dutchshopper_public_api"]);
  assert.deepEqual(Array.from(route("Coca-Cola Original", "United Kingdom").eligibleSourceIds), []);
  assert.deepEqual(Array.from(route("Jesionowy stolik kawowy", "Poland").eligibleSourceIds), ["meblostan_public_api"]);
  assert.deepEqual(Array.from(route("IPHONE 17", "Poland").eligibleSourceIds), []);
  assert.deepEqual(Array.from(route("unknown product", "unknown market").eligibleSourceIds), []);
  assert.equal(route("IPHONE 17", "Argentina").productFamily, "consumer_electronics");
  assert.equal(route("IPHONE 17", "Argentina").maxEligibleSourcesQueriedPerSearch, 4);
  assert.equal(route("IPHONE 17", "United Kingdom").otherMarketReferenceAvailable, true);
  assert.equal(route("IPHONE 17", "United Kingdom").silentDestinationOverride, false);

  let calls = 0;
  const ukWindow = loadSearch("United Kingdom", {
    merchantNativeReadonlySearch:async () => { calls += 1; throw new Error("ineligible source must not be queried"); }
  });
  const uk = await ukWindow.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"ROUTING-UK-1",
    category:"ecommerce",
    inputSummary:"IPHONE 17"
  });
  assert.equal(uk.ok, false);
  assert.equal(uk.code, "COMMERCE_NO_LOCAL_REAL_PRICE_SOURCE");
  assert.equal(uk.message, "暂未接入该市场的实时价格来源。");
  assert.equal(uk.sourceRouting.destinationMarket, "GB");
  assert.equal(uk.sourceRouting.destinationMarketSource, "manual");
  assert.equal(uk.canOfferOtherMarketReference, true);
  assert.equal(uk.canShowPrice, false);
  assert.equal(uk.canShowBookingButton, false);
  assert.equal(calls, 0);

  const argentinaWindow = loadSearch("Argentina", { merchantNativeReadonlySearch:async () => ({ ok:false, requestId:"x", results:[] }) });
  const argentinaRoute = argentinaWindow.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"IPHONE 17" });
  assert.deepEqual(Array.from(argentinaRoute.eligibleSourceIds), ["tienda_centro_public_api"]);
  const netherlandsWindow = loadSearch("Netherlands", { merchantNativeReadonlySearch:async () => ({ ok:false, requestId:"x", results:[] }) });
  const netherlandsRoute = netherlandsWindow.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"Coca-Cola Original" });
  assert.deepEqual(Array.from(netherlandsRoute.eligibleSourceIds), ["prijsprofeet_public_api", "cc_asian_market_public_api", "dutchshopper_public_api"]);

  const pageSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/CommerceAgentPage.js"), "utf8");
  assert.doesNotMatch(pageSource, />搜索适配器未配置</);
  assert.doesNotMatch(pageSource, /provider 未返回可展示结果/);
  const cardsSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/globalProcurementUserFacingResultCards.js"), "utf8");
  assert.doesNotMatch(cardsSource, /push\("Official Store"/);
  assert.doesNotMatch(cardsSource, /push\("Major Marketplace"/);
  assert.match(pageSource, /function currentRealPriceItems\(task\)/);
  assert.match(pageSource, /evidenceTruthClass === "REAL_PROVIDER_PRICE"/);
  assert.match(pageSource, /仅显示本次查询返回的已验证实时价格来源/);
  assert.match(pageSource, /费用不完整时不计算虚假到手总价/);
  assert.doesNotMatch(pageSource, /const currentPriceResults = hasCurrentPublicPriceResults/);
  const homeSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/HomePage.js"), "utf8");
  assert.match(homeSource, /preferredShoppingWorkspaceAvailable/);
  assert.match(homeSource, /preferredShoppingWorkspaceAvailable\s*\? commerceOneScreenResultPanelHtml/);
  const dispatchSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/dispatchRouter.js"), "utf8");
  assert.match(dispatchSource, /const directProductLookup =/);
  const homeIntentSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/homeUnifiedIntentRouter.js"), "utf8");
  assert.match(homeIntentSource, /iPhone\\s\*\\d\+/);

  console.log("real-price source auto-routing tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
