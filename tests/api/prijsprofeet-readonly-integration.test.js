const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const {
  createPrijsProfeetReadonlyService,
  registerPrijsProfeetReadonlyHandlers
} = require(path.join(ROOT, "apps/desktop/src/main/prijsProfeetReadonlyService.js"));

function response(payload, status = 200) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => typeof payload === "string" ? payload : JSON.stringify(payload)
  };
}

function searchPayload(url = "https://www.ah.nl/producten/product/wi477045/coca-cola-original") {
  return {
    page:1,
    page_size:10,
    query:"coca cola",
    total:1,
    results:[{
      product_id:"ah_wi477045_2026-08-24",
      name:"Coca-Cola Original",
      brand:"Coca-Cola",
      price:0.57,
      retailer:"albert_heijn",
      product_url:url,
      promotion_status:"active",
      valid_from:"2026-08-24",
      valid_until:"2026-08-30"
    }]
  };
}

function detailPayload(overrides = {}) {
  return Object.assign({
    product_id:"ah_wi477045_2026-08-24",
    name:"Coca-Cola Original",
    brand:"Coca-Cola",
    ean:"5000112658620",
    price:0.57,
    currency:"EUR",
    quantity:"250 ml",
    unit:"L",
    unit_price:2.28,
    retailer:"albert_heijn",
    product_url:"https://www.ah.nl/producten/product/wi477045/coca-cola-original",
    promotion_status:"active",
    valid_from:"2026-08-24",
    valid_until:"2026-08-30",
    extracted_at:"2026-08-28T23:00:56.089000"
  }, overrides);
}

function loadRendererAdapter() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console, Date });
  [
    "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js",
    "apps/desktop/src/renderer/core/prijsProfeetReadonlyAdapter.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window.WeishanPrijsProfeetReadonlyAdapter;
}

async function testHappyPathAndTruthLayer() {
  const calls = [];
  const service = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async (url, init) => {
      calls.push({ url, init });
      return calls.length === 1 ? response(searchPayload()) : response(detailPayload());
    }
  });
  const result = await service.search({ query:"Coca Cola", requestId:"request-1", limit:1 });
  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(result.requestCount, 2);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].price, 0.57);
  assert.equal(result.results[0].currency, "EUR");
  assert.equal(result.results[0].officialUrl, "https://www.ah.nl/producten/product/wi477045/coca-cola-original");
  assert.equal(result.results[0].availabilityStatus, "UNKNOWN");
  assert.equal(result.results[0].priceCompleteness, "PARTIAL_PRICE");
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.productionTraffic, false);
  assert.match(calls[0].url, /^https:\/\/www\.prijsprofeet\.nl\/api\/v1\/search\?/);
  assert.match(calls[1].url, /^https:\/\/www\.prijsprofeet\.nl\/api\/v1\/products\//);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.headers["User-Agent"], "Weishan/1.0 (+https://weishan.ai)");
  assert.equal(JSON.stringify(result).match(/authorization|api[_-]?key|secret|token/i), null);

  const adapter = loadRendererAdapter();
  const normalized = adapter.normalizeResult(result, { evaluatedAt:"2026-08-29T02:00:01.000Z" });
  assert.equal(normalized.ok, true);
  assert.equal(normalized.candidates.length, 1);
  assert.equal(normalized.candidates[0].priceLabel, "EUR 0.57");
  assert.equal(normalized.candidates[0].truthEvidence.evidenceTruthClass, "REAL_PROVIDER_PRICE");
  assert.equal(normalized.candidates[0].truthEvidence.sourceType, "PUBLIC_READ_ONLY");
  assert.equal(normalized.candidates[0].truthEvidence.displayAsLiveCurrentPrice, true);
  assert.equal(normalized.candidates[0].truthEvidence.comparableAsVerifiedTotal, false);
  assert.equal(normalized.candidates[0].sourceAttributionUrl, "https://www.prijsprofeet.nl/");
  assert.equal(normalized.candidates[0].targetUrl, "https://www.ah.nl/producten/product/wi477045/coca-cola-original");
}

