;(function () {
  "use strict";

  const WEIGHT_KEYS = Object.freeze(["priceWeight", "trustWeight", "availabilityWeight", "shippingWeight", "promotionWeight", "confidenceWeight"]);
  const DEFAULT_WEIGHTS = Object.freeze({ priceWeight:0.25, trustWeight:0.30, availabilityWeight:0.20, shippingWeight:0.10, promotionWeight:0.05, confidenceWeight:0.10 });
  const STATE_RANK = Object.freeze({ ELIGIBLE:0, CONDITIONAL:1, UNKNOWN:2, NOT_ELIGIBLE:3 });
  const CONFIDENCE_VALUE = Object.freeze({ HIGH:100, MEDIUM:70, LOW:40, UNKNOWN:20 });
  const AVAILABILITY_VALUE = Object.freeze({ IN_STOCK:100, LIMITED:80, PREORDER:60, BACKORDER:40, UNKNOWN:20, OUT_OF_STOCK:0 });

  function failure(code, stage, userMessage, detailsSummary) {
    return Object.freeze({ success:false, error:Object.freeze({ code, stage, recoverable:true, userMessage, detailsSummary }) });
  }
  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : failure("COMMERCE_INPUT_REJECTED", "INPUT_GUARD", "Commerce input could not be processed safely.", "The commerce input did not satisfy the public boundary contract.");
  }
  function round(value) { return Math.min(100, Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100)); }
  function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }

  function normalizePricing(value) {
    const api = window.WeishanGlobalCommercePricing;
    if (!api) return failure("DECISION_PRICING_INVALID", "DECISION", "Decision pricing is invalid.", "Pricing Core is unavailable.");
    const result = api.createPriceSnapshot(value && value.snapshot ? value.snapshot : value);
    return result.success ? result : failure("DECISION_PRICING_INVALID", "DECISION", "Decision pricing is invalid.", "Pricing must satisfy the offline Pricing contract.");
  }
  function normalizeAvailability(value) {
    const api = window.WeishanGlobalCommerceAvailability;
    if (!api) return failure("DECISION_AVAILABILITY_INVALID", "DECISION", "Decision availability is invalid.", "Availability Core is unavailable.");
    const result = api.createAvailabilitySnapshot(value && value.snapshot ? value.snapshot : value);
    return result.success ? result : failure("DECISION_AVAILABILITY_INVALID", "DECISION", "Decision availability is invalid.", "Availability must satisfy the offline Availability contract.");
  }
  function normalizeTrust(value) {
    const api = window.WeishanGlobalCommerceMerchantTrust;
    if (!api) return failure("DECISION_TRUST_INVALID", "DECISION", "Decision merchant trust is invalid.", "Merchant Trust Core is unavailable.");
    const result = api.createMerchantTrustSnapshot(value && value.snapshot ? value.snapshot : value);
    return result.success ? result : failure("DECISION_TRUST_INVALID", "DECISION", "Decision merchant trust is invalid.", "Merchant trust must satisfy the offline Trust contract.");
  }
  function normalizeWeights(value) {
    const source = value === undefined ? {} : value;
    if (!source || typeof source !== "object" || Array.isArray(source)) return failure("DECISION_WEIGHT_INVALID", "DECISION", "Decision weights are invalid.", "Weights must use the declared offline contract.");
    const output = {};
    for (const key of WEIGHT_KEYS) {
      const weight = own(source, key) ? source[key] : DEFAULT_WEIGHTS[key];
      if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 1) return failure("DECISION_WEIGHT_INVALID", "DECISION", "Decision weights are invalid.", "Weights must be finite numbers from zero to one.");
      output[key] = weight;
    }
    const total = WEIGHT_KEYS.reduce(function (sum, key) { return sum + output[key]; }, 0);
    if (Math.abs(total - 1) > 0.000001) return failure("DECISION_WEIGHT_INVALID", "DECISION", "Decision weights are invalid.", "Weights must sum to one.");
    WEIGHT_KEYS.forEach(function (key) { output[key] = output[key] / total; });
    return Object.freeze({ success:true, weights:Object.freeze(output) });
  }
  function createDecisionInput(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source) || typeof source.candidateId !== "string" || !source.candidateId.trim()) return failure("DECISION_INPUT_REJECTED", "DECISION", "Decision input is invalid.", "Candidate id must be a non-empty offline identifier.");
    const pricing = normalizePricing(source.pricing);
    if (!pricing.success) return pricing;
    const availability = normalizeAvailability(source.availability);
    if (!availability.success) return availability;
    const trust = normalizeTrust(source.merchantTrust);
    if (!trust.success) return trust;
    const weights = normalizeWeights(source.preferences);
    if (!weights.success) return weights;
    return Object.freeze({ success:true, input:Object.freeze({ candidateId:source.candidateId.trim(), pricing:pricing.snapshot, availability:availability.snapshot, merchantTrust:trust.snapshot, weights:weights.weights }) });
  }
  function validateDecisionInput(input) { return createDecisionInput(input); }

  function scorePrice(pricing) {
    if (pricing.historicalPrice === null || pricing.historicalPrice <= 0) return 50;
    const ratio = (pricing.historicalPrice - pricing.effectivePrice) / pricing.historicalPrice;
    return ratio <= 0 ? 50 : (ratio >= 0.5 ? 100 : round(50 + ratio * 100));
  }
  function scoreAvailability(availability) {
    const base = AVAILABILITY_VALUE[availability.status];
    return availability.purchasable ? base : Math.min(20, base);
  }
  function scoreShipping(availability) {
    if (!availability.shippingAvailable) return 0;
    if (!availability.estimatedDelivery) return 60;
    const max = availability.estimatedDelivery.maxDays;
    return max <= 2 ? 100 : (max <= 5 ? 85 : (max <= 10 ? 70 : (max <= 20 ? 50 : 30)));
  }
  function scorePromotion(pricing) {
    if (pricing.basePrice <= 0) return 0;
    const savings = pricing.discount + pricing.promotion + pricing.coupon + pricing.membershipSavings;
    const ratio = savings / pricing.basePrice;
    return ratio <= 0 ? 0 : (ratio <= 0.1 ? round(ratio * 400) : (ratio < 0.3 ? round(40 + ((ratio - 0.1) / 0.2) * 40) : 100));
  }
  function scoreConfidence(pricing, trust) { return round((CONFIDENCE_VALUE[pricing.priceConfidence] + CONFIDENCE_VALUE[trust.trustConfidence]) / 2); }

  function calculateDecisionScores(input) {
    const result = createDecisionInput(input);
    if (!result.success) return result;
    const value = result.input, scores = {
      priceScore:scorePrice(value.pricing),
      trustScore:value.merchantTrust.trustScore,
      availabilityScore:scoreAvailability(value.availability),
      shippingScore:scoreShipping(value.availability),
      promotionScore:scorePromotion(value.pricing),
      confidenceScore:scoreConfidence(value.pricing, value.merchantTrust)
    };
    scores.recommendationScore = round(
      scores.priceScore * value.weights.priceWeight +
      scores.trustScore * value.weights.trustWeight +
      scores.availabilityScore * value.weights.availabilityWeight +
      scores.shippingScore * value.weights.shippingWeight +
      scores.promotionScore * value.weights.promotionWeight +
      scores.confidenceScore * value.weights.confidenceWeight
    );
    return Object.freeze({ success:true, scores:Object.freeze(scores), weights:value.weights, input:value });
  }

  function explanation(value, scores) {
    const positive = [], caution = [], blocking = [];
    if (value.pricing.historicalPrice !== null && value.pricing.historicalPrice > value.pricing.effectivePrice) positive.push("PRICE_REFERENCE_FAVORABLE");
    else if (value.pricing.historicalPrice === null) caution.push("PRICE_REFERENCE_UNAVAILABLE");
    if (value.merchantTrust.trusted) positive.push("MERCHANT_TRUSTED");
    if (!value.merchantTrust.verified) caution.push("MERCHANT_NOT_VERIFIED");
    if (value.merchantTrust.rating !== null && value.merchantTrust.reviewCount === 0) caution.push("RATING_WITHOUT_REVIEWS");
    if (value.availability.purchasable) positive.push("ITEM_PURCHASABLE");
    else {
      blocking.push("NOT_PURCHASABLE");
      value.availability.reasonCodes.forEach(function (code) {
        if (["OUT_OF_STOCK", "REGION_BLOCKED", "REGION_NOT_ALLOWED", "SHIPPING_UNAVAILABLE"].indexOf(code) >= 0 && blocking.indexOf(code) < 0) blocking.push(code);
      });
    }
    if (value.availability.shippingAvailable) positive.push("SHIPPING_AVAILABLE");
    if (!value.availability.estimatedDelivery) caution.push("DELIVERY_ESTIMATE_UNAVAILABLE");
    if (value.availability.status === "LIMITED") caution.push("LIMITED_STOCK");
    if (value.availability.status === "PREORDER") caution.push("PREORDER_REQUIRED");
    if (value.availability.status === "BACKORDER") caution.push("BACKORDER_REQUIRED");
    if (scores.promotionScore > 0) positive.push("PROMOTION_PRESENT");
    if (value.merchantTrust.fraudRisk === "HIGH") blocking.push("HIGH_FRAUD_RISK_DECLARED");
    if (value.merchantTrust.fraudRisk === "UNKNOWN") caution.push("FRAUD_RISK_UNKNOWN");
    if (value.merchantTrust.trustConfidence === "HIGH" && value.pricing.priceConfidence === "HIGH") positive.push("HIGH_CONFIDENCE_EVIDENCE");
    if (value.merchantTrust.trustConfidence === "LOW" || value.merchantTrust.trustConfidence === "UNKNOWN") caution.push("LOW_CONFIDENCE_EVIDENCE");

    const state = !value.availability.purchasable || value.merchantTrust.fraudRisk === "HIGH"
      ? "NOT_ELIGIBLE"
      : (value.merchantTrust.trusted && scores.recommendationScore >= 70
        ? "ELIGIBLE"
        : (scores.recommendationScore >= 40 ? "CONDITIONAL" : "UNKNOWN"));
    const summaryCode = state === "ELIGIBLE" ? "STRONG_OFFLINE_MATCH" : (state === "CONDITIONAL" ? "ACCEPTABLE_WITH_CAUTION" : (value.merchantTrust.fraudRisk === "HIGH" ? "HIGH_RISK_DECLARED" : (!value.availability.purchasable ? "NOT_PURCHASABLE" : "INSUFFICIENT_EVIDENCE")));
    return Object.freeze({
      decisionState:state,
      explanation:Object.freeze({
        summaryCode,
        positiveReasons:Object.freeze(positive),
        cautionReasons:Object.freeze(caution),
        blockingReasons:Object.freeze(blocking),
        scoreBreakdown:Object.freeze({
          priceScore:scores.priceScore,
          trustScore:scores.trustScore,
          availabilityScore:scores.availabilityScore,
          shippingScore:scores.shippingScore,
          promotionScore:scores.promotionScore,
          confidenceScore:scores.confidenceScore,
          weights:value.weights,
          recommendationScore:scores.recommendationScore
        })
      })
    });
  }

  function createDecisionExplanation(input) {
    const scored = calculateDecisionScores(input);
    if (!scored.success) return scored;
    const result = explanation(scored.input, scored.scores);
    return Object.freeze({ success:true, decisionState:result.decisionState, explanation:result.explanation });
  }

  function createCommerceDecision(input) {
    const scored = calculateDecisionScores(input);
    if (!scored.success) return scored;
    const described = explanation(scored.input, scored.scores);
    const value = scored.input;
    return Object.freeze({
      success:true,
      decision:Object.freeze({
        candidateId:value.candidateId,
        decisionState:described.decisionState,
        purchasable:value.availability.purchasable,
        currency:value.pricing.currency,
        effectivePrice:value.pricing.effectivePrice,
        availabilityStatus:value.availability.status,
        merchantType:value.merchantTrust.merchantType,
        trusted:value.merchantTrust.trusted,
        fraudRisk:value.merchantTrust.fraudRisk,
        scores:scored.scores,
        explanation:described.explanation
      })
    });
  }

  function compareCommerceDecisions(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    if (!Array.isArray(checked.value)) return failure("DECISION_INPUT_REJECTED", "COMPARISON", "Decision comparison input is invalid.", "Decision comparison requires an array.");
    const decisions = [];
    for (const item of checked.value) {
      const result = createCommerceDecision(item);
      if (!result.success) return result;
      decisions.push(result.decision);
    }
    const currencies = Array.from(new Set(decisions.map(function (decision) { return decision.currency; })));
    if (currencies.length > 1) return Object.freeze({ success:true, comparable:false, decisions:Object.freeze(decisions), overallBest:null });
    const ordered = decisions.map(function (decision, index) { return { decision, index }; }).sort(function (left, right) {
      return STATE_RANK[left.decision.decisionState] - STATE_RANK[right.decision.decisionState] ||
        right.decision.scores.recommendationScore - left.decision.scores.recommendationScore ||
        Number(right.decision.trusted) - Number(left.decision.trusted) ||
        right.decision.scores.availabilityScore - left.decision.scores.availabilityScore ||
        left.decision.effectivePrice - right.decision.effectivePrice ||
        left.index - right.index;
    }).map(function (entry) { return entry.decision; });
    return Object.freeze({ success:true, comparable:true, currency:currencies[0] || null, decisions:Object.freeze(ordered), overallBest:ordered[0] || null });
  }

  window.WeishanGlobalCommerceDecision = Object.freeze({
    DEFAULT_WEIGHTS,
    createDecisionInput,
    validateDecisionInput,
    calculateDecisionScores,
    createDecisionExplanation,
    createCommerceDecision,
    compareCommerceDecisions
  });
})();
