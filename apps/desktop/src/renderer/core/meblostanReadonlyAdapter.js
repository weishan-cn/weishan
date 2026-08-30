;(function () {
  "use strict";

  const VERSION = "1.0.0";
  const PROVIDER_ID = "meblostan_public";
  const PROVIDER_NAME = "Meblostan";
  const ATTRIBUTION_URL = "https://meblostan.pl/";

  function text(value, max) {
    const normalized = String(value == null ? "" : value).trim();
    return normalized && normalized.length <= (max || 240) && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : "";
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function positive(value) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
  }

  function minorUnit(value) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 4 ? parsed : 2;
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
      stageLabel:"商户公开只读数据",
      adapterVersion:VERSION + "-meblostan-public-readonly",
      userMessage:safe.ok === true
        ? "Meblostan 当前价格查询已连接；覆盖波兰复古家具，配送、税费与最终可售状态须在商户页面核验。"
        : "Meblostan 当前价格查询暂时不可用。",
      sourceAttributionName:PROVIDER_NAME,
      sourceAttributionUrl:ATTRIBUTION_URL,
      coverageRegion:"Poland",
      coverageClass:"vintage_furniture_home_furnishings",
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
    const candidates = (Array.isArray(safe.results) ? safe.results.slice(0, 1) : []).map(function (item) {
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
        availabilityStatus:text(item.availabilityStatus, 40) || "UNKNOWN",
        priceBasis:"ITEM_TOTAL",
        itemId:text(item.productId, 160),
        productName:text(item.title, 240),
        condition:text(item.condition, 40) || "UNKNOWN",
        deepLink:text(item.officialUrl, 1000)
      }, {
        evaluatedAt:text(opts.evaluatedAt, 80) || new Date().toISOString(),
        maxAgeSeconds:900
      });
      if (!evidenceResult || evidenceResult.success !== true || !evidenceResult.evidence || evidenceResult.evidence.displayAsLiveCurrentPrice !== true) return null;
      const evidence = evidenceResult.evidence;
      const decimals = minorUnit(item.currencyMinorUnit);
      const regularPrice = positive(item.regularPrice);
      const salePrice = positive(item.salePrice);
      const onSale = item.onSale === true && regularPrice !== null && salePrice !== null && salePrice < regularPrice && salePrice === evidence.totalPrice;
      return {
        id:text(item.productId, 160),
        platformName:PROVIDER_NAME,
        merchantName:PROVIDER_NAME,
        sourceName:PROVIDER_NAME,
        sourceAttributionName:PROVIDER_NAME,
        sourceAttributionUrl:ATTRIBUTION_URL,
        title:text(item.title, 240),
        price:evidence.totalPrice,
        totalPrice:evidence.totalPrice,
        priceLabel:evidence.currency + " " + Number(evidence.totalPrice).toFixed(decimals),
        currency:evidence.currency,
        currencyMinorUnit:decimals,
        regularPrice:onSale ? regularPrice : null,
        salePrice:onSale ? salePrice : null,
        onSale,
        condition:evidence.condition,
        availability:String(evidence.availabilityStatus || "UNKNOWN").toLowerCase(),
        officialUrl:evidence.deepLink,
        targetUrl:evidence.deepLink,
        fetchedAt:evidence.retrievedAt,
        retrievedAt:evidence.retrievedAt,
        updatedAt:evidence.retrievedAt,
        priceFreshness:{ fetchedAt:evidence.retrievedAt, freshnessLevel:evidence.evidenceFreshness === "CURRENT" ? "fresh" : "stale", ageSeconds:evidence.freshnessAgeSeconds, redacted:true },
        availabilityFreshness:{ checkedAt:evidence.retrievedAt, availabilityStatus:String(evidence.availabilityStatus || "UNKNOWN").toLowerCase(), freshnessLevel:evidence.evidenceFreshness === "CURRENT" ? "fresh" : "stale", redacted:true },
        dataSource:{ sourceType:"merchant_public_readonly", sourceStatus:"live_read_only", provider:PROVIDER_NAME, attributionUrl:ATTRIBUTION_URL, region:"Poland", redacted:true },
        dataQuality:{ qualityLevel:"medium", redacted:true },
        realDataValidation:{ validationStatus:"passed", confidence:"medium", redacted:true },
        sourceType:"meblostan_public_api",
        trustLevel:"high",
        isOfficial:true,
        category:"product",
        coverageRegion:"Poland",
        coverageClass:"vintage_furniture_home_furnishings",
        priceCompleteness:"provider_conditions_incomplete",
        feeNote:"当前商品标价来自商户公开只读数据；配送、税费与其他费用未知。",
        riskNote:"波兰复古家具价格与库存可能变化；规格、配送范围和最终价格请在商户商品页核验。",
        recommendationReason:"当前有效的商户公开只读家具价格，带有精确商品身份、币种、检索时间与商户商品页。",
        responseProvenance:{ providerIdentity:PROVIDER_ID, responseProvenance:"meblostan_woocommerce_store_api", sourceType:"PUBLIC_READ_ONLY", redacted:true },
        truthEvidence:clone(evidence),
        realExecution:false
      };
    }).filter(Boolean);
    return {
      ok:true,
      code:candidates.length ? "" : (safe.status === "no_results" ? "SOURCE_NO_EXACT_RESULTS" : "PRICE_EVIDENCE_REJECTED"),
      candidates,
      status:status({ ok:true }),
      requestId:text(safe.requestId, 120),
      requestCount:Number(safe.requestCount || 0),
      redacted:true
    };
  }

  window.WeishanMeblostanReadonlyAdapter = Object.freeze({ VERSION, PROVIDER_ID, PROVIDER_NAME, ATTRIBUTION_URL, normalizeResult, status });
})();
