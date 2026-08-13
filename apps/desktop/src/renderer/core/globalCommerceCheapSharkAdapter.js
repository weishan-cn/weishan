;(function () {
  "use strict";

  const GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_commerce_cheapshark_controlled_readonly_adapter_v1";
  const PROVIDER_ID = "cheapshark";
  const API_BASE_URL = "https://www.cheapshark.com/api/1.0/";
  const HANDOFF_BASE_URL = "https://www.cheapshark.com/redirect";
  const PROVIDER_USER_AGENT = "Weishan/4.2.8 (https://weishan.ai)";

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
    if (value === null || value === undefined || text(value) === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
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

  function buildFailure(operation, code, message, details) {
    return deepFreeze(Object.assign({
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
      providerId:PROVIDER_ID,
      operation:operation,
      status:"FAILED",
      code:code,
      message:text(message || code),
      products:[],
      offers:[],
      comparison:null,
      fallbackUsed:false,
      details:Array.isArray(details) ? details.slice() : []
    }, safety()));
  }

  function buildApiUrl(resource, params) {
    const url = new URL(resource, API_BASE_URL);
    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
    if (url.origin !== "https://www.cheapshark.com" || !url.pathname.startsWith("/api/1.0/")) {
      throw new Error("endpoint_not_allowlisted");
    }
    return url.toString();
  }

  function timeoutMs(runtime) {
    return integerInRange(obj(runtime).timeoutMs, 8000, 500, 30000);
  }

  function maxResponseBytes(runtime) {
    return integerInRange(obj(runtime).maxResponseBytes, 1024 * 1024, 1024, 5 * 1024 * 1024);
  }

  async function requestJson(url, runtime) {
    const safeRuntime = obj(runtime);
    if (safeRuntime.allowControlledReadOnly !== true) throw { code:"CONTROLLED_READ_ONLY_NOT_APPROVED", message:"controlled_readonly_not_approved" };
    if (typeof safeRuntime.fetchImpl !== "function") throw { code:"TRANSPORT_UNAVAILABLE", message:"controlled_transport_required" };

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

    if (!response || typeof response.text !== "function") throw { code:"MALFORMED_RESPONSE", message:"provider_response_unreadable" };
    const raw = await response.text();
    if (raw.length > maxResponseBytes(safeRuntime)) throw { code:"RESPONSE_TOO_LARGE", message:"provider_response_too_large" };
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_) {
      throw { code:"MALFORMED_RESPONSE", message:"provider_response_invalid_json" };
    }
    if (response.ok === false) {
      const status = Number(response.status || 0);
      throw {
        code:status === 429 ? "RATE_LIMITED" : (status >= 500 ? "PROVIDER_UNAVAILABLE" : "HTTP_ERROR"),
        message:"provider_http_" + status
      };
    }
    return parsed;
  }

  function providerUpdatedAt(lastChange) {
    const seconds = Number(lastChange);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function freshnessDetails(updatedAt, retrievedAt) {
    if (!updatedAt) return { status:"UNKNOWN", ageSeconds:null, policy:"GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_V1" };
    const updatedTime = Date.parse(updatedAt);
    const retrievedTime = Date.parse(retrievedAt);
    if (!Number.isFinite(updatedTime) || !Number.isFinite(retrievedTime) || updatedTime > retrievedTime) {
      return { status:"UNKNOWN", ageSeconds:null, policy:"INVALID_PROVIDER_TIMESTAMP" };
    }
    const api = window.WeishanGlobalShoppingDataFreshnessEngine || {};
    if (typeof api.buildGlobalShoppingDataFreshness !== "function") {
      return { status:"UNKNOWN", ageSeconds:null, policy:"GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_UNAVAILABLE" };
    }
    const result = api.buildGlobalShoppingDataFreshness({ timestamp:updatedAt, now:retrievedAt });
    return {
      status:text(result.freshnessLevel || "unknown").toUpperCase(),
      ageSeconds:Number.isFinite(result.ageSeconds) ? result.ageSeconds : null,
      policy:text(result.engineName || "global_shopping_data_freshness_engine_v1").toUpperCase()
    };
  }

  function canonicalIdentity(gameId, steamAppId) {
    const steamId = text(steamAppId);
    return steamId ? "steam:" + steamId : (text(gameId) ? "cheapshark:game:" + text(gameId) : null);
  }

  function handoffUrl(dealId) {
    if (!text(dealId)) return null;
    const url = new URL(HANDOFF_BASE_URL);
    url.searchParams.set("dealID", text(dealId));
    return url.toString();
  }

  function storeDirectory(stores) {
    const directory = {};
    array(stores).forEach(function (raw) {
      const store = obj(raw);
      const id = text(store.storeID);
      if (id) directory[id] = {
        name:textOrNull(store.storeName),
        active:Number(store.isActive) === 1
      };
    });
    return directory;
  }

  function normalizeOffer(dealInput, context) {
    const deal = obj(dealInput);
    const safe = obj(context);
    const price = numberOrNull(deal.price !== undefined ? deal.price : deal.salePrice);
    const dealId = textOrNull(deal.dealID);
    if (price === null || !dealId) return null;
    const store = obj(obj(safe.stores)[text(deal.storeID)]);
    const merchant = textOrNull(store.name);
    if (!merchant) return null;
    const updatedAt = providerUpdatedAt(deal.lastChange);
    const freshness = freshnessDetails(updatedAt, safe.observedAt);
    const url = handoffUrl(dealId);
    return {
      provider:PROVIDER_ID,
      providerRole:"LIVE_COMPARISON_PROVIDER",
      providerProductId:textOrNull(safe.gameId),
      productName:textOrNull(deal.title || safe.productName),
      canonicalProductIdentity:canonicalIdentity(safe.gameId, deal.steamAppID || safe.steamAppId),
      offerId:dealId,
      merchant:merchant,
      price:price,
      currency:"USD",
      originalPrice:numberOrNull(deal.retailPrice !== undefined ? deal.retailPrice : deal.normalPrice),
      discount:numberOrNull(deal.savings),
      productUrl:url,
      handoffUrl:url,
      observedAt:textOrNull(safe.observedAt),
      providerUpdatedAt:updatedAt,
      freshnessStatus:freshness.status,
      providerUpdateAgeSeconds:freshness.ageSeconds,
      freshnessPolicy:freshness.policy,
      availabilityStatus:"OFFER_OBSERVED",
      sourceType:"LIVE_PROVIDER_PRICE",
      liveOffer:true,
      comparisonEligible:true,
      currencySource:"CHEAPSHARK_API_CONTRACT",
      availabilityScope:"PROVIDER_DEAL_OBSERVED_NOT_STOCK_GUARANTEE",
      provenance:{
        providerId:PROVIDER_ID,
        sourceUrl:textOrNull(safe.sourceUrl),
        providerProductField:"gameID",
        offerField:"dealID",
        providerUpdatedAtField:"lastChange",
        merchantField:"storeID",
        observedAtSource:"WEISHAN_REQUEST_CLOCK"
      }
    };
  }

  function normalizeProducts(payload, query, retrievedAt) {
    if (!Array.isArray(payload)) return null;
    return payload.map(function (raw) {
      const item = obj(raw);
      return {
        provider:PROVIDER_ID,
        providerProductId:textOrNull(item.gameID),
        productName:textOrNull(item.external),
        canonicalProductIdentity:canonicalIdentity(item.gameID, item.steamAppID),
        providerReportedLowestPrice:numberOrNull(item.cheapest),
        currency:"USD",
        imageUrl:textOrNull(item.thumb),
        observedAt:textOrNull(retrievedAt),
        providerUpdatedAt:null,
        sourceType:"LIVE_PROVIDER_SEARCH_RESULT",
        query:text(query)
      };
    }).filter(function (product) { return product.providerProductId && product.productName; });
  }

  function resolveProduct(products, query) {
    const normalizedQuery = text(query).toLowerCase();
    return products.find(function (product) { return text(product.productName).toLowerCase() === normalizedQuery; }) || products[0] || null;
  }

  function errorFailure(operation, error) {
    const safe = obj(error);
    return buildFailure(operation, text(safe.code || "PROVIDER_ERROR"), text(safe.message || "provider_error"));
  }

  function createCheapSharkAdapter(adapterInput) {
    const adapterRuntime = obj(obj(adapterInput).runtime);
    function runtimeFor(params) {
      return Object.assign({}, adapterRuntime, obj(obj(params).runtime));
    }

    async function searchProducts(params) {
      const safe = obj(params);
      const query = text(safe.query || safe.title);
      if (!query) return buildFailure("searchProducts", "QUERY_REQUIRED", "query_required");
      const runtime = runtimeFor(safe);
      const retrievedAt = observedAt(runtime);
      if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) return buildFailure("searchProducts", "OBSERVED_AT_REQUIRED", "valid_observed_at_required");
      const limit = integerInRange(safe.limit, 5, 1, 5);
      let url;
      try {
        url = buildApiUrl("games", { title:query, limit:limit, exact:safe.exact === true ? 1 : 0 });
        const payload = await requestJson(url, runtime);
        const products = normalizeProducts(payload, query, retrievedAt);
        if (!products) return buildFailure("searchProducts", "MALFORMED_RESPONSE", "search_response_must_be_array");
        return deepFreeze(Object.assign({
          adapterName:ADAPTER_NAME,
          appVersion:GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
          providerId:PROVIDER_ID,
          operation:"searchProducts",
          status:products.length ? "READY" : "EMPTY",
          sourceType:"LIVE_PROVIDER_SEARCH_RESULT",
          observedAt:retrievedAt,
          products:products,
          offers:[],
          comparison:null,
          sourceUrl:url,
          providerReadOnlyRequestExecuted:true,
          fallbackUsed:false
        }, safety()));
      } catch (error) {
        return errorFailure("searchProducts", error);
      }
    }

    async function getProductOffers(params) {
      const safe = obj(params);
      const gameId = text(safe.providerProductId || safe.gameId);
      if (!gameId) return buildFailure("getProductOffers", "PRODUCT_ID_REQUIRED", "provider_product_id_required");
      const runtime = runtimeFor(safe);
      const retrievedAt = observedAt(runtime);
      if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) return buildFailure("getProductOffers", "OBSERVED_AT_REQUIRED", "valid_observed_at_required");
      try {
        const productName = text(safe.productName);
        const steamAppId = text(safe.steamAppId);
        if (!productName && !steamAppId) return buildFailure("getProductOffers", "PRODUCT_QUERY_REQUIRED", "product_name_or_steam_app_id_required");
        const offersUrl = buildApiUrl("deals", steamAppId
          ? { steamAppID:steamAppId, pageSize:60 }
          : { title:productName, exact:1, pageSize:60 });
        const storesUrl = buildApiUrl("stores", {});
        const deals = await requestJson(offersUrl, runtime);
        const stores = await requestJson(storesUrl, runtime);
        if (!Array.isArray(deals) || !Array.isArray(stores)) {
          return buildFailure("getProductOffers", "MALFORMED_RESPONSE", "deal_or_store_response_invalid");
        }
        const directory = storeDirectory(stores);
        const invalidDealIndexes = [];
        const maxOffers = integerInRange(safe.maxOffers, 20, 1, 50);
        const sameProductDeals = deals.filter(function (deal) { return text(obj(deal).gameID) === gameId; });
        const offers = sameProductDeals.slice(0, maxOffers).map(function (deal, index) {
          const normalized = normalizeOffer(deal, {
            gameId:gameId,
            steamAppId:steamAppId,
            productName:productName,
            observedAt:retrievedAt,
            sourceUrl:offersUrl,
            stores:directory
          });
          if (!normalized) invalidDealIndexes.push(index);
          return normalized;
        }).filter(Boolean);
        if (!offers.length) return buildFailure("getProductOffers", "NO_VALID_OFFERS", "provider_returned_no_valid_same_product_price_offers", invalidDealIndexes.map(function (index) { return "invalid_deal_" + index; }));
        return deepFreeze(Object.assign({
          adapterName:ADAPTER_NAME,
          appVersion:GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
          providerId:PROVIDER_ID,
          operation:"getProductOffers",
          status:"READY",
          sourceType:"LIVE_PROVIDER_PRICE",
          observedAt:retrievedAt,
          products:[],
          offers:offers,
          comparison:null,
          invalidDealIndexes:invalidDealIndexes,
          providerReadOnlyRequestExecuted:true,
          fallbackUsed:false
        }, safety()));
      } catch (error) {
        return errorFailure("getProductOffers", error);
      }
    }

    async function searchAndCompare(params) {
      const safe = obj(params);
      const searchResult = await searchProducts(safe);
      if (searchResult.status !== "READY") return searchResult;
      const product = resolveProduct(searchResult.products, safe.query || safe.title);
      if (!product) return buildFailure("searchAndCompare", "PRODUCT_NOT_FOUND", "provider_product_not_found");
      const offerResult = await getProductOffers(Object.assign({}, safe, {
        providerProductId:product.providerProductId,
        productName:product.productName,
        steamAppId:text(product.canonicalProductIdentity).startsWith("steam:") ? text(product.canonicalProductIdentity).slice(6) : ""
      }));
      if (offerResult.status !== "READY") return offerResult;
      const comparisonApi = window.WeishanGlobalCommerceSameProductPriceComparison || {};
      if (typeof comparisonApi.compareSameProductOffers !== "function") {
        return buildFailure("searchAndCompare", "COMPARISON_ENGINE_UNAVAILABLE", "comparison_engine_unavailable");
      }
      const comparison = comparisonApi.compareSameProductOffers({ offers:offerResult.offers });
      return deepFreeze(Object.assign({
        adapterName:ADAPTER_NAME,
        appVersion:GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
        providerId:PROVIDER_ID,
        operation:"searchAndCompare",
        status:comparison.status === "NOT_COMPARABLE" ? "NOT_COMPARABLE" : "READY",
        sourceType:"LIVE_PROVIDER_PRICE",
        observedAt:offerResult.observedAt,
        products:[product],
        offers:offerResult.offers,
        comparison:comparison,
        providerReadOnlyRequestExecuted:true,
        fallbackUsed:false
      }, safety()));
    }

    return Object.freeze({
      providerId:PROVIDER_ID,
      searchProducts,
      getProductOffers,
      searchAndCompare
    });
  }

  const PACKAGE = deepFreeze({
    adapterName:ADAPTER_NAME,
    appVersion:GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
    providerId:PROVIDER_ID,
    mode:"CONTROLLED_READ_ONLY",
    productionImported:false,
    productionTraffic:false,
    credentialsRequired:false,
    noRetry:true,
    maxSearchProducts:5,
    officialApiBaseUrl:API_BASE_URL,
    officialHandoffBaseUrl:HANDOFF_BASE_URL,
    userDecisionRequired:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    executed:false,
    productionAffected:false,
    checkout:false,
    payment:false,
    order:false
  });

  window.WeishanGlobalCommerceCheapSharkAdapter = Object.freeze({
    GLOBAL_COMMERCE_CHEAPSHARK_ADAPTER_VERSION,
    ADAPTER_NAME,
    PROVIDER_ID,
    API_BASE_URL,
    HANDOFF_BASE_URL,
    PROVIDER_USER_AGENT,
    PACKAGE,
    createCheapSharkAdapter
  });
})();
