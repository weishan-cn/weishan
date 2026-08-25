#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const sourcePath = path.join(root, "apps/desktop/src/renderer/core/unifiedDesktopFlowViewModel.js");

function loadModule() {
  const context = { window:{}, URL, Intl, Date, Number, String, Object, Array, RegExp, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(sourcePath, "utf8"), context, { filename:sourcePath });
  return context.window.WeishanUnifiedDesktopFlowViewModel;
}

const api = loadModule();

assert.equal(api.MODULE_NAME, "unified_desktop_flow_view_model_v1");

function serialized(value) {
  return JSON.stringify(value);
}

function assertNoInternalLeak(model) {
  assert.equal(/SANDBOX_TEST_DATA|COMMERCIAL_BLOCKED|FOUNDATION_ONLY|MTLS_|COMMERCIAL_CREDENTIALS_REQUIRED|HTTP\s*401|OAuth|client_secret|API key|Authorization|Bearer|\/Users\/|apps\/desktop|stack trace/i.test(serialized(model)), false);
}

function assertBoundary(model) {
  assert.equal(model.executionGate, "CLOSED");
  assert.equal(model.authorizesExecution, false);
  assert.equal(model.productionTraffic, false);
  assert.equal(model.BOOKING, false);
  assert.equal(model.ORDER, false);
  assert.equal(model.PAYMENT, false);
  assert.equal(model.TICKETING, false);
  assert.equal(model.WEISHAN_PAYS_PROVIDER, false);
  assert.equal(model.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
}

{
  assert.equal(api.routeDomain({ query:"iPhone 17 Pro 512GB cheapest" }), "SHOPPING");
  assert.equal(api.routeDomain({ query:"成都到东京9月10日两个人经济舱" }), "FLIGHT");
  assert.equal(api.routeDomain({ query:"上海9月15到18日两个人酒店" }), "HOTEL");
  assert.equal(api.routeDomain({ query:"10月香港出发7晚邮轮阳台房" }), "CRUISE");
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    query:"iPhone 17 Pro 512GB cheapest",
    constraints:{ productName:"iPhone 17 Pro", model:"512GB" },
    results:[{
      productName:"iPhone 17 Pro",
      variant:"512GB",
      condition:"new",
      availability:"available",
      amount:999,
      currency:"USD",
      priceBasis:"ITEM_PRICE",
      priceState:"CURRENT_PRICE",
      handoff:{ url:"https://merchant.example/product/iphone-17-pro", quality:"EXACT_PRODUCT_HANDOFF" },
      commissionRate:99
    }]
  });
  assert.equal(model.domain, "SHOPPING");
  assert.equal(model.highLevelFlow.join(" → "), "Ask → Understand → Search → Compare → Recommend → Handoff");
  assert.equal(model.results[0].price.publicState, "CURRENT_PRICE");
  assert.equal(model.results[0].price.basisLabel, "item price");
  assert.equal(model.results[0].handoff.cta, "View product");
  assert.equal(model.recommendationPolicy.commissionAffectsRecommendation, false);
  assert.equal(model.compareRows.includes("variant"), true);
  assertBoundary(model);
  assertNoInternalLeak(model);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    query:"成都到东京9月10日两个人经济舱",
    previousDomain:"SHOPPING",
    constraints:{ origin:"CTU", destination:"Tokyo", departureDate:"2026-09-10", travelers:2, cabin:"Economy" },
    results:[{
      origin:"CTU",
      destination:"Tokyo",
      departureDate:"2026-09-10",
      cabin:"Economy",
      stops:"nonstop",
      amount:1200,
      currency:"CNY",
      priceBasis:"TOTAL_ITINERARY",
      priceState:"TEST_ENVIRONMENT_DATA",
      testData:true,
      handoff:{ url:"https://flight.example/search/ctu-tyo", quality:"EXACT_ITINERARY_HANDOFF" }
    }]
  });
  assert.equal(model.domain, "FLIGHT");
  assert.equal(model.domainSwitching.switched, true);
  assert.equal(model.domainSwitching.staleConstraintsCleared, true);
  assert.equal(model.results[0].price.publicState, "TEST_DATA");
  assert.equal(model.results[0].price.display.includes("not live"), true);
  assert.equal(model.results[0].handoff.cta, "View flight");
  assert.equal(model.compareRows.includes("stops"), true);
  assertNoInternalLeak(model);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    query:"上海9月15到18日两个人酒店",
    previousDomain:"FLIGHT",
    constraints:{ destination:"Shanghai", checkIn:"2026-09-15", checkOut:"2026-09-18", guests:2 },
    results:[{
      propertyName:"Bund River Hotel",
      roomName:"Deluxe King",
      refundability:"refundable",
      amount:140,
      currency:"USD",
      priceBasis:"PER_NIGHT",
      priceState:"CURRENT_PRICE",
      handoff:{ url:"https://hotel.example/property/bund-river", quality:"EXACT_STAY_HANDOFF" }
    }]
  });
  assert.equal(model.domain, "HOTEL");
  assert.equal(model.domainSwitching.clearedDomains.includes("FLIGHT"), true);
  assert.equal(model.results[0].price.basisLabel, "per night");
  assert.equal(model.results[0].handoff.cta, "View hotel");
  assert.equal(model.compareRows.includes("total/nightly"), true);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    query:"10月香港出发7晚邮轮阳台房",
    constraints:{ departurePort:"Hong Kong", departureDate:"2026-10", duration:"7 nights", cabinCategory:"Balcony" },
    results:[{
      ship:"Queen Example",
      itinerary:"Hong Kong roundtrip",
      duration:"7 nights",
      cabinCategory:"Balcony",
      amount:599,
      currency:"USD",
      priceBasis:"PER_PERSON_DOUBLE_OCCUPANCY",
      priceState:"FROM_PRICE",
      handoff:{ url:"https://cruise.example/sailing/7-night", quality:"EXACT_SAILING_CABIN_HANDOFF" }
    }]
  });
  assert.equal(model.domain, "CRUISE");
  assert.equal(model.results[0].price.publicState, "INDICATIVE_PRICE");
  assert.equal(model.results[0].price.basisLabel, "per person, double occupancy");
  assert.equal(model.results[0].handoff.cta, "View sailing");
  assert.equal(model.compareRows.includes("occupancy basis"), true);
}

