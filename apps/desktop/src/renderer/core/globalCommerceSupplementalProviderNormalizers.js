;(function () {
  "use strict";

  const GLOBAL_COMMERCE_SUPPLEMENTAL_PROVIDER_NORMALIZERS_VERSION = "4.2.8";
  const NORMALIZER_NAME = "global_commerce_supplemental_provider_normalizers_v1";

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

  function textOrNull(value) {
    const valueText = String(value == null ? "" : value).trim();
    return valueText || null;
  }

  function numberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function safeHttpsUrl(value, allowedHosts) {
    try {
      const parsed = new URL(String(value == null ? "" : value).trim());
      const hostAllowed = allowedHosts.some(function (host) {
        return parsed.hostname === host || parsed.hostname.endsWith("." + host);
      });
      return parsed.protocol === "https:" && hostAllowed ? parsed.toString() : null;
    } catch (_) {
      return null;
    }
  }

  function normalizeAppleSearchResponse(payload, options) {
    const safe = obj(payload);
    const config = obj(options);
    const observedAt = textOrNull(config.observedAt);
    const records = array(safe.results).slice(0, 5).map(function (raw) {
      const item = obj(raw);
      const providerProductId = textOrNull(item.trackId || item.collectionId);
      const productUrl = safeHttpsUrl(item.trackViewUrl || item.collectionViewUrl, ["apple.com", "itunes.apple.com", "books.apple.com"]);
      return {
        provider:"apple_search",
        providerProductId:providerProductId,
        productName:textOrNull(item.trackName || item.collectionName),
        canonicalProductIdentity:providerProductId ? "apple:" + providerProductId : null,
        offerId:null,
        merchant:"Apple",
        price:numberOrNull(item.trackPrice !== undefined ? item.trackPrice : item.collectionPrice),
        currency:textOrNull(item.currency),
        originalPrice:null,
        discount:null,
        productUrl:productUrl,
        handoffUrl:productUrl,
        observedAt:observedAt,
        providerUpdatedAt:null,
        freshnessStatus:"UNKNOWN",
        availabilityStatus:"UNKNOWN",
        sourceType:"PROVIDER_SPECIFIC_VALIDATION_ONLY",
        providerRole:"PROVIDER_SPECIFIC_COMMERCE_SOURCE",
        liveOffer:false,
        crossProviderDisplayAuthorization:"UNRESOLVED",
        comparisonEligible:false,
        releaseDate:textOrNull(item.releaseDate),
        limitations:["Release date is product metadata and is not price freshness evidence."]
      };
    });
    return deepFreeze({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_COMMERCE_SUPPLEMENTAL_PROVIDER_NORMALIZERS_VERSION,
      providerId:"apple_search",
      status:"AUTHORIZED_FOR_PROVIDER_SPECIFIC_VALIDATION",
      records:records,
      crossProviderDisplayAuthorization:"UNRESOLVED",
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionAffected:false
    });
  }

  function normalizeOpenPricesEvidence(payload, options) {
    const safe = obj(payload);
    const config = obj(options);
    const observedAt = textOrNull(config.observedAt);
    const sourceRecords = array(safe.items).length ? array(safe.items) : array(safe.results);
    const records = sourceRecords.slice(0, 20).map(function (raw) {
      const item = obj(raw);
      const productCode = textOrNull(item.product_code || item.productCode || obj(item.product).code);
      const observationId = textOrNull(item.id);
      const observationDate = textOrNull(item.date || item.observed_at);
      const locationReference = textOrNull(item.location_osm_id || item.locationId);
      return {
        provider:"open_prices",
        providerProductId:observationId,
        productName:textOrNull(item.product_name || item.productName || obj(item.product).name),
        canonicalProductIdentity:productCode ? "barcode:" + productCode : null,
        observationId:observationId,
        price:numberOrNull(item.price),
        currency:textOrNull(item.currency),
        merchant:textOrNull(item.location_name || obj(item.location).name),
        locationReference:locationReference,
        evidenceObservedAt:observationDate,
        retrievedAt:observedAt,
        availabilityStatus:"UNKNOWN",
        productUrl:null,
        handoffUrl:null,
        sourceType:"PRICE_OBSERVATION_EVIDENCE",
        providerRole:"PRICE_EVIDENCE_PROVIDER",
        liveOffer:false,
        currentPurchaseAuthority:false,
        comparisonEligible:false,
        attributionRequired:true,
        attributionPolicyStatus:"REQUIRES_PUBLIC_DISPLAY_REVIEW",
        provenance:{
          providerId:"open_prices",
          sourceProject:"Open Food Facts Open Prices",
          observationId:observationId,
          productCode:productCode,
          observationDate:observationDate,
          locationReference:locationReference
        },
        limitations:["Historical price observation only; not a current purchasable offer."]
      };
    });
    return deepFreeze({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_COMMERCE_SUPPLEMENTAL_PROVIDER_NORMALIZERS_VERSION,
      providerId:"open_prices",
      status:"EVIDENCE_ONLY",
      records:records,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionAffected:false
    });
  }

  window.WeishanGlobalCommerceSupplementalProviderNormalizers = Object.freeze({
    GLOBAL_COMMERCE_SUPPLEMENTAL_PROVIDER_NORMALIZERS_VERSION,
    NORMALIZER_NAME,
    normalizeAppleSearchResponse,
    normalizeOpenPricesEvidence
  });
})();
