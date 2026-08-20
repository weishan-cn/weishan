;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const ADAPTER_NAME = "global_commerce_structured_offer_evidence_poc_v1";
  const MAX_RESPONSE_BYTES = 256 * 1024;
  const DEFAULT_TIMEOUT_MS = 3000;
  const SOURCE_POLICIES = Object.freeze({
    weishan_official_merchant_fixture:Object.freeze({
      sourceId:"weishan_official_merchant_fixture",
      origin:"https://merchant-offer-fixture.invalid",
      hostname:"merchant-offer-fixture.invalid",
      pathPattern:/^\/products\/[a-z0-9][a-z0-9-]{0,79}$/,
      reviewState:"POC_FIXTURE_APPROVED",
      allowedUse:"DETERMINISTIC_VALIDATION_ONLY",
      displayAuthorization:"NOT_AUTHORIZED_FOR_PRODUCTION",
      authority:"PUBLIC_MERCHANT_EVIDENCE",
      attributionRequired:true,
      cachingRequirement:"SOURCE_POLICY_REQUIRED_BEFORE_PRODUCTION",
      networkEnabled:false
    })
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function plainInput(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.getOwnPropertySymbols(value).length) return null;
    const prototype = Object.getPrototypeOf(value);
    const constructor = prototype && Object.getOwnPropertyDescriptor(prototype, "constructor");
    if (prototype !== null && (!constructor || typeof constructor.value !== "function" || constructor.value.name !== "Object")) return null;
    const output = {};
    for (const key of Object.getOwnPropertyNames(value)) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") return null;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) return null;
      output[key] = descriptor.value;
    }
    return output;
  }
  function failure(code, requestExecuted) {
    return deepFreeze({
      success:false,
      error:{ code:code, stage:"STRUCTURED_OFFER_POC", recoverable:true, message:"Structured offer evidence could not be verified." },
      requestExecuted:requestExecuted === true,
      retryCount:0,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false
    });
  }
  function policy(sourceId) { return SOURCE_POLICIES[text(sourceId)] || null; }
  function validateUrl(value, sourcePolicy) {
    try {
      const parsed = new URL(text(value));
      return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.hash &&
        parsed.hostname === sourcePolicy.hostname && parsed.port === "" && sourcePolicy.pathPattern.test(parsed.pathname)
        ? parsed : null;
    } catch (_) {
      return null;
    }
  }
  function buildSourceUrl(sourceId, productPath) {
    const sourcePolicy = policy(sourceId);
    if (!sourcePolicy) return failure("SOURCE_NOT_ALLOWLISTED", false);
    const path = text(productPath);
    if (!sourcePolicy.pathPattern.test(path)) return failure("SOURCE_PATH_NOT_ALLOWED", false);
    const parsed = validateUrl(sourcePolicy.origin + path, sourcePolicy);
    return parsed ? deepFreeze({ success:true, url:parsed.toString(), sourcePolicy:sourcePolicy }) : failure("SOURCE_URL_INVALID", false);
  }
  function jsonLdBlocks(html) {
    const blocks = [];
    const pattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) blocks.push(match[1].trim());
    return blocks;
  }
  function flattenJsonLd(value, output) {
    if (Array.isArray(value)) {
      value.forEach(function (item) { flattenJsonLd(item, output); });
      return;
    }
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value["@graph"])) value["@graph"].forEach(function (item) { flattenJsonLd(item, output); });
    output.push(value);
  }
  function hasType(value, expected) {
    const types = Array.isArray(value) ? value : [value];
    return types.some(function (item) { return text(item).split("/").pop() === expected; });
  }
  function productIdentity(product) {
    const identity = {};
    ["gtin", "gtin8", "gtin12", "gtin13", "gtin14", "sku", "mpn", "isbn"].forEach(function (key) {
      if (text(product[key])) identity[key === "gtin13" ? "ean" : (key === "gtin12" ? "upc" : key)] = text(product[key]);
    });
    return Object.keys(identity).length ? identity : null;
  }
  function normalizeAvailability(value) {
    const normalized = text(value).split("/").pop();
    return {
      InStock:"IN_STOCK", OutOfStock:"OUT_OF_STOCK", LimitedAvailability:"LIMITED",
      PreOrder:"PREORDER", PreSale:"PREORDER", BackOrder:"BACKORDER"
    }[normalized] || "UNKNOWN";
  }
  function normalizeCondition(value) {
    const normalized = text(value).split("/").pop();
    return normalized ? normalized.toUpperCase() : null;
  }
  function normalizeSeller(value) {
    if (typeof value === "string") return text(value) || null;
    return text(obj(value).name) || null;
  }
  function parseStructuredOffer(input) {
    const safe = plainInput(input);
    if (!safe) return failure("INPUT_REJECTED", false);
    const sourcePolicy = policy(safe.sourceId);
    if (!sourcePolicy) return failure("SOURCE_NOT_ALLOWLISTED", false);
    const sourceUrl = validateUrl(safe.sourceUrl, sourcePolicy);
    if (!sourceUrl) return failure("SOURCE_URL_INVALID", false);
    if (typeof safe.html !== "string" || !safe.html.trim()) return failure("MALFORMED_RESPONSE", false);
    if (safe.html.length > MAX_RESPONSE_BYTES) return failure("RESPONSE_TOO_LARGE", false);

    const nodes = [];
    const blocks = jsonLdBlocks(safe.html);
    if (!blocks.length) return failure("JSON_LD_NOT_FOUND", false);
    try {
      blocks.forEach(function (block) { flattenJsonLd(JSON.parse(block), nodes); });
    } catch (_) {
      return failure("MALFORMED_JSON_LD", false);
    }
    const products = nodes.filter(function (node) { return hasType(node["@type"], "Product"); });
    if (products.length !== 1) return failure(products.length ? "AMBIGUOUS_PRODUCT" : "PRODUCT_NOT_FOUND", false);
    const product = products[0];
    const identity = productIdentity(product);
    if (!identity) return failure("PRODUCT_IDENTITY_REQUIRED", false);
    if (hasType(obj(product.offers)["@type"], "AggregateOffer")) return failure("AGGREGATE_OFFER_UNSUPPORTED", false);
    const offers = Array.isArray(product.offers) ? product.offers : (product.offers ? [product.offers] : []);
    if (offers.length !== 1) return failure(offers.length > 1 ? "MULTIPLE_OFFERS_AMBIGUOUS" : "OFFER_NOT_FOUND", false);
    const offer = obj(offers[0]);
    if (!hasType(offer["@type"], "Offer")) return failure("OFFER_TYPE_INVALID", false);
    if (typeof offer.price !== "number" || !Number.isFinite(offer.price) || offer.price < 0) return failure("PRICE_INVALID", false);
    if (!/^[A-Z]{3}$/.test(text(offer.priceCurrency).toUpperCase())) return failure("CURRENCY_REQUIRED", false);
    const handoff = validateUrl(offer.url || product.url || sourceUrl.toString(), sourcePolicy);
    if (!handoff) return failure("HANDOFF_NOT_AUTHORIZED", false);
    const now = text(safe.observedAt);
    if (!Number.isFinite(Date.parse(now))) return failure("TIMESTAMP_INVALID", false);

    const evidenceApi = window.WeishanGlobalCommercePriceEvidence || {};
    if (typeof evidenceApi.createPriceEvidence !== "function") return failure("PRICE_EVIDENCE_MODEL_UNAVAILABLE", false);
    return evidenceApi.createPriceEvidence({
      evidenceId:"structured-offer:" + safe.sourceId + ":" + Object.values(identity).join("-"),
      provider:safe.sourceId,
      sourceClass:"MERCHANT_PUBLIC_SOURCE",
      evidenceType:"MERCHANT_PUBLIC_STRUCTURED_OFFER",
      productIdentity:identity,
      productName:text(product.name) || null,
      itemCondition:normalizeCondition(offer.itemCondition),
      merchantIdentity:normalizeSeller(offer.seller || product.brand),
      price:offer.price,
      currency:text(offer.priceCurrency).toUpperCase(),
      observedAt:now,
      retrievedAt:now,
      providerUpdatedAt:null,
      sourceObservationDate:null,
      availability:normalizeAvailability(offer.availability),
      availabilityAuthority:Boolean(text(offer.availability)),
      purchaseAuthority:false,
      handoffUrl:handoff.toString(),
      handoffType:"OFFICIAL_MERCHANT_PRODUCT",
      comparisonEligible:false,
      priceConditions:[],
      priceConditionsVerified:false,
      sourcePolicy:{
        sourceId:sourcePolicy.sourceId,
        authority:sourcePolicy.authority,
        reviewState:sourcePolicy.reviewState,
        allowedUse:sourcePolicy.allowedUse,
        cachingRequirement:sourcePolicy.cachingRequirement,
        attributionRequired:sourcePolicy.attributionRequired,
        displayAuthorization:sourcePolicy.displayAuthorization,
        allowedHandoffHosts:[sourcePolicy.hostname]
      },
      provenance:{
        sourceUrl:sourceUrl.toString(),
        sourceRecordId:text(offer.sku || product.sku) || null,
        extractionMethod:"SOURCE_SPECIFIC_JSON_LD_PRODUCT_OFFER"
      }
    });
  }

  async function fetchStructuredOffer(input) {
    const safe = plainInput(input);
    if (!safe) return failure("INPUT_REJECTED", false);
    const request = buildSourceUrl(safe.sourceId, safe.productPath);
    if (!request.success) return request;
    if (safe.allowControlledFixtureTransport !== true || typeof safe.transport !== "function") return failure("CONTROLLED_TRANSPORT_REQUIRED", false);
    const timeoutMs = Number.isFinite(safe.timeoutMs) ? Math.max(100, Math.min(10000, safe.timeoutMs)) : DEFAULT_TIMEOUT_MS;
    const Controller = safe.AbortControllerImpl || (typeof AbortController === "function" ? AbortController : null);
    const controller = Controller ? new Controller() : null;
    const timer = controller && typeof setTimeout === "function" ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    let response;
    try {
      response = await safe.transport(request.url, { method:"GET", redirect:"manual", signal:controller ? controller.signal : undefined });
    } catch (error) {
      return failure(error && error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR", true);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!response || typeof response.text !== "function") return failure("MALFORMED_RESPONSE", true);
    if (response.redirected === true || (response.url && response.url !== request.url)) return failure("REDIRECT_NOT_ALLOWED", true);
    if (Number(response.status) >= 300 && Number(response.status) < 400) return failure("REDIRECT_NOT_ALLOWED", true);
    if (response.ok === false) return failure("SOURCE_HTTP_ERROR", true);
    let html;
    try { html = await response.text(); } catch (_) { return failure("NETWORK_ERROR", true); }
    if (typeof html !== "string" || html.length > MAX_RESPONSE_BYTES) return failure("RESPONSE_TOO_LARGE", true);
    return parseStructuredOffer({ sourceId:safe.sourceId, sourceUrl:request.url, html:html, observedAt:safe.observedAt });
  }

  window.WeishanGlobalCommerceStructuredOfferEvidence = Object.freeze({
    VERSION,
    ADAPTER_NAME,
    MAX_RESPONSE_BYTES,
    DEFAULT_TIMEOUT_MS,
    SOURCE_POLICIES,
    buildSourceUrl,
    parseStructuredOffer,
    fetchStructuredOffer
  });
})();
