"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL, JSON, Object, Array, String, Number, Boolean, Set });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function build(api, input) {
  const result = api.buildHandoff(input);
  assert.equal(api.assertSafeHandoff(result), true);
  return result;
}

async function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalHandoffTruthEngine.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js"
  ]);
  const api = windowRef.WeishanGlobalHandoffTruthEngine;
  assert.equal(api.VERSION, "4.2.8");

  const blockedUrls = [
    "javascript:alert(1)",
    "http://provider.example/item/1",
    "https://user:pass@provider.example/item/1",
    "https://localhost/item/1",
    "https://127.0.0.1/item/1",
    "https://10.0.0.4/item/1",
    "https://172.16.3.5/item/1",
    "https://192.168.1.5/item/1",
    "https://[::1]/item/1",
    "https://provider.example/checkout/item/1",
    "https://provider.example/item/1?checkout=true",
    "https://provider.example/item/1?api_key=abc",
    "https://trusted.example.evil.test/item/1"
  ];
  for (const url of blockedUrls) {
    const result = build(api, { domain:"shopping", destinationUrl:url, expectedHost:"provider.example", result:{ productId:"p1" }, destinationContext:{ productId:"p1" } });
    assert.equal(result.status, "blocked", url);
    assert.equal(result.destinationUrl, null, url);
    assert.equal(result.autoOpen, false, url);
  }

  const encodedRedirects = [
    "https://provider.example/item/1?redirect=https%3A%2F%2Fevil.test%2Fcheckout",
    "https://provider.example/item/1?next=https%253A%252F%252Fevil.test%252Fpayment",
    "https://provider.example/item/1?redirect_uri=https%3A%2F%2Fprovider.example%2Forder%2F1"
  ];
  for (const url of encodedRedirects) {
    const result = build(api, { domain:"shopping", destinationUrl:url, expectedHost:"provider.example", result:{ productId:"p1" }, destinationContext:{ productId:"p1" } });
    assert.equal(result.status, "blocked", url);
    assert.equal(result.blockedReasons.length > 0, true);
  }

  const exactOffer = build(api, {
    domain:"shopping",
    destinationUrl:"https://provider.example/product/p1?variant=blue",
    expectedHost:"provider.example",
    result:{ id:"r1", resultSetId:"set1", productId:"p1", variantId:"blue", offerId:"o1", sellerId:"s1", exactHandoff:true, trustedUrl:true },
    destinationContext:{ productId:"p1", variantId:"blue", offerId:"o1", sellerId:"s1" },
    activeResultSetId:"set1",
    selectedResultId:"r1"
  });
  assert.equal(exactOffer.status, "confirmation_required");
  assert.equal(exactOffer.exactness, "EXACT_OFFER");
  assert.equal(exactOffer.destinationHost, "provider.example");
  assert.equal(JSON.stringify(exactOffer.userCopy).includes("EXACT_"), false);

  const wrongVariant = build(api, {
    domain:"shopping",
    destinationUrl:"https://provider.example/product/p1?variant=red",
    expectedHost:"provider.example",
    result:{ id:"r1", resultSetId:"set1", productId:"p1", variantId:"blue", sellerId:"s1" },
    destinationContext:{ productId:"p1", variantId:"red", sellerId:"s1" },
    activeResultSetId:"set1",
    selectedResultId:"r1"
  });
  assert.equal(wrongVariant.status, "blocked");
  assert.equal(wrongVariant.blockedReasons.includes("wrong_variant_blocked"), true);

  const staleSelection = build(api, {
    domain:"shopping",
    destinationUrl:"https://provider.example/product/p1",
    expectedHost:"provider.example",
    result:{ id:"r1", resultSetId:"old", productId:"p1" },
    destinationContext:{ productId:"p1" },
    activeResultSetId:"new",
    selectedResultId:"r2"
  });
  assert.equal(staleSelection.status, "blocked");
  assert.equal(staleSelection.blockedReasons.includes("stale_result_set_blocked"), true);
  assert.equal(staleSelection.blockedReasons.includes("wrong_selected_result_blocked"), true);

  const exactFlight = build(api, {
    domain:"flight",
    destinationUrl:"https://airline.example/search?from=PVG&to=CDG&date=2026-10-10&adults=1&cabin=Y",
    expectedHost:"airline.example",
    result:{ origin:"PVG", destination:"CDG", departureDate:"2026-10-10", passengers:"1", cabin:"Y" },
    destinationContext:{ origin:"PVG", destination:"CDG", departureDate:"2026-10-10", passengers:"1", cabin:"Y" }
  });
  assert.equal(exactFlight.exactness, "EXACT_ITINERARY");
  assert.equal(exactFlight.payment, false);

  const wrongFlightDate = build(api, {
    domain:"flight",
    destinationUrl:"https://airline.example/search?from=PVG&to=CDG&date=2026-10-11",
    expectedHost:"airline.example",
    result:{ origin:"PVG", destination:"CDG", departureDate:"2026-10-10", passengers:"1", cabin:"Y" },
    destinationContext:{ origin:"PVG", destination:"CDG", departureDate:"2026-10-11", passengers:"1", cabin:"Y" }
  });
  assert.equal(wrongFlightDate.status, "blocked");
  assert.equal(wrongFlightDate.blockedReasons.includes("wrong_flight_date_blocked"), true);

  const exactHotel = build(api, {
    domain:"hotel",
    destinationUrl:"https://hotel.example/property/h1/rate/r9?checkin=2026-10-10&checkout=2026-10-12&adults=2",
    expectedHost:"hotel.example",
    result:{ propertyId:"h1", checkIn:"2026-10-10", checkOut:"2026-10-12", occupancy:"2", roomId:"room-a", rateId:"rate-a" },
    destinationContext:{ propertyId:"h1", checkIn:"2026-10-10", checkOut:"2026-10-12", occupancy:"2", roomId:"room-a", rateId:"rate-a" }
  });
  assert.equal(exactHotel.exactness, "EXACT_RATE");

  const wrongHotel = build(api, {
    domain:"hotel",
    destinationUrl:"https://hotel.example/property/h2",
    expectedHost:"hotel.example",
    result:{ propertyId:"h1", checkIn:"2026-10-10", checkOut:"2026-10-12", occupancy:"2" },
    destinationContext:{ propertyId:"h2", checkIn:"2026-10-10", checkOut:"2026-10-12", occupancy:"2" }
  });
  assert.equal(wrongHotel.status, "blocked");
  assert.equal(wrongHotel.blockedReasons.includes("wrong_property_blocked"), true);

  const exactCruise = build(api, {
    domain:"cruise",
    destinationUrl:"https://cruise.example/sailing/s1?cabin=balcony",
    expectedHost:"cruise.example",
    result:{ sailingId:"s1", shipId:"ship-a", departureDate:"2026-11-01", cabinCategory:"balcony" },
    destinationContext:{ sailingId:"s1", shipId:"ship-a", departureDate:"2026-11-01", cabinCategory:"balcony" }
  });
  assert.equal(exactCruise.exactness, "EXACT_SAILING");

  const cruiseBooking = build(api, {
    domain:"cruise",
    destinationUrl:"https://cruise.example/booking/s1",
    expectedHost:"cruise.example",
    result:{ sailingId:"s1", shipId:"ship-a", departureDate:"2026-11-01" },
    destinationContext:{ sailingId:"s1", shipId:"ship-a", departureDate:"2026-11-01" }
  });
  assert.equal(cruiseBooking.status, "blocked");
  assert.equal(cruiseBooking.blockedReasons.includes("transaction_path_blocked"), true);

  const legacyGate = windowRef.WeishanSafeProviderDeepLinkHandoffGate.evaluateSafeProviderDeepLinkHandoff({
    providerName:"Google Flights",
    providerType:"flight_search",
    searchOnly:true,
    safeProviderHandoffUrl:"https://www.google.com/travel/flights?next=https%253A%252F%252Fevil.test%252Fcheckout"
  });
  assert.equal(legacyGate.status, "blocked");
  assert.equal(legacyGate.autoOpen, false);
  assert.equal(legacyGate.requiresExplicitUserAction, true);

  const safeLegacyGate = windowRef.WeishanSafeProviderDeepLinkHandoffGate.evaluateSafeProviderDeepLinkHandoff({
    providerName:"Google Flights",
    providerType:"flight_search",
    searchOnly:true,
    safeProviderHandoffUrl:"https://www.google.com/travel/flights?q=PVG%20CDG",
    origin:"PVG",
    destination:"CDG",
    departureDate:"2026-10-10"
  });
  assert.equal(safeLegacyGate.status, "confirmation_required");
  assert.equal(safeLegacyGate.autoOpen, false);

  const started = Date.now();
  for (let index = 0; index < 1000; index += 1) {
    const url = index % 2 === 0 ? "https://provider.example/item/" + index : "https://provider.example/checkout/" + index;
    api.buildHandoff({ domain:"shopping", destinationUrl:url, expectedHost:"provider.example", result:{ productId:"p" + index }, destinationContext:{ productId:"p" + index } });
  }
  assert.equal(Date.now() - started < 1000, true);

  const serialized = JSON.stringify({ exactOffer, exactFlight, exactHotel, exactCruise });
  assert.equal(serialized.includes("client_secret"), false);
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes("Bearer "), false);

  const preloadSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  assert.equal(preloadSource.includes("shell.openExternal(url)"), false);
  assert.equal(preloadSource.includes("UNSAFE_EXTERNAL_URL_BLOCKED"), true);

  console.log("HANDOFF_MODULE_EFFECTIVENESS PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
