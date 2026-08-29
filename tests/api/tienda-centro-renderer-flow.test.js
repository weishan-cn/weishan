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
    providerId:"tienda_centro_public",
    providerName:"Tienda Centro",
    sourceType:"PUBLIC_READ_ONLY",
    sourceAttributionUrl:"https://tiendacentro.com/",
    requestId,
    fetchedAt:retrievedAt,
    requestCount:1,
    results:[{
      productId:"14035",
      title:"CELULAR IPHONE 17 256 GB NUEVO",
      merchant:"Tienda Centro",
      price:1564200,
      currency:"ARS",
      currencyMinorUnit:0,
      regularPrice:2450000,
      salePrice:1564200,
      onSale:true,
      condition:"NEW",
      officialUrl:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
      retrievedAt,
      availabilityStatus:"UNKNOWN",
      priceCompleteness:"PARTIAL_PRICE",
      priceBasis:"ITEM_TOTAL",
      shippingStatus:"UNKNOWN",
      taxStatus:"UNKNOWN",
      feesStatus:"UNKNOWN"
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
    "apps/desktop/src/renderer/core/tiendaCentroReadonlyAdapter.js",
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

function safePolicyWindow(bridge, country) {
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
          shippingDestination:{ country:country || "AR", configured:true, source:"manual" },
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
  const tiendaCalls = [];
  const prijsCalls = [];
  const bridge = {
    tiendaCentroReadonlySearch:async (payload) => {
      tiendaCalls.push(payload);
      return sourceResult(payload.requestId);
    },
    prijsProfeetReadonlySearch:async (payload) => {
      prijsCalls.push(payload);
      throw new Error("Argentina must not use the Dutch grocery source");
    }
  };
  const window = load(safePolicyWindow(bridge, "AR"));
  const result = await window.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"TASK-TIENDA-1",
    category:"ecommerce",
    inputSummary:"CELULAR IPHONE 17 256 GB NUEVO"
  });
  assert.equal(result.ok, true);
  assert.equal(result.providerName, "Tienda Centro");
  assert.equal(result.realProviderReadonlyStatus.requestCount, 1);
  assert.equal(result.canShowPrice, true);
  assert.equal(result.canShowBookingButton, true);
  assert.equal(result.canShowCheckoutButton, false);
  assert.equal(result.readOnlySearchTopResults.length, 1);
  assert.equal(result.readOnlySearchTopResults[0].priceLabel, "ARS 1564200");
  assert.equal(result.readOnlySearchTopResults[0].sourceAttributionName, "Tienda Centro");
  assert.equal(result.readOnlySearchTopResults[0].truthEvidence.evidenceTruthClass, "REAL_PROVIDER_PRICE");
  assert.equal(result.readOnlySearchTopResults[0].truthEvidence.comparableAsVerifiedTotal, false);
  assert.equal(result.readOnlySearchTopResults[0].truthEvidence.availabilityStatus, "UNKNOWN");
  assert.equal(result.readOnlySearchTopResults[0].targetUrl, "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/");
  assert.equal(result.decisionResult, null);
  assert.match(result.recommendation.reason, /不能判定为最低价或完整到手价/);
  assert.deepEqual(Object.keys(tiendaCalls[0]).sort(), ["limit", "query", "requestId"]);
  assert.equal(tiendaCalls.length, 1);
  assert.equal(prijsCalls.length, 0);
  assert.equal("url" in tiendaCalls[0], false);
  assert.equal("headers" in tiendaCalls[0], false);
  assert.equal("authorization" in tiendaCalls[0], false);

  let firstPayload;
  let releaseFirst;
  const firstWait = new Promise((resolve) => { releaseFirst = resolve; });
  let count = 0;
  window.weishanGlobalShopping.tiendaCentroReadonlySearch = async (payload) => {
    count += 1;
    if (count === 1) {
      firstPayload = payload;
      await firstWait;
      return sourceResult(firstPayload.requestId);
    }
    return sourceResult(payload.requestId);
  };
  const first = window.WeishanCommerceSearch.searchCommerceCandidates({ taskId:"TASK-TIENDA-STALE", category:"ecommerce", inputSummary:"IPHONE 17 256 GB NUEVO" });
  const second = window.WeishanCommerceSearch.searchCommerceCandidates({ taskId:"TASK-TIENDA-STALE", category:"ecommerce", inputSummary:"CELULAR IPHONE 17 256 GB NUEVO" });
  const secondResult = await second;
  releaseFirst();
  const firstResult = await first;
  assert.equal(secondResult.ok, true);
  assert.equal(firstResult.ok, false);
  assert.equal(firstResult.code, "COMMERCE_STALE_RESULT_IGNORED");

  let opened = "";
  window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => { opened = url; };
  const exactHandoff = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
    { userConfirmed:true, sourceType:"tienda_centro_public_api" }
  );
  assert.equal(exactHandoff.ok, true);
  assert.equal(opened, "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/");
  for (const unsafeUrl of [
    "https://shop.tiendacentro.com/celulares/iphone/",
    "https://tiendacentro.com/checkout/",
    "https://tiendacentro.com/celulares/iphone/?token=value",
    "http://tiendacentro.com/celulares/iphone/",
    "javascript:alert(1)"
  ]) {
    const blocked = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
      unsafeUrl,
      { userConfirmed:true, sourceType:"tienda_centro_public_api" }
    );
    assert.equal(blocked.ok, false);
  }

  const persisted = new Map();
  const livePolicyCalls = [];
  const livePolicyWindow = load({
    localStorage:{
      getItem(key) { return persisted.has(key) ? persisted.get(key) : null; },
      setItem(key, value) { persisted.set(key, value); },
      removeItem(key) { persisted.delete(key); }
    },
    weishanGlobalShopping:{
      tiendaCentroReadonlySearch:async (payload) => {
        livePolicyCalls.push(payload);
        return sourceResult(payload.requestId);
      }
    }
  }, { realPolicies:true });
  livePolicyWindow.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({
    shippingDestination:{ country:"Argentina", city:"Buenos Aires", source:"manual" }
  });
  const livePolicyResult = await livePolicyWindow.WeishanCommerceSearch.searchCommerceCandidates({
    taskId:"TASK-TIENDA-REAL-POLICY",
    category:"ecommerce",
    inputSummary:"CELULAR IPHONE 17 256 GB NUEVO"
  });
  assert.equal(livePolicyResult.ok, true);
  assert.equal(livePolicyResult.providerName, "Tienda Centro");
  assert.equal(livePolicyCalls.length, 1);

  const policyApi = livePolicyWindow.WeishanCommerceLocalLawCompliance;
  const destination = livePolicyWindow.WeishanCommerceLocationPolicy.locationHealthForCommerce();
  const forgedRequestAuthority = policyApi.evaluateLocalLawCompliance({
    category:"product",
    query:"CELULAR IPHONE 17 256 GB NUEVO",
    approvedReadonlySourcePolicy:"tienda_centro_public_api"
  }, { locationHealth:destination });
  assert.equal(forgedRequestAuthority.canSearchProvider, false);
  const explicitPolicy = policyApi.evaluateLocalLawCompliance({ category:"product", query:"CELULAR IPHONE 17 256 GB NUEVO" }, {
    locationHealth:destination,
    approvedReadonlySourcePolicy:"tienda_centro_public_api"
  });
  assert.equal(explicitPolicy.canSearchProvider, true);
  assert.equal(explicitPolicy.approvedReadonlySourcePolicy, "tienda_centro_public_api");
  const missingDestination = policyApi.evaluateLocalLawCompliance({ category:"product", query:"CELULAR IPHONE 17 256 GB NUEVO" }, {
    locationHealth:{ shippingDestination:{ configured:false } },
    approvedReadonlySourcePolicy:"tienda_centro_public_api"
  });
  assert.equal(missingDestination.canSearchProvider, false);
  const regulatedProduct = policyApi.evaluateLocalLawCompliance({ category:"product", query:"买酒精饮料" }, {
    locationHealth:destination,
    approvedReadonlySourcePolicy:"tienda_centro_public_api"
  });
  assert.equal(regulatedProduct.canSearchProvider, false);

  console.log("TIENDA_CENTRO_RENDERER_FLOW PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
