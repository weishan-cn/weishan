;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION = "4.2.0";
  const NORMALIZER_NAME = "global_shopping_price_source_normalizer_v1";
  const SOURCE_TYPES = ["official", "authorized", "aggregator", "user_submitted", "fixture"];
  const FEE_FIELDS = ["taxAmount", "shippingFee", "platformFee", "serviceFee", "paymentFee", "baggageFee"];
  const CAVEAT = "当前只处理只读 fixture 候选价，不代表最终成交价、锁定承诺、最低承诺或可下单能力。";
  const PASS_THROUGH_TEXT_FIELDS = ["brand", "model", "sku", "gtin", "upc", "ean", "mpn", "capacity", "color", "size", "countryVersion", "flightNumber", "departureDate", "originAirport", "destinationAirport", "departureTime", "arrivalTime", "cabinClass", "baggageRule", "hotelId", "hotelName", "address", "checkIn", "checkOut", "roomType", "occupancy", "cancellationPolicy"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function numberOrZero(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  function hasNumber(value) {
    return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
  }
  function bool(value, defaultValue) { return value === undefined ? defaultValue : value === true; }
  function geo(value) {
    const safe = obj(value);
    return { lat:hasNumber(safe.lat) ? Number(safe.lat) : null, lng:hasNumber(safe.lng) ? Number(safe.lng) : null, redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function sourceTrustFor(sourceType, value) {
    const trust = text(value || "");
    if (sourceType === "official") return "official";
    if (sourceType === "authorized") return trust === "major_platform" ? "major_platform" : "authorized";
    if (sourceType === "aggregator") return "aggregator";
    if (sourceType === "user_submitted") return "user_submitted";
    return trust || "unknown";
  }
  function completenessFor(source, hasBase, hasCurrency, hasTimestamp) {
    const explicit = text(source.priceCompleteness || "");
    if (/^(complete|partial|unknown|needs_review)$/.test(explicit)) return explicit;
    const allFeesProvided = FEE_FIELDS.every(function (field) { return hasNumber(source[field]); }) && hasNumber(source.couponDiscount);
    if (hasBase && hasCurrency && hasTimestamp && allFeesProvided) return "complete";
    if (hasBase || hasCurrency) return "partial";
    return "needs_review";
  }
  function hasUnsafeInput(input) {
    const safe = obj(input);
    const safeSafety = obj(safe.safety);
    return safe.realProviderEnabled === true || safe.networkEnabled === true || safe.noRealProvider === false || safe.noNetwork === false ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.autoOpen === true || safe.openExternal === true ||
      safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || safeSafety.autoOpen === true ||
      safeSafety.fileWrite === true || safeSafety.download === true || safeSafety.rawResponseStored === true || safeSafety.rawUserTextStored === true || safeSafety.secretStored === true ||
      Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl);
  }
  function normalizeGlobalShoppingPriceSource(input) {
    const source = obj(input);
    const sourceType = SOURCE_TYPES.indexOf(text(source.sourceType)) >= 0 ? text(source.sourceType) : "unknown";
    const baseProvided = hasNumber(source.basePrice);
    const currencyProvided = Boolean(text(source.currency));
    const timestampProvided = Boolean(text(source.lastCheckedAt));
    const normalizedTotal = numberOrZero(source.basePrice) + FEE_FIELDS.reduce(function (sum, field) { return sum + numberOrZero(source[field]); }, 0) - numberOrZero(source.couponDiscount);
    const completeness = completenessFor(source, baseProvided, currencyProvided, timestampProvided);
    const normalized = {
      candidateId:text(source.candidateId || source.id || "candidate_fixture_1"),
      sourceId:text(source.sourceId || source.providerId || "fixture_source"),
      sourceName:text(source.sourceName || source.providerName || "Fixture Source"),
      sourceType:sourceType,
      sourceTrustLevel:sourceTrustFor(sourceType, source.sourceTrustLevel),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      itemType:/^(flight|hotel|product|local_service|unknown)$/.test(text(source.itemType)) ? text(source.itemType) : "unknown",
      title:text(source.title || "只读候选价"),
      basePrice:baseProvided ? Number(source.basePrice) : null,
      taxAmount:numberOrZero(source.taxAmount),
      shippingFee:numberOrZero(source.shippingFee),
      platformFee:numberOrZero(source.platformFee),
      serviceFee:numberOrZero(source.serviceFee),
      paymentFee:numberOrZero(source.paymentFee),
      baggageFee:numberOrZero(source.baggageFee),
      couponDiscount:numberOrZero(source.couponDiscount),
      normalizedTotal:baseProvided ? normalizedTotal : null,
      currency:currencyProvided ? text(source.currency) : "",
      exchangeRate:hasNumber(source.exchangeRate) ? Number(source.exchangeRate) : 1,
      priceIncludesTax:bool(source.priceIncludesTax, false),
      priceIncludesShipping:bool(source.priceIncludesShipping, false),
      priceIncludesServiceFee:bool(source.priceIncludesServiceFee, false),
      priceCompleteness:completeness,
      lastCheckedAt:text(source.lastCheckedAt || ""),
      confidence:/^(high|medium|low|needs_review)$/.test(text(source.confidence)) ? text(source.confidence) : (completeness === "complete" ? "high" : "needs_review"),
      breakfastIncluded:bool(source.breakfastIncluded, false),
      geo:geo(source.geo),
      caveat:text(source.caveat || CAVEAT),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    };
    PASS_THROUGH_TEXT_FIELDS.forEach(function (field) { normalized[field] = text(source[field] || ""); });
    return clone(normalized);
  }
  function normalizeGlobalShoppingPriceSources(input) {
    const safe = obj(input);
    const sources = toArray(safe.sources || safe.priceSources || safe.candidates || safe.normalizedCandidates);
    const fallback = [
      { candidateId:"official_fixture", sourceType:"official", sourceName:"官方 fixture", itemType:"flight", title:"官方参考价", basePrice:1000, taxAmount:80, shippingFee:0, platformFee:0, serviceFee:20, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture-only", confidence:"high", flightNumber:"MU5401", departureDate:"2026-07-15", originAirport:"SHA", destinationAirport:"CTU", cabinClass:"economy", baggageRule:"20kg" },
      { candidateId:"covered_fixture", sourceType:"aggregator", sourceName:"覆盖来源 fixture", itemType:"flight", title:"已覆盖来源中的较低候选价", basePrice:930, taxAmount:70, shippingFee:0, platformFee:15, serviceFee:20, paymentFee:0, baggageFee:0, couponDiscount:10, currency:"CNY", lastCheckedAt:"fixture-only", confidence:"medium", flightNumber:"MU5401", departureDate:"2026-07-15", originAirport:"SHA", destinationAirport:"CTU", cabinClass:"economy", baggageRule:"20kg" }
    ];
    return clone((sources.length ? sources : fallback).map(normalizeGlobalShoppingPriceSource));
  }
  function evaluateGlobalShoppingPriceCompleteness(input) {
    const candidates = toArray(obj(input).normalizedCandidates).length ? toArray(obj(input).normalizedCandidates) : normalizeGlobalShoppingPriceSources(input || {});
    const health = {
      hasSourceType:candidates.every(function (item) { return SOURCE_TYPES.indexOf(item.sourceType) >= 0; }),
      hasBasePrice:candidates.every(function (item) { return item.basePrice !== null; }),
      hasCurrency:candidates.every(function (item) { return Boolean(item.currency); }),
      hasNormalizedTotal:candidates.every(function (item) { return item.normalizedTotal !== null; }),
      hasCompletenessLabel:candidates.every(function (item) { return /^(complete|partial|unknown|needs_review)$/.test(item.priceCompleteness); }),
      hasTrustLabel:candidates.every(function (item) { return Boolean(item.sourceTrustLevel); }),
      hasTimestamp:candidates.every(function (item) { return Boolean(item.lastCheckedAt); }),
      noRealProvider:obj(input).realProviderEnabled !== true,
      noNetwork:obj(input).networkEnabled !== true,
      noPayment:obj(input).payment !== true,
      noOrder:obj(input).order !== true,
      noTicketing:obj(input).ticketing !== true,
      noExternalOpen:obj(input).autoOpen !== true && obj(input).openExternal !== true
    };
    const blockedReasons = [];
    if (hasUnsafeInput(input)) blockedReasons.push("unsafe_price_source_capability_detected");
    const needsReview = !health.hasSourceType || !health.hasBasePrice || !health.hasCurrency || !health.hasNormalizedTotal || !health.hasCompletenessLabel || !health.hasTrustLabel || !health.hasTimestamp || candidates.some(function (item) { return item.priceCompleteness !== "complete"; });
    return clone({ health:health, blockedReasons:blockedReasons, status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"), redacted:true });
  }
  function buildGlobalShoppingPriceNormalizationRows(input) {
    const candidates = normalizeGlobalShoppingPriceSources(input || {});
    return clone(candidates.map(function (item) {
      return { rowId:item.candidateId, label:item.sourceName, value:item.currency + " " + (item.normalizedTotal == null ? "需复核" : item.normalizedTotal), status:item.priceCompleteness === "complete" ? "pass" : "warning", sourceType:item.sourceType, sourceTrustLevel:item.sourceTrustLevel, redacted:true };
    }));
  }
  function sanitizeGlobalShoppingPriceSourceNormalizer(normalizer) {
    const safe = obj(normalizer);
    const candidates = toArray(safe.normalizedCandidates).length ? toArray(safe.normalizedCandidates).map(normalizeGlobalShoppingPriceSource) : normalizeGlobalShoppingPriceSources(safe);
    const evaluation = evaluateGlobalShoppingPriceCompleteness(Object.assign({}, safe, { normalizedCandidates:candidates }));
    return clone({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : evaluation.status,
      normalizedCandidates:candidates,
      normalizationHealth:evaluation.health,
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingPriceNormalizationRows({ normalizedCandidates:candidates }),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{ title:"价格源归一化层", resultLabel:evaluation.status === "ready" ? "价格归一化结构已准备" : evaluation.status === "blocked" ? "价格归一化已阻断" : "价格归一化仍需复核", caveat:CAVEAT, redacted:true },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingPriceSourceNormalizer(input) {
    try {
      const candidates = normalizeGlobalShoppingPriceSources(input || {});
      const evaluation = evaluateGlobalShoppingPriceCompleteness(Object.assign({}, obj(input), { normalizedCandidates:candidates }));
      return sanitizeGlobalShoppingPriceSourceNormalizer({ status:evaluation.status, normalizedCandidates:candidates, blockedReasons:evaluation.blockedReasons });
    } catch (error) {
      return sanitizeGlobalShoppingPriceSourceNormalizer({ status:"failed_safe", normalizedCandidates:[], blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingPriceSourceNormalizerAuditDraft(input) {
    const normalizer = buildGlobalShoppingPriceSourceNormalizer(input || {});
    return clone({ eventType:"GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_AUDIT_DRAFT", normalizerName:NORMALIZER_NAME, appVersion:GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION, status:normalizer.status, candidateCount:normalizer.normalizedCandidates.length, rowCount:normalizer.rows.length, blockedReasons:normalizer.blockedReasons, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, autoOpen:false, fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanGlobalShoppingPriceSourceNormalizer = { GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION, NORMALIZER_NAME, buildGlobalShoppingPriceSourceNormalizer, normalizeGlobalShoppingPriceSource, normalizeGlobalShoppingPriceSources, evaluateGlobalShoppingPriceCompleteness, buildGlobalShoppingPriceNormalizationRows, buildGlobalShoppingPriceSourceNormalizerAuditDraft, sanitizeGlobalShoppingPriceSourceNormalizer };
})();
