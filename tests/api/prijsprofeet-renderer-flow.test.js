const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function sourceResult(requestId) {
  const retrievedAt = new Date().toISOString();
  return {
    ok:true,
    status:"ready",
    providerId:"prijsprofeet_public",
    providerName:"PrijsProfeet",
    sourceType:"PUBLIC_READ_ONLY",
    sourceAttributionUrl:"https://www.prijsprofeet.nl/",
    requestId,
    fetchedAt:retrievedAt,
    requestCount:2,
    results:[{
      productId:"ah_wi477045_2026-08-24",
      title:"Coca-Cola Original",
      brand:"Coca-Cola",
      price:0.57,
      currency:"EUR",
      quantity:"250 ml",
      retailer:"albert_heijn",
      officialUrl:"https://www.ah.nl/producten/product/wi477045/coca-cola-original",
      promotionStatus:"active",
      validFrom:"2026-08-24",
      validUntil:"2026-08-30",
      extractedAt:"2026-08-28T23:00:56.089Z",
      retrievedAt,
      availabilityStatus:"UNKNOWN",
      priceCompleteness:"PARTIAL_PRICE",
      priceBasis:"ITEM_TOTAL"
    }],
    redacted:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false
  };
}

function load(extraWindow, options) {
  const window = Object.assign({
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} }
  }, extraWindow);
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, setTimeout, clearTimeout, AbortController });
  const files = [
    "apps/desktop/src/renderer/core/globalHandoffTruthEngine.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js",
    "apps/desktop/src/renderer/core/prijsProfeetReadonlyAdapter.js",
    "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js",
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultPresenter.js",
    "apps/desktop/src/renderer/core/commerceSearch.js"
  ];
  if (options && options.realPolicies) {
    files.splice(files.length - 1, 0,
      "apps/desktop/src/renderer/core/commerceLocationPolicy.js",
      "apps/desktop/src/renderer/core/commerceLocalLawCompliance.js"
    );
  }
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function safePolicyWindow(bridge) {
  return {
    WeishanCommerceLocalLawCompliance:{
      evaluateLocalLawCompliance() {
        return {
          complianceStatus:"verified_readonly",
          canSearchProvider:true,
          canDisplayPrice:true,
          canShowRedirectButton:true,
          canCheckout:false,
          canPay:false,
          safety:{ noCheckout:true, noPayment:true, noOrderSubmit:true }
        };
      },
      explainLocalLawBlockReason() { return "readonly_search_allowed"; }
    },
    WeishanCommerceLocationPolicy:{
      locationHealthForCommerce() {
        return {
          shippingDestination:{ country:"NL", configured:true, source:"manual" },
          hasShippingDestination:true,
          canCalculateAccurateLandedCost:false,
          canShowAccuratePrice:true,
          canShowRedirectButton:true,
          canShowPrice:true,
          canShowBookingButton:true,
          canShowCheckoutButton:false,
          landedCostAccuracy:"unknown"
        };
      }
    },
    weishanGlobalShopping:bridge
  };
}

