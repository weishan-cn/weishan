const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  buildReadonlyResultCacheKey,
  createGlobalShoppingReadonlyResultCache
} = require(path.join(ROOT, "apps/desktop/src/main/globalShoppingReadonlyResultCache.js"));

function main() {
  const key = buildReadonlyResultCacheKey({
    keyword:"Nintendo Switch",
    page:1,
    hits:3,
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(key, "nintendo switch|1|3|jp|jpy");

  let nowMs = Date.parse("2026-07-11T00:00:00.000Z");
  const cache = createGlobalShoppingReadonlyResultCache({
    ttlMs:1000,
    maxEntries:2,
    now:() => nowMs
  });

  cache.set({ keyword:"Nintendo Switch", page:1, hits:3, destinationCountry:"JP", currency:"JPY" }, {
    status:"ready",
    results:[{ title:"Nintendo Switch", sourceType:"rakuten_official_api" }],
    metadata:{ redacted:true }
  });
  let hit = cache.get({ keyword:"Nintendo Switch", page:1, hits:3, destinationCountry:"JP", currency:"JPY" });
  assert.equal(hit.hit, true);
  assert.equal(hit.metadata.freshnessLevel, "fresh");
  assert.equal(JSON.stringify(hit.value).includes("accessKey"), false);

  nowMs += 2500;
  hit = cache.get({ keyword:"Nintendo Switch", page:1, hits:3, destinationCountry:"JP", currency:"JPY" });
  assert.equal(hit.hit, true);
  assert.equal(hit.metadata.freshnessLevel, "stale");

  nowMs += 2500;
  hit = cache.get({ keyword:"Nintendo Switch", page:1, hits:3, destinationCountry:"JP", currency:"JPY" });
  assert.equal(hit.hit, false);

  cache.set({ keyword:"A", page:1, hits:1, destinationCountry:"JP", currency:"JPY" }, { ok:true });
  cache.set({ keyword:"B", page:1, hits:1, destinationCountry:"JP", currency:"JPY" }, { ok:true });
  cache.set({ keyword:"C", page:1, hits:1, destinationCountry:"JP", currency:"JPY" }, { ok:true });
  assert.equal(cache.inspect().entryCount, 2);

  console.log("GLOBAL_SHOPPING_READONLY_RESULT_CACHE PASS");
}

main();
