const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Date });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/stateCachePersistenceGuard.js"), "utf8"),
    context,
    { filename:"stateCachePersistenceGuard.js" }
  );
  return window.WeishanStateCachePersistenceGuard;
}

function assertMiss(api, record, request, reason) {
  const result = api.evaluateCacheRecord(record, request);
  assert.equal(result.status, "miss");
  if (reason) assert.equal(result.reason, reason);
  assert.equal(/secret-value|bearer-token|private-key|authorization-header/i.test(JSON.stringify(result)), false);
}

function main() {
  const api = load();
  const nowMs = Date.parse("2026-08-26T00:00:00.000Z");

  assert.equal(api.classifyState({ key:"activeRequestId" }), "EPHEMERAL_REQUEST");
  assert.equal(api.classifyState({ key:"selectedResult" }), "EPHEMERAL_RESULT");
  assert.equal(api.classifyState({ key:"language" }), "DURABLE_USER_PREFERENCE");
  assert.equal(api.classifyState({ key:"weishan.v2.history.items" }), "DURABLE_USER_CONTENT");
  assert.equal(api.classifyState({ key:"providerReadinessCache" }), "SESSION_CACHE");

  const baseShopping = {
    domain:"shopping",
    route:"global-shopping",
    sourceId:"daisycon",
    sourceEnvironment:"live",
    currency:"USD",
    query:"MacBook Air",
    variant:"16GB/512GB",
    condition:"new",
    market:"US",
    nowMs
  };
  const shoppingKey = api.buildCacheKey(baseShopping);
  assert.notEqual(shoppingKey, api.buildCacheKey(Object.assign({}, baseShopping, { domain:"flight", origin:"CTU", destination:"PEK", departureDate:"2026-09-01" })));
  assert.notEqual(shoppingKey, api.buildCacheKey(Object.assign({}, baseShopping, { variant:"16GB/256GB" })));
  assert.notEqual(shoppingKey, api.buildCacheKey(Object.assign({}, baseShopping, { condition:"used" })));
  assert.notEqual(shoppingKey, api.buildCacheKey(Object.assign({}, baseShopping, { sourceEnvironment:"sandbox" })));

  const flight = {
    domain:"flight",
    route:"travel",
    sourceId:"flight-source",
    sourceEnvironment:"live",
    currency:"USD",
    origin:"CTU",
    destination:"PEK",
    departureDate:"2026-09-01",
    returnDate:"2026-09-08",
    passengers:2,
    cabin:"economy",
    nowMs
  };
  const flightKey = api.buildCacheKey(flight);
  assert.notEqual(flightKey, api.buildCacheKey(Object.assign({}, flight, { departureDate:"2026-09-02" })));
  assert.notEqual(flightKey, api.buildCacheKey(Object.assign({}, flight, { passengers:1 })));
  assert.notEqual(flightKey, api.buildCacheKey(Object.assign({}, flight, { cabin:"business" })));

  const hotel = {
    domain:"hotel",
    route:"travel",
    sourceId:"hotelbeds",
    sourceEnvironment:"evaluation",
    currency:"USD",
    propertyId:"H123",
    checkIn:"2026-09-01",
    checkOut:"2026-09-03",
    occupancy:"2-adults",
    rooms:1,
    nowMs
  };
  const hotelKey = api.buildCacheKey(hotel);
  assert.notEqual(hotelKey, api.buildCacheKey(Object.assign({}, hotel, { occupancy:"1-adult" })));
  assert.notEqual(hotelKey, api.buildCacheKey(Object.assign({}, hotel, { checkOut:"2026-09-04" })));

  const cruise = {
    domain:"cruise",
    route:"travel",
    sourceId:"cruise-source",
    sourceEnvironment:"live",
    currency:"USD",
    sailingId:"S1",
    date:"2026-10-01",
    ship:"ship-a",
    cabin:"balcony",
    occupancy:"2",
    nowMs
  };
  const cruiseKey = api.buildCacheKey(cruise);
  assert.notEqual(cruiseKey, api.buildCacheKey(Object.assign({}, cruise, { cabin:"inside" })));

  const valid = api.buildCacheRecord({
    request:baseShopping,
    ttlMs:15 * 60 * 1000,
    observedAt:nowMs,
    dataClass:"LIVE_DATA",
    value:{ title:"MacBook Air", price:999, currency:"USD", nested:{ supplier:"retailer" } },
    nowMs
  });
  const hit = api.evaluateCacheRecord(valid, baseShopping);
  assert.equal(hit.status, "hit");
  assert.equal(hit.value.title, "MacBook Air");
  assert.equal(/secret-value|bearer-token|authorization-header/i.test(JSON.stringify(hit)), false);

  assertMiss(api, valid, Object.assign({}, baseShopping, { domain:"mail", intent:"MacBook Air" }), "cache_key_mismatch");
  assertMiss(api, valid, Object.assign({}, baseShopping, { variant:"16GB/256GB" }), "cache_key_mismatch");
  assertMiss(api, valid, Object.assign({}, baseShopping, { currency:"EUR" }), "cache_key_mismatch");

  const expired = api.buildCacheRecord({
    request:baseShopping,
    ttlMs:60 * 1000,
    observedAt:nowMs - 120000,
    dataClass:"LIVE_DATA",
    value:{ title:"old" },
    nowMs:nowMs - 120000
  });
  assertMiss(api, expired, baseShopping, "expired");

  assertMiss(api, Object.assign({}, valid, { observedAtMs:null }), baseShopping, "missing_freshness");
  assertMiss(api, Object.assign({}, valid, { observedAtMs:nowMs + 120000 }), baseShopping, "future_freshness_rejected");

  const sandbox = api.buildCacheRecord({
    request:Object.assign({}, baseShopping, { sourceEnvironment:"sandbox" }),
    ttlMs:15 * 60 * 1000,
    observedAt:nowMs,
    dataClass:"SANDBOX_TEST_DATA",
    value:{ title:"sandbox item", price:1 },
    nowMs
  });
  assertMiss(api, sandbox, Object.assign({}, baseShopping, { sourceEnvironment:"sandbox", expectedSourceEnvironment:"production" }), "test_or_sandbox_not_live");

  const poisoned = api.buildCacheRecord({
    request:baseShopping,
    ttlMs:15 * 60 * 1000,
    observedAt:nowMs,
    dataClass:"LIVE_DATA",
    value:JSON.parse("{\"title\":\"Poison\",\"trusted\":true,\"__proto__\":{\"polluted\":true},\"token\":\"bearer-token\"}"),
    nowMs
  });
  const poisonedResult = api.evaluateCacheRecord(poisoned, baseShopping);
  assert.equal(poisonedResult.status, "hit");
  assert.equal(poisonedResult.value.title, "Poison");
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal("trusted" in poisonedResult.value, false);
  assert.equal("token" in poisonedResult.value, false);

  const cache = api.createBoundedCache({ maxEntries:3 });
  const mutable = { title:"snapshot", price:10 };
  cache.put({ request:Object.assign({}, baseShopping, { variant:"A" }), ttlMs:1000, observedAt:nowMs, dataClass:"LIVE_DATA", value:mutable, nowMs });
  mutable.price = 99;
  const snapshot = cache.get(Object.assign({}, baseShopping, { variant:"A" }));
  assert.equal(snapshot.status, "hit");
  assert.equal(snapshot.value.price, 10);
  cache.put({ request:Object.assign({}, baseShopping, { variant:"B" }), ttlMs:1000, observedAt:nowMs, dataClass:"LIVE_DATA", value:{ id:"B" }, nowMs });
  cache.put({ request:Object.assign({}, baseShopping, { variant:"C" }), ttlMs:1000, observedAt:nowMs, dataClass:"LIVE_DATA", value:{ id:"C" }, nowMs });
  cache.put({ request:Object.assign({}, baseShopping, { variant:"D" }), ttlMs:1000, observedAt:nowMs, dataClass:"LIVE_DATA", value:{ id:"D" }, nowMs });
  assert.equal(cache.size(), 3);
  assert.equal(cache.get(Object.assign({}, baseShopping, { variant:"A" })).status, "miss");
  assert.equal(cache.clearDomain("shopping").removed, 3);

  const recovered = api.recoverPersistedState(JSON.stringify({
    schemaVersion:1,
    currentRoute:"cloud",
    language:"zh",
    appearance:"system",
    sidebarCollapsed:true,
    loading:true,
    activeRequestId:"old-request",
    retryCount:2,
    selectedResult:{ id:"stale" },
    recommendation:{ id:"stale-winner" },
    handoffUrl:"https://example.com/checkout?token=secret-value",
    providerReadyCache:{ hotelbeds:{ ready:true } },
    token:"secret-value"
  }));
  assert.equal(recovered.currentRoute, "home");
  assert.equal(recovered.durablePreferences.language, "zh");
  assert.equal(recovered.durablePreferences.sidebarCollapsed, true);
  assert.equal(recovered.droppedEphemeralKeys.includes("loading"), true);
  assert.equal(recovered.droppedEphemeralKeys.includes("retryCount"), true);
  assert.equal(recovered.droppedEphemeralKeys.includes("recommendation"), true);
  assert.equal(recovered.droppedEphemeralKeys.includes("handoffUrl"), true);
  assert.equal(/secret-value/.test(JSON.stringify(recovered)), false);

  const corrupt = api.recoverPersistedState("{ partial json");
  assert.equal(corrupt.status, "recovered");
  assert.equal(corrupt.currentRoute, "home");
  assert.equal(corrupt.warnings.includes("corrupt_json"), true);

  const oldSchema = api.recoverPersistedState(JSON.stringify({ schemaVersion:0, currentRoute:"shopping", language:"en" }));
  assert.equal(oldSchema.currentRoute, "shopping");
  assert.equal(oldSchema.warnings.includes("old_schema_recovered"), false);
  const futureSchema = api.recoverPersistedState(JSON.stringify({ schemaVersion:999, currentRoute:"enterprise", language:"en" }));
  assert.equal(futureSchema.currentRoute, "home");
  assert.equal(futureSchema.warnings.includes("future_schema_ignored"), true);

  const suite = api.runStateCachePersistenceEffectivenessSuite();
  Object.values(suite.zeroMetrics).forEach((value) => assert.equal(value, 0));
  assert.equal(suite.productResult.CACHE_KEY_DESIGN, "OPTIMIZE");
  assert.equal(suite.productResult.SECRET_STATE_EXCLUSION, "KEEP");
  assert.ok(suite.moduleMatrix.length >= 8);

  const perfCache = api.createBoundedCache({ maxEntries:1000 });
  for (let index = 0; index < 1000; index += 1) {
    perfCache.put({
      request:Object.assign({}, baseShopping, { variant:"perf-" + index }),
      ttlMs:1000,
      observedAt:nowMs,
      dataClass:"LIVE_DATA",
      value:{ index },
      nowMs
    });
  }
  assert.equal(perfCache.size(), 1000);
  for (let index = 1000; index < 1500; index += 1) {
    perfCache.put({
      request:Object.assign({}, baseShopping, { variant:"perf-" + index }),
      ttlMs:1000,
      observedAt:nowMs,
      dataClass:"LIVE_DATA",
      value:{ index },
      nowMs
    });
  }
  assert.equal(perfCache.size(), 1000);

  console.log("State cache persistence effectiveness: PASS");
}

main();
