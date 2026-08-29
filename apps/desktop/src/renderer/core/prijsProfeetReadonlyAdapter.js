;(function () {
  "use strict";

  const VERSION = "1.0.0";
  const PROVIDER_ID = "prijsprofeet_public";
  const PROVIDER_NAME = "PrijsProfeet";
  const ATTRIBUTION_URL = "https://www.prijsprofeet.nl/";
  const RETAILER_LABELS = Object.freeze({
    albert_heijn:"Albert Heijn",
    aldi:"ALDI",
    dekamarkt:"DekaMarkt",
    dirk:"Dirk",
    ekoplaza:"Ekoplaza",
    hoogvliet:"Hoogvliet",
    jumbo:"Jumbo",
    lidl:"Lidl",
    plus:"PLUS",
    vomar:"Vomar"
  });

  function text(value, max) {
    const normalized = String(value == null ? "" : value).trim();
    return normalized && normalized.length <= (max || 240) && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : "";
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function status(input) {
    const safe = input && typeof input === "object" ? input : {};
    return {
      providerId:PROVIDER_ID,
      providerName:PROVIDER_NAME,
      providerStatus:safe.ok === true ? "AVAILABLE" : "UNAVAILABLE",
      connected:safe.ok === true,
      executionMode:"public_readonly",
      readinessLevel:safe.ok === true ? "ready" : "unavailable",
      label:safe.ok === true ? "已连接" : "暂时不可用",
      stageLabel:"公开只读数据",
      adapterVersion:VERSION + "-prijsprofeet-public-readonly",
      userMessage:safe.ok === true
        ? "PrijsProfeet 当前价格查询已连接；结果仅用于只读比较，并须在零售商页面核验。"
        : "PrijsProfeet 当前价格查询暂时不可用。",
      sourceAttributionName:PROVIDER_NAME,
      sourceAttributionUrl:ATTRIBUTION_URL,
      redacted:true
    };
  }

  function normalizeResult(input, options) {
    const safe = input && typeof input === "object" ? input : {};
    const opts = options && typeof options === "object" ? options : {};
    const truth = window.WeishanReadOnlyPriceTruthLayer;
    if (!truth || typeof truth.normalizePriceEvidence !== "function") {
      return { ok:false, code:"PRICE_TRUTH_LAYER_UNAVAILABLE", candidates:[], status:status({ ok:false }) };
    }
    if (safe.ok !== true) {
      return { ok:false, code:text(safe.code, 80) || "PRICE_SOURCE_UNAVAILABLE", candidates:[], status:status({ ok:false }) };
    }
    const sourceResults = Array.isArray(safe.results) ? safe.results.slice(0, 1) : [];
    const candidates = sourceResults.map(function (item) {
      const evidenceResult = truth.normalizePriceEvidence({
        domain:"PRODUCT",
        sourceId:PROVIDER_ID,
        sourceName:PROVIDER_NAME,
        sourceType:"PUBLIC_READ_ONLY",
        evidenceTruthClass:"REAL_PROVIDER_PRICE",
        retrievedAt:text(item.retrievedAt, 80),
        totalPrice:item.price,
        currency:text(item.currency, 3),
        priceCompleteness:"PARTIAL_PRICE",
        availabilityStatus:text(item.availabilityStatus, 40),
        priceBasis:"ITEM_TOTAL",
        itemId:text(item.productId, 160),
        productName:text(item.title, 240),
        variant:text(item.quantity, 80),
        condition:"NEW",
        deepLink:text(item.officialUrl, 1000)
      }, {
        evaluatedAt:text(opts.evaluatedAt, 80) || new Date().toISOString(),
        maxAgeSeconds:900
      });
      if (!evidenceResult || evidenceResult.success !== true || !evidenceResult.evidence || evidenceResult.evidence.displayAsLiveCurrentPrice !== true) return null;
      const evidence = evidenceResult.evidence;
      const retailer = text(item.retailer, 40).toLowerCase();
      const retailerLabel = RETAILER_LABELS[retailer] || text(item.retailer, 40) || "零售商";
      const providerUpdatedAt = text(item.extractedAt, 80);
      return {
        id:text(item.productId, 160),
        platformName:retailerLabel + " via " + PROVIDER_NAME,
        sourceName:PROVIDER_NAME,
        sourceAttributionName:PROVIDER_NAME,
        sourceAttributionUrl:ATTRIBUTION_URL,
        title:text(item.title, 240),
        brand:text(item.brand, 120),
        price:evidence.totalPrice,
        totalPrice:evidence.totalPrice,
        priceLabel:evidence.currency + " " + Number(evidence.totalPrice).toFixed(2),
        currency:evidence.currency,
        availability:"unknown",
        officialUrl:evidence.deepLink,
        targetUrl:evidence.deepLink,
        fetchedAt:evidence.retrievedAt,
        retrievedAt:evidence.retrievedAt,
        providerUpdatedAt:providerUpdatedAt,
        updatedAt:providerUpdatedAt || evidence.retrievedAt,
        promotionStatus:"active",
        validFrom:text(item.validFrom, 10),
        validUntil:text(item.validUntil, 10),
        priceFreshness:{
          fetchedAt:evidence.retrievedAt,
          freshnessLevel:evidence.evidenceFreshness === "CURRENT" ? "fresh" : "stale",
          ageSeconds:evidence.freshnessAgeSeconds,
          redacted:true
        },
        availabilityFreshness:{
          checkedAt:evidence.retrievedAt,
          availabilityStatus:"unknown",
          freshnessLevel:evidence.evidenceFreshness === "CURRENT" ? "fresh" : "stale",
          redacted:true
        },
        dataSource:{
          sourceType:"public_readonly",
          sourceStatus:"live_read_only",
          provider:PROVIDER_NAME,
          attributionUrl:ATTRIBUTION_URL,
          redacted:true
        },
        dataQuality:{ qualityLevel:"medium", redacted:true },
        realDataValidation:{ validationStatus:"passed", confidence:"medium", redacted:true },
        sourceType:"prijsprofeet_public_api",
        trustLevel:"high",
        isOfficial:false,
        category:"product",
        priceCompleteness:"provider_conditions_incomplete",
        feeNote:"当前商品标价来自公开只读数据；配送、税费与其他条件未知。",
        riskNote:"价格可能变化；请在零售商页面核验商品规格、有效期与最终价格。",
        recommendationReason:"当前有效的公开只读商品价格，带有明确商品身份、币种、来源与官方零售商链接。",
        responseProvenance:{
          providerIdentity:PROVIDER_ID,
          responseProvenance:"prijsprofeet_public_api",
          sourceType:"PUBLIC_READ_ONLY",
          redacted:true
        },
        truthEvidence:clone(evidence),
        realExecution:false
      };
    }).filter(Boolean);
    return {
      ok:true,
      code:candidates.length ? "" : (safe.status === "no_results" ? "SOURCE_NO_CURRENT_RESULTS" : "PRICE_EVIDENCE_REJECTED"),
      candidates,
      status:status({ ok:true }),
      requestId:text(safe.requestId, 120),
      requestCount:Number(safe.requestCount || 0),
      redacted:true
    };
  }

  window.WeishanPrijsProfeetReadonlyAdapter = Object.freeze({
    VERSION,
    PROVIDER_ID,
    PROVIDER_NAME,
    ATTRIBUTION_URL,
    normalizeResult,
    status
  });
})();