async function testInputAndResponseFailuresFailClosed() {
  const unused = async () => { throw new Error("must not fetch"); };
  const inputService = createPrijsProfeetReadonlyService({ fetchImpl:unused });
  for (const payload of [
    { query:"", requestId:"x" },
    { query:"https://example.com", requestId:"x" },
    { query:"cola", requestId:"x", url:"https://evil.example" },
    { query:"cola", requestId:"x", authorization:"Bearer test" },
    { query:{ value:"cola" }, requestId:"x" },
    { query:"cola", requestId:{ value:"x" } },
    { query:"cola", requestId:"" }
  ]) {
    const result = await inputService.search(payload);
    assert.equal(result.ok, false);
    assert.equal(result.code, "SOURCE_INPUT_INVALID");
  }

  let calls = 0;
  const unsafeUrlService = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async () => { calls += 1; return response(searchPayload("https://evil.example/product")); }
  });
  const noResult = await unsafeUrlService.search({ query:"cola", requestId:"unsafe" });
  assert.equal(noResult.ok, true);
  assert.equal(noResult.status, "no_results");
  assert.equal(calls, 1);

  const missingCurrencyService = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async (_url) => _url.includes("/search?") ? response(searchPayload()) : response(detailPayload({ currency:null }))
  });
  const missingCurrency = await missingCurrencyService.search({ query:"cola", requestId:"currency" });
  assert.equal(missingCurrency.ok, false);
  assert.equal(missingCurrency.code, "SOURCE_RESPONSE_INVALID");

  for (const [requestId, detail] of [
    ["price", detailPayload({ price:-1 })],
    ["source", detailPayload({ retailer:null })]
  ]) {
    const invalidService = createPrijsProfeetReadonlyService({
      now:() => "2026-08-29T02:00:00.000Z",
      fetchImpl:async (_url) => _url.includes("/search?") ? response(searchPayload()) : response(detail)
    });
    const invalid = await invalidService.search({ query:"cola", requestId });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.code, "SOURCE_RESPONSE_INVALID");
  }

  const malformedService = createPrijsProfeetReadonlyService({ fetchImpl:async () => response("{not-json") });
  const malformed = await malformedService.search({ query:"cola", requestId:"json" });
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "SOURCE_RESPONSE_INVALID");

  const tooLargeService = createPrijsProfeetReadonlyService({ maxResponseBytes:4096, fetchImpl:async () => response("x".repeat(5000)) });
  const tooLarge = await tooLargeService.search({ query:"cola", requestId:"large" });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.code, "SOURCE_RESPONSE_TOO_LARGE");

  const networkService = createPrijsProfeetReadonlyService({ fetchImpl:async () => { throw new Error("network down"); } });
  const networkFailure = await networkService.search({ query:"cola", requestId:"network" });
  assert.equal(networkFailure.ok, false);
  assert.equal(networkFailure.code, "SOURCE_UNAVAILABLE");
}

async function testTimeoutDedupeAndIpcBoundary() {
  const timeoutService = createPrijsProfeetReadonlyService({
    timeoutMs:1000,
    fetchImpl:(_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name:"AbortError" })));
    })
  });
  const timedOut = await timeoutService.search({ query:"cola", requestId:"timeout" });
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.code, "SOURCE_TIMEOUT");

  let calls = 0;
  let releaseSearch;
  const searchPromise = new Promise((resolve) => { releaseSearch = resolve; });
  const dedupeService = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async (url) => {
      calls += 1;
      if (url.includes("/search?")) { await searchPromise; return response(searchPayload()); }
      return response(detailPayload());
    }
  });
  const first = dedupeService.search({ query:"cola", requestId:"dedupe-1" });
  const second = dedupeService.search({ query:"COLA", requestId:"dedupe-2" });
  releaseSearch();
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.equal(calls, 2);
  assert.equal(firstResult.requestId, "dedupe-1");
  assert.equal(secondResult.requestId, "dedupe-2");
  const cachedResult = await dedupeService.search({ query:"cola", requestId:"cache-1" });
  assert.equal(calls, 2);
  assert.equal(cachedResult.requestId, "cache-1");
  assert.equal(cachedResult.requestCount, 0);
  assert.equal(cachedResult.cacheStatus, "memory_hit");

  const handlers = {};
  registerPrijsProfeetReadonlyHandlers({ handle(channel, handler) { handlers[channel] = handler; } }, { service:dedupeService });
  assert.deepEqual(Object.keys(handlers).sort(), [
    "global-shopping:prijsprofeet-readonly-search",
    "global-shopping:prijsprofeet-readonly-status"
  ]);
  const status = await handlers["global-shopping:prijsprofeet-readonly-status"]();
  assert.equal(status.executionMode, "public_readonly");
  assert.equal(status.connected, false);
  assert.equal(status.configured, true);
  assert.equal(status.networkValidated, false);
  assert.equal(status.providerStatus, "CONFIGURED");
  assert.equal(status.authorizesExecution, false);
  assert.deepEqual(status.cachePolicy, { scope:"memory_only", ttlMs:60000, maxEntries:32, persistent:false });
  assert.deepEqual(status.throttlePolicy, { windowMs:60000, maxProviderRequests:8, retryCount:0 });

  let limitedCalls = 0;
  const limitedService = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async () => { limitedCalls += 1; return response({ results:[] }); }
  });
  for (let index = 0; index < 8; index += 1) {
    const allowed = await limitedService.search({ query:"query-" + index, requestId:"rate-" + index });
    assert.equal(allowed.ok, true);
  }
  const limited = await limitedService.search({ query:"query-9", requestId:"rate-9" });
  assert.equal(limited.ok, false);
  assert.equal(limited.code, "SOURCE_RATE_LIMITED");
  assert.equal(limitedCalls, 8);
}

async function main() {
  await testHappyPathAndTruthLayer();
  await testInputAndResponseFailuresFailClosed();
  await testTimeoutDedupeAndIpcBoundary();
  console.log("PRIJS_PROFEET_READONLY_INTEGRATION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
