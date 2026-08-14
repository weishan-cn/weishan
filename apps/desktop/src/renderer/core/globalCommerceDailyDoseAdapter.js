;(function () {
  "use strict";

  const GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_commerce_daily_dose_controlled_readonly_adapter_v1";
  const PROVIDER_ID = "daily_dose_tech";
  const API_BASE_URL = "https://dailydose.tech/api/v1/";
  const HANDOFF_BASE_URL = "https://dailydose.tech/p/";
  const PROVIDER_USER_AGENT = "Weishan/4.2.8 (https://weishan.ai)";
  const REQUIRED_CACHE_SECONDS = 3600;

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function textOrNull(value) {
    return text(value) || null;
  }

  function numberOrNull(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  }

  function integerInRange(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, Math.round(number))) : fallback;
  }

  function observedAt(runtime) {
    const safe = obj(runtime);
    if (typeof safe.now === "function") return text(safe.now());
    return text(safe.observedAt);
  }

  function safety() {
    return {
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionAffected:false,
      productionTraffic:false,
      checkout:false,
      payment:false,
      order:false
    };
  }

  function failure(operation, code, message, details, requestExecuted) {
    return deepFreeze(Object.assign({
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
      providerId:PROVIDER_ID,
      operation:operation,
      status:"FAILED",
      code:code,
      message:text(message || code),
      products:[],
      offers:[],
      comparison:null,
      providerReadOnlyRequestExecuted:requestExecuted === true,
      fallbackUsed:false,
      details:Array.isArray(details) ? details.slice() : []
    }, safety()));
  }

  function validSlug(value) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(value));
  }

  function validCurrency(value) {
    const currency = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : null;
  }

  function buildApiUrl(resource, params) {
    const url = new URL(resource, API_BASE_URL);
    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
    if (url.origin !== "https://dailydose.tech" || !url.pathname.startsWith("/api/v1/")) {
      throw { code:"ENDPOINT_NOT_ALLOWLISTED", message:"endpoint_not_allowlisted" };
    }
    return url.toString();
  }

  function providerHandoffUrl(value, slug) {
    if (!validSlug(slug)) return null;
    try {
      const url = new URL(text(value));
      return url.origin === "https://dailydose.tech" &&
        url.pathname === "/p/" + text(slug) &&
        !url.search &&
        !url.hash
        ? url.toString()
        : null;
    } catch (_) {
      return null;
    }
  }

  function safeReportedMerchantHost(value) {
    try {
      const url = new URL(text(value));
      return url.protocol === "https:" && url.hostname ? url.hostname.toLowerCase() : null;
    } catch (_) {
      return null;
    }
  }

  function timeoutMs(runtime) {
    return integerInRange(obj(runtime).timeoutMs, 8000, 500, 30000);
  }

  function maxResponseBytes(runtime) {
    return integerInRange(obj(runtime).maxResponseBytes, 1024 * 1024, 1024, 5 * 1024 * 1024);
  }

  async function requestJson(url, runtime) {
    const safeRuntime = obj(runtime);
    if (safeRuntime.allowControlledReadOnly !== true) {
      throw { code:"CONTROLLED_READ_ONLY_NOT_APPROVED", message:"controlled_readonly_not_approved" };
    }
    if (typeof safeRuntime.fetchImpl !== "function") {
      throw { code:"TRANSPORT_UNAVAILABLE", message:"controlled_transport_required" };
    }

    const Controller = safeRuntime.AbortControllerImpl || (typeof AbortController === "function" ? AbortController : null);
    const controller = Controller ? new Controller() : null;
    const timer = controller && typeof setTimeout === "function"
      ? setTimeout(function () { controller.abort(); }, timeoutMs(safeRuntime))
      : null;
    let response;
    try {
      response = await safeRuntime.fetchImpl(url, {
        method:"GET",
        headers:{ Accept:"application/json", "User-Agent":PROVIDER_USER_AGENT },
        signal:controller ? controller.signal : undefined
      });
    } catch (error) {
      if (error && error.name === "AbortError") throw { code:"TIMEOUT", message:"provider_request_timeout" };
      throw { code:"NETWORK_ERROR", message:"provider_network_error" };
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!response || typeof response.text !== "function") {
      throw { code:"MALFORMED_RESPONSE", message:"provider_response_unreadable" };
    }
    let raw;
    try {
      raw = await response.text();
    } catch (_) {
      throw { code:"NETWORK_ERROR", message:"provider_response_read_error" };
    }
    if (raw.length > maxResponseBytes(safeRuntime)) {
      throw { code:"RESPONSE_TOO_LARGE", message:"provider_response_too_large" };
    }
    if (response.ok === false) {
      const status = Number(response.status || 0);
      throw {
        code:status === 429 ? "RATE_LIMITED" : (status >= 500 ? "PROVIDER_UNAVAILABLE" : "HTTP_ERROR"),
        message:"provider_http_" + status
      };
    }
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_) {
      throw { code:"MALFORMED_RESPONSE", message:"provider_response_invalid_json" };
    }
    return parsed;
  }

  function canonicalIdentity(slug) {
    return validSlug(slug) ? "daily_dose_tech:product:" + text(slug) : null;
  }

  function offerIdentity(slug, merchantHost) {
    if (!validSlug(slug) || !text(merchantHost)) return null;
    return "daily_dose_tech:offer:" + text(slug) + ":" + text(merchantHost);
  }

  function normalizeProduct(rawInput, context) {
    const item = obj(rawInput);
    const safe = obj(context);
    const slug = text(item.slug);
    const name = textOrNull(item.name);
    const currency = validCurrency(obj(item.price).currency);
    const price = numberOrNull(obj(item.price).amount);
    const handoffUrl = providerHandoffUrl(item.url, slug);
    if (!validSlug(slug) || !name || !handoffUrl) return null;
    return {
      provider:PROVIDER_ID,
      providerRole:"PROVIDER_SPECIFIC_COMMERCE_SOURCE",
      providerProductId:slug,
      productName:name,
      brand:textOrNull(item.brand),
      category:textOrNull(item.category),
      canonicalProductIdentity:canonicalIdentity(slug),
      identityScope:"PROVIDER_SCOPED",
      providerReportedLowestPrice:price,
      currency:currency,
      priceStatus:price === null ? "UNKNOWN" : (currency ? "PROVIDER_REPORTED" : "INVALID_CURRENCY"),
      productUrl:handoffUrl,
      handoffUrl:handoffUrl,
      observedAt:textOrNull(safe.observedAt),
      providerUpdatedAt:null,
      freshnessStatus:"UNKNOWN",
      freshnessPolicy:"PROVIDER_PRICE_TIMESTAMP_NOT_SUPPLIED",
      sourceType:"PROVIDER_PRODUCT_PRICE_OBSERVATION",
      liveOffer:false,
      priceObservation:price !== null && currency !== null,
      comparisonEligible:false,
      sameProviderComparisonEligible:false,
      crossProviderComparisonEligible:false,
      crossProviderDisplayAuthorization:"PROVIDER_SPECIFIC_ONLY",
      query:text(safe.query),
      provenance:{
        providerId:PROVIDER_ID,
        sourceUrl:textOrNull(safe.sourceUrl),
        providerProductField:"slug",
        priceField:"price.amount",
        currencyField:"price.currency",
        providerUpdatedAtField:null,
        observedAtSource:"WEISHAN_REQUEST_CLOCK"
      }
    };
  }

  function normalizeOffer(retailerInput, context) {
    const retailer = obj(retailerInput);
    const safe = obj(context);
    const merchant = textOrNull(retailer.name);
    const price = numberOrNull(retailer.price);
    const merchantHost = safeReportedMerchantHost(retailer.url);
    const offerId = offerIdentity(safe.slug, merchantHost);
    if (!merchant || price === null || !safe.currency || !safe.handoffUrl || !merchantHost || !offerId) return null;
    const inStock = typeof retailer.inStock === "boolean" ? retailer.inStock : null;
    return {
      provider:PROVIDER_ID,
      providerRole:"PROVIDER_SPECIFIC_COMMERCE_SOURCE",
      providerProductId:safe.slug,
      productName:safe.productName,
      canonicalProductIdentity:canonicalIdentity(safe.slug),
      identityScope:"PROVIDER_SCOPED",
      offerId:offerId,
      merchant:merchant,
      price:price,
      currency:safe.currency,
      originalPrice:null,
      discount:null,
      productUrl:safe.handoffUrl,
      handoffUrl:safe.handoffUrl,
      observedAt:safe.observedAt,
      providerUpdatedAt:null,
      freshnessStatus:"UNKNOWN",
      providerUpdateAgeSeconds:null,
      freshnessPolicy:"PROVIDER_PRICE_TIMESTAMP_NOT_SUPPLIED",
      availabilityStatus:inStock === true ? "PROVIDER_REPORTED_IN_STOCK" : (inStock === false ? "PROVIDER_REPORTED_OUT_OF_STOCK" : "UNKNOWN"),
      sourceType:"PROVIDER_RETAILER_PRICE_OBSERVATION",
      liveOffer:false,
      priceObservation:true,
      comparisonEligible:false,
      sameProviderComparisonEligible:false,
      crossProviderComparisonEligible:false,
      crossProviderDisplayAuthorization:"PROVIDER_SPECIFIC_ONLY",
      currencySource:"product.price.currency",
      currencyNormalizationPerformed:false,
      availabilityScope:"PROVIDER_REPORTED_RETAILER_FEED_NOT_STOCK_GUARANTEE",
      retailerUrlExposure:"HOST_ONLY_IN_PROVENANCE",
      retailerDirectHandoffAuthorized:false,
      handoffScope:"PROVIDER_PRODUCT_PAGE_ONLY",
      provenance:{
        providerId:PROVIDER_ID,
        sourceUrl:safe.sourceUrl,
        providerProductField:"product.slug",
        offerField:null,
        priceField:"product.retailers[].price",
        currencyField:"product.price.currency",
        stockField:"product.retailers[].inStock",
        handoffField:"WEISHAN_CONSTRUCTED_OFFICIAL_PROVIDER_PRODUCT_PATH",
        providerUpdatedAtField:null,
        providerReportedMerchantHost:merchantHost,
        observedAtSource:"WEISHAN_REQUEST_CLOCK"
      },
      limitations:[
        "Provider-reported retailer price and stock may change before handoff.",
        "Tax, shipping, fees, eligibility, and final checkout price are not provided by this adapter."
      ]
    };
  }

  function errorFailure(operation, error) {
    const safe = obj(error);
    const code = text(safe.code || "PROVIDER_ERROR");
    const requestExecuted = code !== "CONTROLLED_READ_ONLY_NOT_APPROVED" && code !== "TRANSPORT_UNAVAILABLE";
    return failure(operation, code, text(safe.message || "provider_error"), [], requestExecuted);
  }

  function createDailyDoseAdapter(adapterInput) {
    const adapterRuntime = obj(obj(adapterInput).runtime);
    function runtimeFor(params) {
      return Object.assign({}, adapterRuntime, obj(obj(params).runtime));
    }

    async function searchProducts(params) {
      const safe = obj(params);
      const query = text(safe.query || safe.title);
      if (!query) return failure("searchProducts", "QUERY_REQUIRED", "query_required");
      const runtime = runtimeFor(safe);
      const retrievedAt = observedAt(runtime);
      if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) {
        return failure("searchProducts", "OBSERVED_AT_REQUIRED", "valid_observed_at_required");
      }
      const limit = integerInRange(safe.limit, 5, 1, 5);
      try {
        const url = buildApiUrl("products", { search:query, limit:limit });
        const payload = await requestJson(url, runtime);
        if (!Array.isArray(obj(payload).products)) {
          return failure("searchProducts", "MALFORMED_RESPONSE", "search_response_products_must_be_array", [], true);
        }
        const products = array(payload.products).map(function (item) {
          return normalizeProduct(item, { observedAt:retrievedAt, query:query, sourceUrl:url });
        }).filter(Boolean);
        return deepFreeze(Object.assign({
          adapterName:ADAPTER_NAME,
          appVersion:GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
          providerId:PROVIDER_ID,
          operation:"searchProducts",
          status:products.length ? "READY" : "EMPTY",
          sourceType:"PROVIDER_PRODUCT_PRICE_OBSERVATION",
          observedAt:retrievedAt,
          products:products,
          offers:[],
          comparison:null,
          sourceUrl:url,
          requiredCacheSeconds:REQUIRED_CACHE_SECONDS,
          providerReadOnlyRequestExecuted:true,
          fallbackUsed:false
        }, safety()));
      } catch (error) {
        return errorFailure("searchProducts", error);
      }
    }

    async function getProductOffers(params) {
      const safe = obj(params);
      const slug = text(safe.providerProductId || safe.slug);
      if (!validSlug(slug)) return failure("getProductOffers", "PRODUCT_ID_REQUIRED", "valid_provider_product_id_required");
      const runtime = runtimeFor(safe);
      const retrievedAt = observedAt(runtime);
      if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) {
        return failure("getProductOffers", "OBSERVED_AT_REQUIRED", "valid_observed_at_required");
      }
      try {
        const url = buildApiUrl("products/" + encodeURIComponent(slug), {});
        const payload = await requestJson(url, runtime);
        const product = obj(obj(payload).product);
        if (text(product.slug) !== slug) {
          return failure("getProductOffers", "PRODUCT_IDENTITY_MISMATCH", "provider_product_identity_mismatch", [], true);
        }
        const productName = textOrNull(product.name);
        const currency = validCurrency(obj(product.price).currency);
        const handoffUrl = providerHandoffUrl(product.url, slug);
        if (!productName || !currency || !handoffUrl || !Array.isArray(product.retailers)) {
          return failure("getProductOffers", "MALFORMED_RESPONSE", "product_name_currency_retailers_or_handoff_invalid", [], true);
        }
        const invalidRetailerIndexes = [];
        const maxOffers = integerInRange(safe.maxOffers, 5, 1, 5);
        const offers = array(product.retailers).slice(0, maxOffers).map(function (retailer, index) {
          const normalized = normalizeOffer(retailer, {
            slug:slug,
            productName:productName,
            currency:currency,
            handoffUrl:handoffUrl,
            observedAt:retrievedAt,
            sourceUrl:url
          });
          if (!normalized) invalidRetailerIndexes.push(index);
          return normalized;
        }).filter(Boolean);
        if (!offers.length) {
          return failure("getProductOffers", "NO_VALID_OFFERS", "provider_returned_no_valid_retailer_price_records", invalidRetailerIndexes.map(function (index) { return "invalid_retailer_" + index; }), true);
        }
        return deepFreeze(Object.assign({
          adapterName:ADAPTER_NAME,
          appVersion:GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
          providerId:PROVIDER_ID,
          operation:"getProductOffers",
          status:"READY",
          sourceType:"PROVIDER_RETAILER_PRICE_OBSERVATION",
          observedAt:retrievedAt,
          products:[],
          offers:offers,
          comparison:null,
          invalidRetailerIndexes:invalidRetailerIndexes,
          sourceUrl:url,
          requiredCacheSeconds:REQUIRED_CACHE_SECONDS,
          providerReadOnlyRequestExecuted:true,
          fallbackUsed:false
        }, safety()));
      } catch (error) {
        return errorFailure("getProductOffers", error);
      }
    }

    async function searchAndNormalize(params) {
      const safe = obj(params);
      const searchResult = await searchProducts(safe);
      if (searchResult.status !== "READY") return searchResult;
      const product = searchResult.products[0] || null;
      if (!product) return failure("searchAndNormalize", "PRODUCT_NOT_FOUND", "provider_product_not_found");
      const offerResult = await getProductOffers(Object.assign({}, safe, {
        providerProductId:product.providerProductId
      }));
      if (offerResult.status !== "READY") return offerResult;
      return deepFreeze(Object.assign({
        adapterName:ADAPTER_NAME,
        appVersion:GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
        providerId:PROVIDER_ID,
        operation:"searchAndNormalize",
        status:"READY",
        sourceType:"PROVIDER_RETAILER_PRICE_OBSERVATION",
        observedAt:offerResult.observedAt,
        products:[product],
        offers:offerResult.offers,
        comparison:null,
        comparisonStatus:"NOT_AUTHORIZED",
        providerReadOnlyRequestExecuted:true,
        fallbackUsed:false
      }, safety()));
    }

    return Object.freeze({
      providerId:PROVIDER_ID,
      searchProducts,
      getProductOffers,
      searchAndNormalize
    });
  }

  const PACKAGE = deepFreeze({
    adapterName:ADAPTER_NAME,
    appVersion:GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
    providerId:PROVIDER_ID,
    mode:"CONTROLLED_READ_ONLY_PROVIDER_SPECIFIC",
    providerRole:"PROVIDER_SPECIFIC_COMMERCE_SOURCE",
    productionImported:false,
    productionTraffic:false,
    credentialsRequired:false,
    noRetry:true,
    maxSearchProducts:5,
    maxOffers:5,
    requiredCacheSeconds:REQUIRED_CACHE_SECONDS,
    cacheConstraint:"MINIMUM_REUSE_BEFORE_REFRESH",
    officialApiBaseUrl:API_BASE_URL,
    officialHandoffBaseUrl:HANDOFF_BASE_URL,
    sourceClassification:"PROVIDER_RETAILER_PRICE_OBSERVATION",
    sameProductMultiMerchantComparison:false,
    sameProviderComparisonEligible:false,
    crossProviderComparison:false,
    crossProviderComparisonEligible:false,
    liveOffer:false,
    retailerDirectHandoffAuthorized:false,
    userDecisionRequired:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionAffected:false,
    checkout:false,
    payment:false,
    order:false
  });

  window.WeishanGlobalCommerceDailyDoseAdapter = Object.freeze({
    GLOBAL_COMMERCE_DAILY_DOSE_ADAPTER_VERSION,
    ADAPTER_NAME,
    PROVIDER_ID,
    API_BASE_URL,
    HANDOFF_BASE_URL,
    PROVIDER_USER_AGENT,
    REQUIRED_CACHE_SECONDS,
    PACKAGE,
    createDailyDoseAdapter
  });
})();