{
  const unavailable = api.buildUnifiedDesktopFlowViewModel({
    domain:"hotel",
    query:"hotel in Osaka",
    results:[{
      propertyName:"No Price Hotel",
      priceState:"PRICE_UNAVAILABLE",
      priceBasis:"TOTAL_STAY",
      handoff:{ url:"https://hotel.example/search/osaka", quality:"GENERIC_HOME" }
    }]
  });
  assert.equal(unavailable.results[0].price.publicState, "PRICE_UNAVAILABLE");
  assert.equal(unavailable.results[0].handoff.cta, "Open search");
  assert.equal(unavailable.results[0].price.amountLabel, null);
}

{
  const unsafeDomains = ["shopping", "flight", "hotel", "cruise"];
  unsafeDomains.forEach((domain) => {
    const model = api.buildUnifiedDesktopFlowViewModel({
      domain,
      query:`unsafe ${domain}`,
      results:[{
        title:"Unsafe",
        amount:1,
        currency:"USD",
        priceBasis:"ITEM_PRICE",
        priceState:"CURRENT_PRICE",
        handoff:{ url:"https://example.com/checkout/now", quality:"EXACT_PRODUCT_HANDOFF" }
      }]
    });
    assert.equal(model.results[0].handoff.safe, false);
    assert.equal(model.results[0].handoff.cta, "No safe external link");
    assert.equal(model.results[0].handoff.autoOpen, false);
  });
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    domain:"flight",
    query:"flight source failure",
    failures:[{ message:"HTTP 401 MTLS_CERTIFICATE_REQUIRED stack trace /Users/boge/apps/desktop" }]
  });
  assert.equal(model.allSourceFailure, true);
  assertNoInternalLeak(model);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    domain:"shopping",
    query:"x",
    results:[
      { productName:"Empty string trap", amount:"", currency:"USD", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", availability:"available", handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" } },
      { productName:"Zero trap", amount:NaN, currency:"USD", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" } },
      { productName:"Infinity trap", amount:Infinity, currency:"USD", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" } },
      { productName:"Negative trap", amount:-10, currency:"USD", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" } },
      { productName:"Currency trap", amount:10, currency:"UNKNOWN", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" } }
    ]
  });
  assert.equal(model.results.every((item) => item.price.publicState === "PRICE_UNAVAILABLE"), true);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    domain:"shopping",
    query:"test price leak",
    results:[{
      productName:"Sandbox should stay sandbox",
      amount:1,
      currency:"USD",
      priceBasis:"ITEM_PRICE",
      priceState:"CURRENT_PRICE",
      evidenceType:"SANDBOX_TEST_DATA",
      availability:"available",
      handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" }
    }]
  });
  assert.equal(model.results[0].price.publicState, "TEST_DATA");
  assert.equal(model.results[0].price.testData, true);
  assert.equal(model.results[0].comparable, false);
  assert.match(model.results[0].price.display, /not live/);
}

