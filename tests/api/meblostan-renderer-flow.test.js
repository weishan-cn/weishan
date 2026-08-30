const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function sourceResult(requestId) {
  const retrievedAt = new Date().toISOString();
  return {
    ok:true, status:"ready", providerId:"meblostan_public", providerName:"Meblostan", requestId, fetchedAt:retrievedAt, requestCount:1,
    results:[{ productId:"7332", title:"Jesionowy stolik kawowy", merchant:"Meblostan", price:1575, currency:"PLN", currencyMinorUnit:0, regularPrice:1750, salePrice:1575, onSale:true, condition:"REFURBISHED", officialUrl:"https://meblostan.pl/sklep/jesionowy-stolik-kawowy/", retrievedAt, availabilityStatus:"AVAILABLE", priceCompleteness:"PARTIAL_PRICE", priceBasis:"ITEM_TOTAL", shippingStatus:"UNKNOWN", taxStatus:"UNKNOWN", feesStatus:"UNKNOWN" }],
    redacted:true, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false
  };
}

function load(bridge) {
  const window = {
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} },
    WeishanCommerceLocalLawCompliance:{
      evaluateLocalLawCompliance() { return { complianceStatus:"verified_readonly", canSearchProvider:true, canDisplayPrice:true, canShowRedirectButton:true, canCheckout:false, canPay:false, safety:{ noCheckout:true, noPayment:true, noOrderSubmit:true } }; },
      explainLocalLawBlockReason() { return "readonly_search_allowed"; }
    },
    WeishanCommerceLocationPolicy:{ locationHealthForCommerce() { return { shippingDestination:{ country:"Poland", configured:true, source:"manual" }, hasShippingDestination:true, canShowPrice:true, canShowRedirectButton:true, canShowBookingButton:true, canShowCheckoutButton:false }; } },
    weishanGlobalShopping:bridge
  };
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, setTimeout, clearTimeout, AbortController });
  [
    "globalHandoffTruthEngine.js", "safeProviderDeepLinkHandoffGate.js", "readOnlyPriceTruthLayer.js", "prijsProfeetReadonlyAdapter.js",
    "tiendaCentroReadonlyAdapter.js", "meblostanReadonlyAdapter.js", "merchantNativeSourceEligibilityRouter.js",
    "globalShoppingReadOnlySearchResultRanker.js", "globalShoppingDecisionEngine.js", "globalShoppingReadOnlySearchResultPresenter.js", "commerceSearch.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core", file), "utf8"), context, { filename:file }));
  return window;
}

async function main() {
  const calls = [];
  const window = load({ merchantNativeReadonlySearch:async (sourceId, payload) => { calls.push({ sourceId, payload }); return sourceResult(payload.requestId); } });
  const route = window.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"波兰白蜡木咖啡桌" }, { hasShippingDestination:true, shippingDestination:{ country:"Poland", source:"explicit_query" } });
  assert.deepEqual(Array.from(route.eligibleSourceIds), ["meblostan_public_api"]);
  assert.equal(window.WeishanCommerceSearch.merchantNativeSourceQuery({ query:"波兰白蜡木咖啡桌" }, "meblostan_public_api"), "Jesionowy stolik kawowy");

  const result = await window.WeishanCommerceSearch.searchCommerceCandidates({ taskId:"HOME-PL-TABLE", category:"ecommerce", inputSummary:"波兰白蜡木咖啡桌" });
  assert.equal(result.ok, true);
  assert.equal(result.providerName, "Meblostan");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sourceId, "meblostan_public_api");
  assert.equal(calls[0].payload.query, "Jesionowy stolik kawowy");
  assert.deepEqual(Object.keys(calls[0].payload).sort(), ["limit", "query", "requestId"]);
  const item = result.readOnlySearchTopResults[0];
  assert.equal(item.priceLabel, "PLN 1575");
  assert.equal(item.sourceType, "meblostan_public_api");
  assert.equal(item.truthEvidence.evidenceTruthClass, "REAL_PROVIDER_PRICE");
  assert.equal(item.truthEvidence.comparableAsVerifiedTotal, false);
  assert.equal(item.truthEvidence.shipping, null);
  assert.equal(item.truthEvidence.taxes, null);
  assert.equal(item.truthEvidence.fees, null);
  assert.equal(result.decisionResult, null);

  let opened = "";
  window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => { opened = url; };
  const handoff = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(item.targetUrl, { userConfirmed:true, sourceType:"meblostan_public_api" });
  assert.equal(handoff.ok, true);
  assert.equal(opened, "https://meblostan.pl/sklep/jesionowy-stolik-kawowy/");
  for (const unsafe of ["http://meblostan.pl/sklep/x/", "https://shop.meblostan.pl/sklep/x/", "https://meblostan.pl/checkout/", "https://meblostan.pl/sklep/x/?token=value"]) {
    assert.equal((await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(unsafe, { userConfirmed:true, sourceType:"meblostan_public_api" })).ok, false);
  }

  const nl = window.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"荷兰可口可乐" }, { hasShippingDestination:true, shippingDestination:{ country:"Netherlands", source:"explicit_query" } });
  const ar = window.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"阿根廷 iPhone 17pro" }, { hasShippingDestination:true, shippingDestination:{ country:"Argentina", source:"explicit_query" } });
  const uk = window.WeishanCommerceSearch.routeMerchantNativeSource({ inputSummary:"英国 iPhone 17pro" }, { hasShippingDestination:true, shippingDestination:{ country:"United Kingdom", source:"explicit_query" } });
  assert.deepEqual(Array.from(nl.eligibleSourceIds), ["prijsprofeet_public_api", "cc_asian_market_public_api", "dutchshopper_public_api"]);
  assert.deepEqual(Array.from(ar.eligibleSourceIds), ["tienda_centro_public_api"]);
  assert.deepEqual(Array.from(uk.eligibleSourceIds), []);

  console.log("MEBLOSTAN_RENDERER_FLOW PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
