const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function prijsResult(requestId) {
  const retrievedAt = new Date().toISOString();
  return {
    ok:true,
    status:"ready",
    providerId:"prijsprofeet_public",
    providerName:"PrijsProfeet",
    requestId,
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
      extractedAt:"2026-08-29T16:00:00.000Z",
      retrievedAt,
      availabilityStatus:"UNKNOWN"
    }]
  };
}

function tiendaResult(requestId) {
  const retrievedAt = new Date().toISOString();
  return {
    ok:true,
    status:"ready",
    providerId:"tienda_centro_public",
    providerName:"Tienda Centro",
    requestId,
    requestCount:1,
    results:[{
      productId:"14035",
      title:"CELULAR IPHONE 17 256 GB NUEVO",
      price:1564200,
      currency:"ARS",
      currencyMinorUnit:0,
      regularPrice:2450000,
      salePrice:1564200,
      onSale:true,
      condition:"NEW",
      officialUrl:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
      retrievedAt,
      availabilityStatus:"UNKNOWN"
    }]
  };
}

function load(window) {
  window.window = window;
  const context = vm.createContext({ window, console, URL, Date, setTimeout, clearTimeout, AbortController });
  [
    "apps/desktop/src/renderer/core/globalHandoffTruthEngine.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js",
    "apps/desktop/src/renderer/core/prijsProfeetReadonlyAdapter.js",
    "apps/desktop/src/renderer/core/tiendaCentroReadonlyAdapter.js",
    "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js",
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultPresenter.js",
    "apps/desktop/src/renderer/core/commerceSearch.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

async function main() {
  let country = "NL";
  const calls = [];
  const window = load({
    localStorage:{ getItem() { return null; }, setItem() {}, removeItem() {} },
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
          shippingDestination:{ country, configured:true, source:"manual" },
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
    weishanGlobalShopping:{
      async merchantNativeReadonlySearch(sourceId, payload) {
        calls.push({ sourceId, query:payload.query, requestId:payload.requestId });
        if (sourceId === "prijsprofeet_public_api") return prijsResult(payload.requestId);
        if (sourceId === "tienda_centro_public_api") return tiendaResult(payload.requestId);
        throw new Error("unknown source must not reach renderer fixture");
      }
    }
  });

  async function search(taskId, nextCountry, query) {
    country = nextCountry;
    return window.WeishanCommerceSearch.searchCommerceCandidates({ taskId, category:"ecommerce", inputSummary:query });
  }

  const prijsOne = await search("isolation-prijs-1", "NL", "Coca-Cola Original");
  const tienda = await search("isolation-tienda", "AR", "CELULAR IPHONE 17 256 GB NUEVO");
  const prijsTwo = await search("isolation-prijs-2", "NL", "Coca-Cola Original");
  assert.equal(prijsOne.readOnlySearchTopResults[0].sourceName, "PrijsProfeet");
  assert.equal(prijsOne.readOnlySearchTopResults[0].currency, "EUR");
  assert.equal(tienda.readOnlySearchTopResults[0].sourceName, "Tienda Centro");
  assert.equal(tienda.readOnlySearchTopResults[0].currency, "ARS");
  assert.equal(prijsTwo.readOnlySearchTopResults[0].sourceName, "PrijsProfeet");
  assert.equal(prijsTwo.readOnlySearchTopResults[0].currency, "EUR");
  assert.deepEqual(calls.slice(0, 3).map((item) => item.sourceId), [
    "prijsprofeet_public_api",
    "tienda_centro_public_api",
    "prijsprofeet_public_api"
  ]);

  for (let index = 0; index < 60; index += 1) {
    const tiendaTurn = index % 2 === 1;
    const result = await search(
      "stress-" + index,
      tiendaTurn ? "Argentina" : "NL",
      tiendaTurn ? "CELULAR IPHONE 17 256 GB NUEVO" : "Coca-Cola Original"
    );
    const item = result.readOnlySearchTopResults[0];
    assert.equal(item.sourceName, tiendaTurn ? "Tienda Centro" : "PrijsProfeet");
    assert.equal(item.currency, tiendaTurn ? "ARS" : "EUR");
    assert.equal(item.targetUrl.includes("tiendacentro.com"), tiendaTurn);
  }

  window.__WEISHAN_TEST_OPEN_EXTERNAL__ = () => { throw new Error("cross-source handoff must not open"); };
  const wrongPrijs = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
    { userConfirmed:true, sourceType:"prijsprofeet_public_api" }
  );
  const wrongTienda = await window.WeishanSafeProviderDeepLinkHandoffGate.openTrustedProviderHandoffUrl(
    "https://www.ah.nl/producten/product/wi477045/coca-cola-original",
    { userConfirmed:true, sourceType:"tienda_centro_public_api" }
  );
  assert.equal(wrongPrijs.ok, false);
  assert.equal(wrongTienda.ok, false);
  assert.equal(calls.length, 63);

  console.log("MERCHANT_NATIVE_SOURCE_ISOLATION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
