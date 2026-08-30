const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "../..");
const {
  createPrijsProfeetReadonlyService,
  SOURCE_ID
} = require(path.join(ROOT, "apps/desktop/src/main/prijsProfeetReadonlyService.js"));
const {
  SEARCH_CHANNEL,
  STATUS_CHANNEL,
  registerMerchantNativeReadonlyHandlers
} = require(path.join(ROOT, "apps/desktop/src/main/merchantNativeReadonlyRegistry.js"));

function response(payload, status = 200) {
  const bytes = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  let delivered = false;
  return {
    ok:status >= 200 && status < 300,
    status,
    headers:{ get:(name) => String(name).toLowerCase() === "content-length" ? String(bytes.byteLength) : null },
    body:{
      getReader(){
        return {
          read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }),
          cancel:async () => { delivered = true; },
          releaseLock(){}
        };
      }
    }
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

  const multiSearch = searchPayload();
  multiSearch.results.push(Object.assign({}, multiSearch.results[0], {
    product_id:"plus_123_2026-08-24",
    retailer:"plus",
    product_url:"https://www.plus.nl/product/coca-cola-original-123"
  }));
  const multi = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async (url) => {
      if (url.includes("/search?")) return response(multiSearch);
      if (url.includes("plus_123")) return response(detailPayload({ product_id:"plus_123_2026-08-24", retailer:"plus", product_url:"https://www.plus.nl/product/coca-cola-original-123", price:0.55 }));
      return response(detailPayload());
    }
  });
  const multiResult = await multi.search({ query:"Coca Cola", requestId:"request-multi", limit:3 });
  assert.equal(multiResult.requestCount, 3);
  assert.equal(multiResult.results.length, 2);
  const multiNormalized = adapter.normalizeResult(multiResult, { evaluatedAt:"2026-08-29T02:00:01.000Z" });
  assert.deepEqual(multiNormalized.candidates.map((item) => item.merchantId).sort(), ["albert_heijn", "plus"]);
  assert.equal(new Set(multiNormalized.candidates.map((item) => item.canonicalProductIdentity)).size, 1);
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
    { query:"cola", requestId:"" },
    Object.assign(Object.create({ inherited:true }), { query:"cola", requestId:"prototype" }),
    JSON.parse('{"query":"cola","requestId":"prototype-key","__proto__":{"trusted":true}}')
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

  let oversizedReads = 0;
  let oversizedCancelled = false;
  const tooLargeService = createPrijsProfeetReadonlyService({
    maxResponseBytes:4096,
    fetchImpl:async () => ({
      ok:true,
      headers:{ get:() => null },
      body:{ getReader:() => ({
        read:async () => {
          oversizedReads += 1;
          if (oversizedReads <= 3) return { done:false, value:Buffer.alloc(2500, 120) };
          return { done:true };
        },
        cancel:async () => { oversizedCancelled = true; },
        releaseLock(){}
      }) }
    })
  });
  const tooLarge = await tooLargeService.search({ query:"cola", requestId:"large" });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.code, "SOURCE_RESPONSE_TOO_LARGE");
  assert.equal(oversizedReads, 2);
  assert.equal(oversizedCancelled, true);

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
  registerMerchantNativeReadonlyHandlers({ handle(channel, handler) { handlers[channel] = handler; } }, {
    services:{ [SOURCE_ID]:dedupeService }
  });
  assert.deepEqual(Object.keys(handlers).sort(), [SEARCH_CHANNEL, STATUS_CHANNEL].sort());
  const rendererUrl = pathToFileURL(path.join(ROOT, "apps/desktop/src/index.html")).href;
  const mainFrame = { url:rendererUrl };
  const sender = { getURL:() => rendererUrl, mainFrame };
  const trustedEvent = { sender, senderFrame:mainFrame };
  const remoteEvent = { sender, senderFrame:{ url:"https://untrusted.invalid/frame" } };
  const subframeEvent = { sender, senderFrame:{ url:rendererUrl } };
  const otherMainFrame = { url:pathToFileURL(path.join(ROOT, "apps/desktop/src/other.html")).href };
  const otherLocalEvent = { sender:{ getURL:() => otherMainFrame.url, mainFrame:otherMainFrame }, senderFrame:otherMainFrame };
  for (const event of [remoteEvent, subframeEvent, otherLocalEvent, {}]) {
    assert.equal((await handlers[SEARCH_CHANNEL](event, { sourceId:SOURCE_ID, request:{ query:"cola", requestId:"blocked" } })).code, "SOURCE_CALLER_INVALID");
    assert.equal((await handlers[STATUS_CHANNEL](event, { sourceId:SOURCE_ID })).code, "SOURCE_CALLER_INVALID");
  }
  const status = await handlers[STATUS_CHANNEL](trustedEvent, { sourceId:SOURCE_ID });
  assert.equal(status.executionMode, "public_readonly");
  assert.equal(status.connected, false);
  assert.equal(status.configured, true);
  assert.equal(status.networkValidated, false);
  assert.equal(status.providerStatus, "CONFIGURED");
  assert.equal(status.authorizesExecution, false);
  assert.deepEqual(status.cachePolicy, { scope:"memory_only", ttlMs:60000, maxEntries:32, persistent:false });
  assert.deepEqual(status.throttlePolicy, { windowMs:60000, maxProviderRequests:8, maxConcurrentRequests:4, retryCount:0 });

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

  const releases = [];
  const concurrentService = createPrijsProfeetReadonlyService({
    now:() => "2026-08-29T02:00:00.000Z",
    fetchImpl:async () => new Promise((resolve) => releases.push(() => resolve(response({ results:[] }))))
  });
  const concurrent = Array.from({ length:4 }, (_, index) => concurrentService.search({ query:"parallel-" + index, requestId:"parallel-" + index }));
  await new Promise((resolve) => setImmediate(resolve));
  const concurrencyLimited = await concurrentService.search({ query:"parallel-4", requestId:"parallel-4" });
  assert.equal(concurrencyLimited.ok, false);
  assert.equal(concurrencyLimited.code, "SOURCE_CONCURRENCY_LIMITED");
  releases.forEach((release) => release());
  await Promise.all(concurrent);
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