{
  const model = api.buildUnifiedDesktopFlowViewModel({
    domain:"shopping",
    query:"stale and sold out",
    results:[
      {
        productName:"Stale cheap offer",
        amount:10,
        currency:"USD",
        priceBasis:"ITEM_PRICE",
        priceState:"CURRENT_PRICE",
        freshness:"STALE",
        availability:"available",
        handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" }
      },
      {
        productName:"Sold out cheap offer",
        amount:11,
        currency:"USD",
        priceBasis:"ITEM_PRICE",
        priceState:"CURRENT_PRICE",
        availability:"SOLD_OUT",
        handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" }
      },
      {
        productName:"Unknown availability cheap offer",
        amount:12,
        currency:"USD",
        priceBasis:"ITEM_PRICE",
        priceState:"CURRENT_PRICE",
        availability:"UNKNOWN",
        handoff:{ url:"https://merchant.example/p", quality:"EXACT_PRODUCT_HANDOFF" }
      }
    ]
  });
  assert.equal(model.results[0].price.publicState, "STALE_PRICE");
  assert.equal(model.results[0].comparable, false);
  assert.equal(model.results[1].availability.comparable, false);
  assert.equal(model.results[1].comparable, false);
  assert.equal(model.results[2].availability.comparable, false);
  assert.equal(model.results[2].comparable, false);
}

{
  const rejected = [
    ["https://legit.example@evil.example/product", "URL_USERINFO_BLOCKED"],
    ["https://127.0.0.1/product", "UNSAFE_HOST"],
    ["https://10.0.0.4/product", "UNSAFE_HOST"],
    ["https://192.168.1.2/product", "UNSAFE_HOST"],
    ["https://[::1]/product", "UNSAFE_HOST"],
    ["https://merchant.example/purchase", "TRANSACTION_PATH_BLOCKED"],
    ["https://merchant.example/product?checkout=true", "TRANSACTION_PATH_BLOCKED"],
    ["https://merchant.example/product?next=%2Fcheckout%2Fnow", "TRANSACTION_PATH_BLOCKED"]
  ];
  rejected.forEach(([url, reason]) => {
    const handoff = api.safeHandoff({ url, quality:"EXACT_PRODUCT_HANDOFF" }, "SHOPPING");
    assert.equal(handoff.safe, false, url);
    assert.equal(handoff.reason, reason, url);
  });

  const safeBookInfo = api.safeHandoff({ url:"https://merchant.example/books/booking-info", quality:"GENERIC_SEARCH" }, "SHOPPING");
  assert.equal(safeBookInfo.safe, true);
  assert.equal(safeBookInfo.cta, "Open search");
}

{
  const html = api.renderUnifiedDesktopFlowHtml(api.buildUnifiedDesktopFlowViewModel({
    domain:"hotel",
    query:"<img src=x onerror=alert(1)>",
    results:[{
      propertyName:"<script>alert(1)</script> & Spa",
      amount:300,
      currency:"USD",
      priceBasis:"TOTAL_STAY",
      priceState:"CURRENT_PRICE",
      availability:"available",
      handoff:{ url:"https://hotel.example/property", quality:"EXACT_STAY_HANDOFF" }
    }]
  }));
  assert.equal(/<script|<img|onerror/i.test(html), false);
  assert.match(html, /&amp; Spa/);
}

{
  const hotelHtml = api.renderUnifiedDesktopFlowHtml(api.buildUnifiedDesktopFlowViewModel({
    domain:"hotel",
    query:"Tokyo hotel",
    results:[{
      propertyName:"Condition Hotel",
      roomName:"Standard Queen",
      refundability:"non-refundable",
      taxesAndFees:"taxes included, resort fee unknown",
      amount:120,
      currency:"USD",
      priceBasis:"PER_NIGHT",
      priceState:"CURRENT_PRICE",
      availability:"available",
      handoff:{ url:"https://hotel.example/property", quality:"EXACT_STAY_HANDOFF" }
    }]
  }));
  assert.match(hotelHtml, /Material conditions/);
  assert.match(hotelHtml, /Standard Queen/);
  assert.match(hotelHtml, /non-refundable/);
  assert.match(hotelHtml, /resort fee unknown/);

  const emptyHtml = api.renderUnifiedDesktopFlowHtml(api.buildUnifiedDesktopFlowViewModel({
    domain:"cruise",
    query:"unknown sailing",
    failures:[{ message:"HTTP 401 Authorization Bearer abc /Users/boge/private path" }]
  }));
  assert.match(emptyHtml, /No comparable result yet|Some sources could not answer safely/);
  assert.match(emptyHtml, /Weishan will not invent a price/);
  assertNoInternalLeak(emptyHtml);
}

{
  const html = api.renderUnifiedDesktopFlowHtml(api.buildUnifiedDesktopFlowViewModel({
    query:"MacBook Pro",
    results:[{ productName:"MacBook Pro", amount:1999, currency:"USD", priceBasis:"ITEM_PRICE", priceState:"CURRENT_PRICE", availability:"available", handoff:{ url:"https://merchant.example/macbook", quality:"EXACT_PRODUCT_HANDOFF" } }]
  }));
  assert.match(html, /One Weishan/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /Ask → Understand → Search → Compare → Recommend → Handoff/);
  assert.equal(/Book Now|checkout|Provider|OAuth|MTLS/i.test(html), false);
  assert.match(html, /does not check out, book, reserve, issue tickets, place orders, or take payment/);
}

console.log("unified-desktop-flow-view-model: PASS");
