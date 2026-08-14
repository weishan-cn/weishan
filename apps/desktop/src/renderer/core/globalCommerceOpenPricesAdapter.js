;(function () {
  "use strict";

  const GLOBAL_COMMERCE_OPEN_PRICES_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_commerce_open_prices_controlled_readonly_adapter_v1";
  const PROVIDER_ID = "open_prices";
  const API_BASE_URL = "https://prices.openfoodfacts.org/api/v1/prices";
  const HANDOFF_BASE_URL = "https://prices.openfoodfacts.org/products/";
  const PROVIDER_USER_AGENT = "Weishan/4.2.8 (api@weishan.ai)";

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
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, Math.round(parsed))) : fallback;
  }

  function validBarcode(value) {
    if (typeof value !== "string") return null;
    const code = value.trim();
    return /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code) ? code : null;
  }

  function validCurrency(value) {
    const currency = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : null;
  }

  function validObservationDate(value) {
    const date = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const parsed = new Date(date + "T00:00:00.000Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
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

  function failure(code, message, details, requestExecuted) {
    return deepFreeze(Object.assign({
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_COMMERCE_OPEN_PRICES_ADAPTER_VERSION,
      providerId:PROVIDER_ID,
      operation:"getPriceObservations",
      status:"FAILED",
      code:code,
      message:text(message || code),
      products:[],
      offers:[],
      observations:[],
      comparison:null,
      providerReadOnlyRequestExecuted:requestExecuted === true,
      fallbackUsed:false,
      details:Array.isArray(details) ? details.slice() : []
    }, safety()));
  }

  function buildApiUrl(productCode, size) {
    const code = validBarcode(productCode);
    if (!code) throw { code:"PRODUCT_CODE_REQUIRED", message:"valid_gtin_upc_ean_required" };
    const url = new URL(API_BASE_URL);
    url.searchParams.set("product_code", code);
    url.searchParams.set("size", String(integerInRange(size, 5, 1, 5)));
    if (url.origin !== "https://prices.openfoodfacts.org" || url.pathname !== "/api/v1/prices") {
      throw { code:"ENDPOINT_NOT_ALLOWLISTED", message:"endpoint_not_allowlisted" };
    }
    return url.toString();
  }

  function productHandoffUrl(productCode) {
    const code = validBarcode(productCode);
    if (!code) return null;
    const url = new URL(encodeURIComponent(code), HANDOFF_BASE_URL);
    return url.origin === "https://prices.openfoodfacts.org" && url.pathname === "/products/" + code
      ? url.toString()
      : null;
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
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      throw { code:"MALFORMED_RESPONSE", message:"provider_response_invalid_json" };
    }
  }

  function sanitizeObservation(rawInput, requestedCode) {
    const item = obj(rawInput);
    const product = obj(item.product);
    const observationId = Number(item.id);
    const productCode = validBarcode(item.product_code || product.code);
    const productName = textOrNull(item.product_name || product.product_name);
    const price = numberOrNull(item.price);
    const currency = validCurrency(item.currency);
    const observationDate = validObservationDate(item.date);
    if (!Number.isSafeInteger(observationId) || observationId <= 0 || productCode !== requestedCode || !productName || price === null || !currency || !observationDate) {
      return null;
    }
    return {
      id:String(observationId),
      product_code:productCode,
      product_name:productName,
      price:price,
      currency:currency,
      date:observationDate,
      location_id:Number.isSafeInteger(Number(item.location_id)) ? String(item.location_id) : null,
      location_osm_id:Number.isSafeInteger(Number(item.location_osm_id)) ? String(item.location_osm_id) : null,
      location_name:textOrNull(item.location_name || obj(item.location).name),
      product:{ code:productCode, name:productName }
    };
  }

  function enrichObservation(recordInput, sourceUrl) {
    const record = obj(recordInput);
    const provenance = Object.assign({}, obj(record.provenance), {
      sourceUrl:sourceUrl,
      providerPriceField:"price",
      providerCurrencyField:"currency",
      providerObservationDateField:"date",
      providerUpdatedAtField:null,
      license:"ODbL",
      retrievedAtIsPriceFreshness:false
    });
    const productCode = text(provenance.productCode);
    const handoffUrl = productHandoffUrl(productCode);
    return Object.assign({}, record, {
      productUrl:handoffUrl,
      handoffUrl:handoffUrl,
      providerUpdatedAt:null,
      freshnessStatus:"HISTORICAL_OBSERVATION",
      priceObservation:true,
      sameProviderComparisonEligible:false,
      crossProviderComparisonEligible:false,
      crossProviderDisplayAuthorization:"EVIDENCE_ONLY",
      retailerDirectHandoffAuthorized:false,
      handoffScope:"OPEN_PRICES_PRODUCT_EVIDENCE_PAGE_ONLY",
      attributionRequired:true,
      shareAlikeReviewRequired:true,
      productionDisplayApproved:false,
      attributionPolicyStatus:"ODBL_ATTRIBUTION_AND_SHARE_ALIKE_COMPLIANCE_REQUIRED",
      licenseComplianceStatus:"REQUIRED_BEFORE_PRODUCTION",
      provenance:provenance,
      limitations:[
        "Crowdsourced dated observation; not a current purchasable offer.",
        "No availability, checkout, tax, shipping, or final price authority."
      ]
    });
  }

  function errorFailure(error) {
    const safe = obj(error);
    const code = text(safe.code || "PROVIDER_ERROR");
    const requestExecuted = code !== "CONTROLLED_READ_ONLY_NOT_APPROVED" && code !== "TRANSPORT_UNAVAILABLE" && code !== "PRODUCT_CODE_REQUIRED";
    return failure(code, text(safe.message || "provider_error"), [], requestExecuted);
  }

  function createOpenPricesAdapter(adapterInput) {
    const adapterRuntime = obj(obj(adapterInput).runtime);
    function runtimeFor(params) {
      return Object.assign({}, adapterRuntime, obj(obj(params).runtime));
    }

    async function getPriceObservations(params) {
      const safe = obj(params);
      const productCode = validBarcode(safe.productCode || safe.providerProductId);
      if (!productCode) return failure("PRODUCT_CODE_REQUIRED", "valid_gtin_upc_ean_required");
      const runtime = runtimeFor(safe);
      const retrievedAt = observedAt(runtime);
      if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) {
        return failure("OBSERVED_AT_REQUIRED", "valid_observed_at_required");
      }
      const normalizer = obj(window.WeishanGlobalCommerceSupplementalProviderNormalizers);
      if (typeof normalizer.normalizeOpenPricesEvidence !== "function") {
        return failure("NORMALIZER_UNAVAILABLE", "open_prices_normalizer_required");
      }

      try {
        const url = buildApiUrl(productCode, safe.limit);
        const payload = await requestJson(url, runtime);
        if (!Array.isArray(obj(payload).items)) {
          return failure("MALFORMED_RESPONSE", "price_response_items_must_be_array", [], true);
        }
        const invalidObservationIndexes = [];
        const seenObservationIds = new Set();
        const sanitizedItems = array(payload.items).slice(0, 5).map(function (item, index) {
          const sanitized = sanitizeObservation(item, productCode);
          if (!sanitized || seenObservationIds.has(sanitized.id)) {
            invalidObservationIndexes.push(index);
            return null;
          }
          seenObservationIds.add(sanitized.id);
          return sanitized;
        }).filter(Boolean);
        if (!sanitizedItems.length) {
          return failure("NO_VALID_OBSERVATIONS", "provider_returned_no_valid_price_observations", invalidObservationIndexes.map(function (index) { return "invalid_observation_" + index; }), true);
        }
        const normalized = normalizer.normalizeOpenPricesEvidence({ items:sanitizedItems }, { observedAt:retrievedAt });
        const observations = array(normalized.records).map(function (record) {
          return enrichObservation(record, url);
        });
        return deepFreeze(Object.assign({
          adapterName:ADAPTER_NAME,
          appVersion:GLOBAL_COMMERCE_OPEN_PRICES_ADAPTER_VERSION,
          providerId:PROVIDER_ID,
          operation:"getPriceObservations",
          status:"READY",
          sourceType:"PRICE_OBSERVATION_EVIDENCE",
          providerRole:"PRICE_EVIDENCE_PROVIDER",
          productCode:productCode,
          canonicalProductIdentity:"barcode:" + productCode,
          productUrl:productHandoffUrl(productCode),
          observedAt:retrievedAt,
          providerUpdatedAt:null,
          freshnessStatus:"HISTORICAL_OBSERVATION",
          products:[],
          offers:[],
          observations:observations,
          comparison:null,
          comparisonStatus:"NOT_AUTHORIZED",
          invalidObservationIndexes:invalidObservationIndexes,
          sourceUrl:url,
          providerReadOnlyRequestExecuted:true,
          fallbackUsed:false,
          attributionRequired:true,
          shareAlikeReviewRequired:true,
          productionDisplayApproved:false,
          license:"ODbL",
          licenseComplianceStatus:"REQUIRED_BEFORE_PRODUCTION"
        }, safety()));
      } catch (error) {
        return errorFailure(error);
      }
    }

    return Object.freeze({ providerId:PROVIDER_ID, getPriceObservations });
  }

  const PACKAGE = deepFreeze({
    adapterName:ADAPTER_NAME,
    appVersion:GLOBAL_COMMERCE_OPEN_PRICES_ADAPTER_VERSION,
    providerId:PROVIDER_ID,
    mode:"CONTROLLED_READ_ONLY_EVIDENCE",
    providerRole:"PRICE_EVIDENCE_PROVIDER",
    productionImported:false,
    productionTraffic:false,
    credentialsRequired:false,
    noRetry:true,
    maxObservations:5,
    officialApiBaseUrl:API_BASE_URL,
    officialHandoffBaseUrl:HANDOFF_BASE_URL,
    sourceClassification:"PRICE_OBSERVATION_EVIDENCE",
    sameProductMultiMerchantComparison:false,
    sameProviderComparisonEligible:false,
    crossProviderComparison:false,
    crossProviderComparisonEligible:false,
    liveOffer:false,
    availabilityAuthority:false,
    currentPurchaseAuthority:false,
    retailerDirectHandoffAuthorized:false,
    providerObservationDateAvailable:true,
    providerUpdatedAtAvailable:false,
    attributionRequired:true,
    shareAlikeReviewRequired:true,
    productionDisplayApproved:false,
    license:"ODbL",
    licenseComplianceStatus:"REQUIRED_BEFORE_PRODUCTION",
    userDecisionRequired:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionAffected:false,
    checkout:false,
    payment:false,
    order:false
  });

  window.WeishanGlobalCommerceOpenPricesAdapter = Object.freeze({
    GLOBAL_COMMERCE_OPEN_PRICES_ADAPTER_VERSION,
    ADAPTER_NAME,
    PROVIDER_ID,
    API_BASE_URL,
    HANDOFF_BASE_URL,
    PROVIDER_USER_AGENT,
    PACKAGE,
    createOpenPricesAdapter
  });
})();