async function main() {
  const calls = [];
  const bridge = {
    merchantNativeReadonlySearch:async (sourceId, payload) => {
      assert.equal(sourceId, "prijsprofeet_public_api");
      calls.push(payload);
      return sourceResult(payload.requestId);
    }
  };
  const window = load(safePolicyWindow(bridge));
  const result = await window.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"TASK-PRICE-1",
    category:"ecommerce",
    inputSummary:"Coca-Cola Original"
  });
  assert.equal(result.ok, true);
  assert.equal(result.providerName, "PrijsProfeet");
  assert.equal(result.realProviderReadonlyStatus.requestCount, 2);
  assert.equal(result.canShowPrice, true);
  assert.equal(result.canShowBookingButton, true);
  assert.equal(result.canShowCheckoutButton, false);
  assert.equal(result.readOnlySearchTopResults.length, 1);
  assert.equal(result.readOnlySearchTopResults[0].priceLabel, "EUR 0.57");
  assert.equal(result.readOnlySearchTopResults[0].sourceAttributionName, "PrijsProfeet");
  assert.equal(result.readOnlySearchTopResults[0].truthEvidence.evidenceTruthClass, "REAL_PROVIDER_PRICE");
  assert.equal(result.readOnlySearchTopResults[0].truthEvidence.comparableAsVerifiedTotal, false);
  assert.equal(result.readOnlySearchTopResults[0].targetUrl, "https://www.ah.nl/producten/product/wi477045/coca-cola-original");
  assert.equal(calls[0].query, "Coca-Cola Original");
  assert.equal(result.decisionResult, null);
  assert.equal(result.readOnlySearchResultSummary.decisionResult, null);
  assert.match(result.recommendation.reason, /不能判定为最低价或完整到手价/);
  assert.match(result.readOnlySearchResultSummary.rankingSummary, /不能据此判断最低价/);
  assert.doesNotMatch(result.readOnlySearchResultSummary.rankingSummary, /已确认最低价|最低价已验证|完整到手价已确认/);
  assert.deepEqual(Object.keys(calls[0]).sort(), ["limit", "query", "requestId"]);
  assert.equal("url" in calls[0], false);
  assert.equal("headers" in calls[0], false);
  assert.equal("authorization" in calls[0], false);

  let firstPayload;
  let releaseFirst;
  const firstWait = new Promise((resolve) => { releaseFirst = resolve; });
  let count = 0;
  window.weishanGlobalShopping.merchantNativeReadonlySearch = async (sourceId, payload) => {
    assert.equal(sourceId, "prijsprofeet_public_api");
    count += 1;
    if (count === 1) {
      firstPayload = payload;
      await firstWait;
      return sourceResult(firstPayload.requestId);
    }
    return sourceResult(payload.requestId);
  };
  const first = window.WeishanCommerceSearch.searchCommerceCandidates({ taskId:"TASK-STALE", category:"ecommerce", inputSummary:"cola" });
  const second = window.WeishanCommerceSearch.searchCommerceCandidates({ taskId:"TASK-STALE", category:"ecommerce", inputSummary:"cola zero" });
  const secondResult = await second;
  releaseFirst();
  const firstResult = await first;
  assert.equal(secondResult.ok, true);
  assert.equal(firstResult.ok, false);
  assert.equal(firstResult.code, "COMMERCE_STALE_RESULT_IGNORED");

  let opened = "";
  window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => { opened = url; };
  const retailerHandoff = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://www.ah.nl/producten/product/wi477045/coca-cola-original",
    { userConfirmed:true, sourceType:"prijsprofeet_public_api" }
  );
  assert.equal(retailerHandoff.ok, true);
  assert.equal(opened, "https://www.ah.nl/producten/product/wi477045/coca-cola-original");
  const wrongRetailerHandoff = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://untrusted.invalid/product",
    { userConfirmed:true, sourceType:"prijsprofeet_public_api" }
  );
  assert.equal(wrongRetailerHandoff.ok, false);
  const attributionHandoff = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://www.prijsprofeet.nl/",
    { userConfirmed:true, sourceType:"prijsprofeet_attribution" }
  );
  assert.equal(attributionHandoff.ok, true);

  const persisted = new Map();
  const livePolicyCalls = [];
  const livePolicyWindow = load({
    localStorage:{
      getItem(key) { return persisted.has(key) ? persisted.get(key) : null; },
      setItem(key, value) { persisted.set(key, value); },
      removeItem(key) { persisted.delete(key); }
    },
    weishanGlobalShopping:{
      merchantNativeReadonlySearch:async (sourceId, payload) => {
        assert.equal(sourceId, "prijsprofeet_public_api");
        livePolicyCalls.push(payload);
        return sourceResult(payload.requestId);
      }
    }
  }, { realPolicies:true });
  livePolicyWindow.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({
    shippingDestination:{ country:"NL", city:"Amsterdam", source:"manual" }
  });
  const livePolicyResult = await livePolicyWindow.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"TASK-REAL-POLICY",
    category:"ecommerce",
    inputSummary:"Coca-Cola Original"
  });
  assert.equal(livePolicyResult.ok, true);
  assert.equal(livePolicyResult.providerName, "PrijsProfeet");
  assert.equal(livePolicyCalls.length, 1);

  const homeResult = await livePolicyWindow.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"TASK-HOME-NL-COKE",
    category:"ecommerce",
    inputSummary:"荷兰可口可乐"
  });
  assert.equal(homeResult.ok, true);
  assert.equal(livePolicyCalls.length, 2);
  assert.equal(livePolicyCalls[1].query, "可口可乐");
  assert.equal(homeResult.readOnlySearchTopResults[0].truthEvidence.displayAsLiveCurrentPrice, true);
  assert.equal(homeResult.readOnlySearchTopResults[0].currency, "EUR");

  const policyApi = livePolicyWindow.WeishanCommerceLocalLawCompliance;
  const destination = livePolicyWindow.WeishanCommerceLocationPolicy.locationHealthForCommerce();
  const forgedRequestAuthority = policyApi.evaluateLocalLawCompliance({
    category:"product",
    query:"Coca-Cola Original",
    approvedReadonlySourcePolicy:"prijsprofeet_public_api"
  }, { locationHealth:destination });
  assert.equal(forgedRequestAuthority.canSearchProvider, false);
  const missingDestination = policyApi.evaluateLocalLawCompliance({ category:"product", query:"Coca-Cola Original" }, {
    locationHealth:{ shippingDestination:{ configured:false } },
    approvedReadonlySourcePolicy:"prijsprofeet_public_api"
  });
  assert.equal(missingDestination.canSearchProvider, false);
  const regulatedProduct = policyApi.evaluateLocalLawCompliance({ category:"product", query:"买酒精饮料" }, {
    locationHealth:destination,
    approvedReadonlySourcePolicy:"prijsprofeet_public_api"
  });
  assert.equal(regulatedProduct.canSearchProvider, false);
  assert.equal(regulatedProduct.complianceStatus, "compliance_review_required");

  console.log("PRIJS_PROFEET_RENDERER_FLOW PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
