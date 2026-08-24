;(function () {
  "use strict";

  const VERSION = "4.2.9";
  const QUALITY_NAME = "global_commerce_price_evidence_quality_v1";
  const AUTHORITIES = Object.freeze({
    AUTHORITATIVE:"AUTHORITATIVE",
    INDICATIVE:"INDICATIVE",
    IDENTITY_ONLY:"IDENTITY_ONLY",
    UNKNOWN:"UNKNOWN"
  });
  const FRESHNESS_STATES = Object.freeze({
    CURRENT:"CURRENT",
    RECENT:"RECENT",
    STALE:"STALE",
    UNKNOWN:"UNKNOWN",
    INVALID_TIME:"INVALID_TIME"
  });
  const CONDITION_STATES = Object.freeze({
    UNCONDITIONAL:"UNCONDITIONAL",
    CONDITIONAL:"CONDITIONAL",
    UNKNOWN:"UNKNOWN",
    INVALID:"INVALID"
  });
  const OUTCOMES = Object.freeze({
    VERIFIED_CURRENT:"VERIFIED_CURRENT",
    VERIFIED_WITH_LIMITATIONS:"VERIFIED_WITH_LIMITATIONS",
    INDICATIVE:"INDICATIVE",
    STALE:"STALE",
    CONDITIONAL:"CONDITIONAL",
    UNUSABLE:"UNUSABLE",
    UNKNOWN:"UNKNOWN"
  });
  const CONDITIONAL_PRICE_TYPES = Object.freeze([
    "STARTING_AT", "PRICE_RANGE", "INSTALLMENT", "TRADE_IN", "MEMBER_PRICE",
    "COUPON_PRICE", "SUBSCRIPTION_PRICE", "PAYMENT_METHOD_PRICE"
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function upper(value) {
    return text(value).toUpperCase();
  }

  function normalizedCurrency(value) {
    const result = upper(value);
    return /^[A-Z]{3}$/.test(result) ? result : null;
  }

  function timestamp(value) {
    const raw = text(value);
    if (!raw || raw === "UNKNOWN") return null;
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) return { invalid:true, raw:raw };
    const date = new Date(ms);
    const normalized = raw.endsWith("Z") && raw.indexOf(".") < 0 ? raw.replace(/Z$/, ".000Z") : raw;
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw) && date.toISOString() !== normalized) return { invalid:true, raw:raw };
    return { iso:date.toISOString(), ms:ms };
  }

  function safeNow(value) {
    const parsed = timestamp(value);
    return parsed && !parsed.invalid ? parsed : { iso:new Date().toISOString(), ms:Date.now() };
  }

  function policy(input) {
    const source = obj(input);
    const sourcePolicy = obj(source.sourcePolicy);
    const freshnessPolicy = obj(sourcePolicy.freshnessPolicy || source.freshnessPolicy);
    const authority = upper(sourcePolicy.priceAuthority || source.priceAuthority || sourcePolicy.authority);
    return {
      sourceAuthority:authority === "AUTHORITATIVE" || authority === "AUTHORITATIVE_PROVIDER" || authority === "TRUSTED_CONTROLLED_READONLY_PROVIDER_PRICE"
        ? AUTHORITIES.AUTHORITATIVE
        : (authority === "INDICATIVE" || authority === "PUBLIC_MERCHANT_EVIDENCE" || authority === "INDICATIVE_PRICE_OBSERVATION" ? AUTHORITIES.INDICATIVE
          : (authority === "IDENTITY_ONLY" ? AUTHORITIES.IDENTITY_ONLY : AUTHORITIES.UNKNOWN)),
      freshnessPolicy:{
        basis:text(freshnessPolicy.basis || "observedAt"),
        maxCurrentAgeSeconds:Number.isSafeInteger(freshnessPolicy.maxCurrentAgeSeconds) && freshnessPolicy.maxCurrentAgeSeconds > 0 ? freshnessPolicy.maxCurrentAgeSeconds : null,
        maxRecentAgeSeconds:Number.isSafeInteger(freshnessPolicy.maxRecentAgeSeconds) && freshnessPolicy.maxRecentAgeSeconds > 0 ? freshnessPolicy.maxRecentAgeSeconds : null
      }
    };
  }

  function timestamps(input) {
    const source = obj(input);
    return {
      observedAt:timestamp(source.observedAt),
      fetchedAt:timestamp(source.fetchedAt || source.retrievedAt),
      sourceUpdatedAt:timestamp(source.sourceUpdatedAt || source.providerUpdatedAt),
      cacheStoredAt:timestamp(source.cacheStoredAt)
    };
  }

  function freshness(input, policyResult, timeResult) {
    const now = safeNow(obj(input).now);
    const times = timeResult || timestamps(input);
    if (["observedAt", "fetchedAt", "sourceUpdatedAt", "cacheStoredAt"].some(function (key) { return times[key] && times[key].invalid; })) {
      return { state:FRESHNESS_STATES.INVALID_TIME, basis:"INVALID_TIME", ageSeconds:null, reason:"INVALID_TIME" };
    }
    const basis = policyResult.freshnessPolicy.basis;
    const selected = times[basis] || null;
    if (!selected) return { state:FRESHNESS_STATES.UNKNOWN, basis:basis, ageSeconds:null, reason:"UNKNOWN_TIMESTAMP" };
    const futureSkewSeconds = Math.round((selected.ms - now.ms) / 1000);
    if (futureSkewSeconds > 300) return { state:FRESHNESS_STATES.INVALID_TIME, basis:basis, ageSeconds:null, reason:"FUTURE_TIMESTAMP" };
    if (!policyResult.freshnessPolicy.maxCurrentAgeSeconds) {
      return { state:FRESHNESS_STATES.UNKNOWN, basis:basis, ageSeconds:null, reason:"FRESHNESS_POLICY_REQUIRED" };
    }
    const ageSeconds = Math.max(0, Math.round((now.ms - selected.ms) / 1000));
    if (ageSeconds <= policyResult.freshnessPolicy.maxCurrentAgeSeconds) return { state:FRESHNESS_STATES.CURRENT, basis:basis, ageSeconds:ageSeconds, reason:"CURRENT_BY_SOURCE_POLICY" };
    if (policyResult.freshnessPolicy.maxRecentAgeSeconds && ageSeconds <= policyResult.freshnessPolicy.maxRecentAgeSeconds) {
      return { state:FRESHNESS_STATES.RECENT, basis:basis, ageSeconds:ageSeconds, reason:"RECENT_BY_SOURCE_POLICY" };
    }
    return { state:FRESHNESS_STATES.STALE, basis:basis, ageSeconds:ageSeconds, reason:"STALE_EVIDENCE" };
  }

  function condition(input) {
    const source = obj(input);
    const priceType = upper(source.priceType || source.priceBasis || "EXACT");
    if (priceType === "PRICE_RANGE" && (typeof source.priceHigh !== "number" || !Number.isFinite(source.priceHigh))) {
      return { state:CONDITION_STATES.INVALID, priceType:priceType, reason:"PRICE_RANGE_REQUIRES_RANGE" };
    }
    if (CONDITIONAL_PRICE_TYPES.indexOf(priceType) >= 0) return { state:CONDITION_STATES.CONDITIONAL, priceType:priceType, reason:priceType };
    const conditions = Array.isArray(source.priceConditions) ? source.priceConditions.map(upper).filter(Boolean) : [];
    if (conditions.length) return { state:CONDITION_STATES.CONDITIONAL, priceType:priceType, reason:"CONDITIONAL_PRICE" };
    const status = upper(source.priceConditionStatus);
    if (status === "CONDITIONAL") return { state:CONDITION_STATES.CONDITIONAL, priceType:priceType, reason:"CONDITIONAL_PRICE" };
    if (status === "UNKNOWN" || status === "PRICE_CONDITIONS_UNKNOWN") return { state:CONDITION_STATES.UNKNOWN, priceType:priceType, reason:"UNKNOWN_CONDITION" };
    return { state:CONDITION_STATES.UNCONDITIONAL, priceType:priceType, reason:"UNCONDITIONAL_PRICE" };
  }

  function classifyPriceEvidenceQuality(input) {
    const source = obj(input);
    const reasons = [];
    const priceValid = typeof source.price === "number" && Number.isFinite(source.price) && source.price >= 0;
    if (!priceValid) reasons.push("INVALID_PRICE");
    const currency = normalizedCurrency(source.currency);
    if (!currency) reasons.push("CURRENCY_REQUIRED");
    const policyResult = policy(source);
    const timeResult = timestamps(source);
    const freshnessResult = freshness(source, policyResult, timeResult);
    const conditionResult = condition(source);
    if (freshnessResult.state === FRESHNESS_STATES.STALE) reasons.push("STALE_EVIDENCE");
    if (freshnessResult.state === FRESHNESS_STATES.UNKNOWN) reasons.push(freshnessResult.reason);
    if (freshnessResult.state === FRESHNESS_STATES.INVALID_TIME) reasons.push(freshnessResult.reason);
    if (conditionResult.state === CONDITION_STATES.CONDITIONAL) reasons.push("CONDITIONAL_PRICE");
    if (conditionResult.state === CONDITION_STATES.UNKNOWN) reasons.push("UNKNOWN_PRICE_CONDITION");
    if (conditionResult.state === CONDITION_STATES.INVALID) reasons.push(conditionResult.reason);
    if (policyResult.sourceAuthority !== AUTHORITIES.AUTHORITATIVE) reasons.push(policyResult.sourceAuthority === AUTHORITIES.INDICATIVE ? "INDICATIVE_SOURCE" : "SOURCE_AUTHORITY_NOT_VERIFIED");
    const shippingKnown = source.shipping === null || source.shipping === undefined ? false : true;
    const taxKnown = source.tax === null || source.tax === undefined ? false : true;
    const feesKnown = source.fees === null || source.fees === undefined ? false : true;
    const landedTotalKnown = source.landedTotal === null || source.landedTotal === undefined ? false : true;
    const availabilityConfidence = source.availabilityAuthority === true ? "AUTHORITATIVE" : "UNKNOWN";
    if (availabilityConfidence === "UNKNOWN") reasons.push("AVAILABILITY_UNKNOWN");
    if (!landedTotalKnown && (shippingKnown === false || taxKnown === false || feesKnown === false)) reasons.push("LANDED_TOTAL_UNKNOWN");

    let outcome = OUTCOMES.UNKNOWN;
    if (!priceValid || !currency || freshnessResult.state === FRESHNESS_STATES.INVALID_TIME || conditionResult.state === CONDITION_STATES.INVALID) {
      outcome = OUTCOMES.UNUSABLE;
    } else if (conditionResult.state === CONDITION_STATES.CONDITIONAL) {
      outcome = OUTCOMES.CONDITIONAL;
    } else if (freshnessResult.state === FRESHNESS_STATES.STALE) {
      outcome = OUTCOMES.STALE;
    } else if (policyResult.sourceAuthority === AUTHORITIES.INDICATIVE) {
      outcome = OUTCOMES.INDICATIVE;
    } else if (policyResult.sourceAuthority === AUTHORITIES.AUTHORITATIVE && freshnessResult.state === FRESHNESS_STATES.CURRENT && conditionResult.state === CONDITION_STATES.UNCONDITIONAL) {
      outcome = availabilityConfidence === "AUTHORITATIVE" && landedTotalKnown ? OUTCOMES.VERIFIED_CURRENT : OUTCOMES.VERIFIED_WITH_LIMITATIONS;
    }

    const eligibleForCurrentVerifiedPrice = outcome === OUTCOMES.VERIFIED_CURRENT;
    return deepFreeze({
      qualityName:QUALITY_NAME,
      appVersion:VERSION,
      outcome:outcome,
      priceValidity:priceValid ? "VALID" : "INVALID",
      sourceAuthority:policyResult.sourceAuthority,
      priceFreshness:freshnessResult.state,
      freshnessBasis:freshnessResult.basis,
      freshnessAgeSeconds:freshnessResult.ageSeconds,
      priceCondition:conditionResult.state,
      priceType:conditionResult.priceType,
      currencyConfidence:currency ? "VALID" : "INVALID",
      marketContext:text(source.market || source.marketContext) || "UNKNOWN",
      availabilityConfidence:availabilityConfidence,
      handoffQuality:upper(source.handoffQuality || "UNKNOWN"),
      priceBasis:upper(source.priceBasis || source.priceType || "EXACT"),
      timestamps:{
        observedAt:timeResult.observedAt && !timeResult.observedAt.invalid ? timeResult.observedAt.iso : null,
        fetchedAt:timeResult.fetchedAt && !timeResult.fetchedAt.invalid ? timeResult.fetchedAt.iso : null,
        sourceUpdatedAt:timeResult.sourceUpdatedAt && !timeResult.sourceUpdatedAt.invalid ? timeResult.sourceUpdatedAt.iso : null,
        cacheStoredAt:timeResult.cacheStoredAt && !timeResult.cacheStoredAt.invalid ? timeResult.cacheStoredAt.iso : null
      },
      landedCost:{
        shippingKnown:shippingKnown,
        taxKnown:taxKnown,
        feesKnown:feesKnown,
        landedTotalKnown:landedTotalKnown
      },
      eligibleForCurrentVerifiedPrice:eligibleForCurrentVerifiedPrice,
      recommendationTrace:eligibleForCurrentVerifiedPrice ? "LOWEST_CURRENT_VERIFIED_PRICE_ELIGIBLE" : reasons[0] || "PRICE_EVIDENCE_LIMITED",
      reasons:Array.from(new Set(reasons)).sort(),
      noMagicScore:true,
      externalAiUsed:false
    });
  }

  window.WeishanGlobalCommercePriceEvidenceQuality = Object.freeze({
    VERSION,
    QUALITY_NAME,
    AUTHORITIES,
    FRESHNESS_STATES,
    CONDITION_STATES,
    OUTCOMES,
    classifyPriceEvidenceQuality
  });
})();
