;(function () {
  "use strict";
  const SOURCES = Object.freeze({
    cc_asian_market_public_api:Object.freeze({ providerId:"cc_asian_market_public", providerName:"C&C Asian Market", attributionUrl:"https://ccasianmarket.nl/" }),
    dutchshopper_public_api:Object.freeze({ providerId:"dutchshopper_public", providerName:"Dutchshopper", attributionUrl:"https://dutchshopper.com/" })
  });
  function text(value, max = 240) { const clean = String(value == null ? "" : value).trim(); return clean && clean.length <= max && !/[\u0000-\u001f\u007f]/.test(clean) ? clean : ""; }
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function source(sourceId) { return Object.prototype.hasOwnProperty.call(SOURCES, sourceId) ? SOURCES[sourceId] : null; }
  function status(input, sourceId) {
    const meta = source(sourceId); const ready = !!meta && input && input.ok === true;
    return { providerId:meta && meta.providerId || "", providerName:meta && meta.providerName || "", providerStatus:ready ? "AVAILABLE" : "UNAVAILABLE", connected:ready, executionMode:"public_readonly", readinessLevel:ready ? "ready" : "unavailable", label:ready ? "已连接" : "暂时不可用", stageLabel:"商户公开只读数据", sourceAttributionName:meta && meta.providerName || "", sourceAttributionUrl:meta && meta.attributionUrl || "", coverageRegion:"Netherlands", redacted:true };
  }
  function normalizeResult(input, options) {
    const safe = input && typeof input === "object" ? input : {}; const sourceId = text(options && options.sourceId, 80); const meta = source(sourceId);
    const truth = window.WeishanReadOnlyPriceTruthLayer;
    if (!meta || !truth || typeof truth.normalizePriceEvidence !== "function") return { ok:false, code:"PRICE_TRUTH_LAYER_UNAVAILABLE", candidates:[], status:status({ ok:false }, sourceId) };
    if (safe.ok !== true) return { ok:false, code:text(safe.code, 80) || "PRICE_SOURCE_UNAVAILABLE", candidates:[], status:status({ ok:false }, sourceId) };
    const candidates = (Array.isArray(safe.results) ? safe.results : []).slice(0, 3).map(function (item) {
      const normalized = truth.normalizePriceEvidence({ domain:"PRODUCT", sourceId:meta.providerId, sourceName:meta.providerName, sourceType:"PUBLIC_READ_ONLY", evidenceTruthClass:"REAL_PROVIDER_PRICE", retrievedAt:text(item.retrievedAt, 80), totalPrice:item.price, currency:text(item.currency, 3), priceCompleteness:"PARTIAL_PRICE", availabilityStatus:text(item.availabilityStatus, 40) || "UNKNOWN", priceBasis:"ITEM_TOTAL", itemId:text(item.canonicalProductIdentity || item.productId, 160), productName:text(item.title), condition:text(item.condition, 40) || "UNKNOWN", deepLink:text(item.officialUrl, 1000) }, { evaluatedAt:text(options && options.evaluatedAt, 80) || new Date().toISOString(), maxAgeSeconds:900 });
      if (!normalized || normalized.success !== true || !normalized.evidence || normalized.evidence.displayAsLiveCurrentPrice !== true) return null;
      const evidence = normalized.evidence;
      return { id:text(item.productId, 160), canonicalProductIdentity:text(item.canonicalProductIdentity || item.productId, 160), platformName:meta.providerName, merchantName:meta.providerName, sourceName:meta.providerName, sourceAttributionName:meta.providerName, sourceAttributionUrl:meta.attributionUrl, title:text(item.title), price:evidence.totalPrice, totalPrice:evidence.totalPrice, priceLabel:evidence.currency + " " + Number(evidence.totalPrice).toFixed(2), currency:evidence.currency, condition:evidence.condition, availability:String(evidence.availabilityStatus || "UNKNOWN").toLowerCase(), officialUrl:evidence.deepLink, targetUrl:evidence.deepLink, fetchedAt:evidence.retrievedAt, retrievedAt:evidence.retrievedAt, updatedAt:evidence.retrievedAt, priceFreshness:{ fetchedAt:evidence.retrievedAt, freshnessLevel:"fresh", ageSeconds:evidence.freshnessAgeSeconds, redacted:true }, dataSource:{ sourceType:"merchant_public_readonly", sourceStatus:"live_read_only", provider:meta.providerName, attributionUrl:meta.attributionUrl, region:"Netherlands", redacted:true }, sourceType:sourceId, trustLevel:"high", isOfficial:true, category:"product", coverageRegion:"Netherlands", priceCompleteness:"provider_conditions_incomplete", feeNote:"当前仅比较商品标价；配送、税费与其他费用未知。", responseProvenance:{ providerIdentity:meta.providerId, responseProvenance:sourceId, sourceType:"PUBLIC_READ_ONLY", redacted:true }, truthEvidence:clone(evidence), realExecution:false };
    }).filter(Boolean);
    return { ok:true, code:candidates.length ? "" : "SOURCE_NO_EXACT_RESULTS", candidates, status:status({ ok:true }, sourceId), requestId:text(safe.requestId, 120), requestCount:Number(safe.requestCount || 0), redacted:true };
  }
  window.WeishanNetherlandsRetailReadonlyAdapter = Object.freeze({ SOURCES, normalizeResult, status });
})();
