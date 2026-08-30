const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  API_ORIGIN,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  MEBLOSTAN_STATIC_DEFINITION,
  exactProductIdentityMatch,
  createMeblostanReadonlyService
} = require(path.join(ROOT, "apps/desktop/src/main/meblostanReadonlyService.js"));

function response(payload, status = 200) {
  const bytes = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  let delivered = false;
  return {
    ok:status >= 200 && status < 300,
    status,
    headers:{ get:(name) => String(name).toLowerCase() === "content-length" ? String(bytes.byteLength) : null },
    body:{ getReader:() => ({
      read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }),
      cancel:async () => { delivered = true; },
      releaseLock() {}
    }) }
  };
}

function product(overrides = {}) {
  return Object.assign({
    id:7332,
    name:"Jesionowy stolik kawowy",
    permalink:"https://meblostan.pl/sklep/jesionowy-stolik-kawowy/",
    on_sale:true,
    is_in_stock:true,
    prices:{ price:"1575", regular_price:"1750", sale_price:"1575", currency_code:"PLN", currency_minor_unit:0 }
  }, overrides);
}

async function main() {
  assert.equal(API_ORIGIN, "https://meblostan.pl");
  assert.equal(DEFAULT_TIMEOUT_MS, 8000);
  assert.equal(DEFAULT_MAX_RESPONSE_BYTES, 384 * 1024);
  assert.equal(MEBLOSTAN_STATIC_DEFINITION.limits.maxConcurrentRequests, 2);
  assert.equal(MEBLOSTAN_STATIC_DEFINITION.limits.maxRetries, 0);
  assert.equal(exactProductIdentityMatch("Jesionowy stolik kawowy", "Jesionowy stolik kawowy"), true);
  assert.equal(exactProductIdentityMatch("Jesionowy stolik kawowy", "Owalny stolik kawowy z lat 50"), false);

  const calls = [];
  const service = createMeblostanReadonlyService({
    now:() => "2026-08-30T12:00:00.000Z",
    fetchImpl:async (url, init) => { calls.push({ url, init }); return response([product()]); }
  });
  const result = await service.search({ query:"Jesionowy stolik kawowy", requestId:"meblostan-1", limit:1 });
  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(result.requestCount, 1);
  assert.equal(result.results.length, 1);
  assert.deepEqual({
    price:result.results[0].price,
    currency:result.results[0].currency,
    minor:result.results[0].currencyMinorUnit,
    regular:result.results[0].regularPrice,
    sale:result.results[0].salePrice,
    onSale:result.results[0].onSale,
    availability:result.results[0].availabilityStatus,
    shipping:result.results[0].shippingStatus,
    tax:result.results[0].taxStatus,
    fees:result.results[0].feesStatus
  }, { price:1575, currency:"PLN", minor:0, regular:1750, sale:1575, onSale:true, availability:"AVAILABLE", shipping:"UNKNOWN", tax:"UNKNOWN", fees:"UNKNOWN" });
  assert.equal(result.results[0].officialUrl, "https://meblostan.pl/sklep/jesionowy-stolik-kawowy/");
  assert.equal(result.results[0].condition, "REFURBISHED");
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.productionTraffic, false);
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).origin, "https://meblostan.pl");
  assert.equal(new URL(calls[0].url).pathname, "/wp-json/wc/store/v1/products");
  assert.equal(new URL(calls[0].url).searchParams.get("search"), "Jesionowy stolik kawowy");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(JSON.stringify(result).match(/authorization|api[_-]?key|secret|token/i), null);

  for (const [name, item] of [
    ["wrong identity", product({ name:"Owalny stolik kawowy z lat 50" })],
    ["wrong currency", product({ prices:Object.assign({}, product().prices, { currency_code:"EUR" }) })],
    ["zero price", product({ prices:Object.assign({}, product().prices, { price:"0" }) })],
    ["wrong host", product({ permalink:"https://evil.invalid/sklep/jesionowy-stolik-kawowy/" })],
    ["unsafe path", product({ permalink:"https://meblostan.pl/checkout/jesionowy-stolik-kawowy/" })]
  ]) {
    const rejected = await createMeblostanReadonlyService({ now:() => "2026-08-30T12:00:00.000Z", fetchImpl:async () => response([item]) })
      .search({ query:"Jesionowy stolik kawowy", requestId:name });
    assert.equal(rejected.ok, true);
    assert.equal(rejected.status, "no_results");
    assert.equal(rejected.results.length, 0);
  }

  const invalidInput = await service.search({ query:"https://evil.invalid", requestId:"bad", host:"evil.invalid" });
  assert.equal(invalidInput.ok, false);
  assert.equal(invalidInput.code, "SOURCE_INPUT_INVALID");

  const malformed = await createMeblostanReadonlyService({ fetchImpl:async () => response("{bad") })
    .search({ query:"Jesionowy stolik kawowy", requestId:"bad-json" });
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "SOURCE_RESPONSE_INVALID");

  console.log("MEBLOSTAN_READONLY_INTEGRATION PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
