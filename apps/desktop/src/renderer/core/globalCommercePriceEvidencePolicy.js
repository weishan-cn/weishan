;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const POLICY_NAME = "global_commerce_price_evidence_policy_v1";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function guarded(input) {
    const api = window.WeishanGlobalCommerceInputGuard || {};
    return typeof api.guardAndCloneCommerceInput === "function" ? api.guardAndCloneCommerceInput(input) : { success:false };
  }
  function safety() {
    return {
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false,
      checkout:false,
      payment:false,
      order:false,
      booking:false,
      ticketing:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }
  function result(value) { return deepFreeze(Object.assign(value, safety())); }
  function failure(code, details) {
    return result({ success:false, status:"PRICE_UNVERIFIABLE", code:code, evidence:[], preferredEvidenceId:null, recommendation:null, details:details || [] });
  }
  function validEvidence(value) {
    return value && typeof value === "object" && value.modelName === "global_commerce_price_evidence_v1" &&
      typeof value.price === "number" && Number.isFinite(value.price) && value.price >= 0 && /^[A-Z]{3}$/.test(text(value.currency));
  }
  function identityKey(evidence) {
    const identity = evidence.productIdentity || {};
    return ["gtin", "ean", "upc", "isbn", "mpn", "providerProductId", "sku"]
      .filter(function (key) { return text(identity[key]); })
      .map(function (key) { return key + ":" + text(identity[key]); }).join("|");
  }
  function duplicateKey(evidence) {
    return [evidence.sourceId, identityKey(evidence), evidence.price, evidence.currency,
      evidence.providerUpdatedAt || evidence.sourceObservationDate || evidence.observedAt].join("|");
  }
  function evidenceOrder(left, right) {
    const priority = Number(left.sourcePriority || 99) - Number(right.sourcePriority || 99);
    if (priority) return priority;
    const leftKnown = left.freshnessStatus === "UNKNOWN" ? 1 : 0;
    const rightKnown = right.freshnessStatus === "UNKNOWN" ? 1 : 0;
    if (leftKnown !== rightKnown) return leftKnown - rightKnown;
    const conditionOrder = { UNCONDITIONAL_VERIFIED:0, CONDITIONAL:1, PRICE_CONDITIONS_UNKNOWN:2 };
    const condition = (conditionOrder[left.priceConditionStatus] == null ? 9 : conditionOrder[left.priceConditionStatus]) -
      (conditionOrder[right.priceConditionStatus] == null ? 9 : conditionOrder[right.priceConditionStatus]);
    if (condition) return condition;
    return text(left.evidenceId) < text(right.evidenceId) ? -1 : (text(left.evidenceId) > text(right.evidenceId) ? 1 : 0);
  }

  function resolveEvidenceSet(input) {
    const checked = guarded(input);
    if (!checked.success) return failure("COMMERCE_INPUT_REJECTED");
    const source = checked.value && typeof checked.value === "object" ? checked.value : {};
    const raw = Array.isArray(source.evidence) ? source.evidence : [];
    if (!raw.length) return failure("NO_VALID_PRICE_EVIDENCE");
    if (raw.some(function (item) { return !validEvidence(item); })) return failure("INVALID_PRICE_EVIDENCE");
    const identities = new Set(raw.map(identityKey));
    if (identities.size !== 1 || identities.has("")) return failure("PRODUCT_IDENTITY_CONFLICT");
    const deduplicated = [];
    const seen = new Set();
    raw.forEach(function (item) {
      const key = duplicateKey(item);
      if (!seen.has(key)) { seen.add(key); deduplicated.push(clone(item)); }
    });
    const currencies = new Set(deduplicated.map(function (item) { return item.currency; }));
    if (currencies.size !== 1) {
      return result({
        success:true,
        status:"CURRENCY_NORMALIZATION_REQUIRED",
        code:"CURRENCY_NORMALIZATION_REQUIRED",
        evidence:deduplicated.sort(evidenceOrder),
        preferredEvidenceId:null,
        recommendation:null,
        conflict:true,
        automaticWinner:false
      });
    }
    const ordered = deduplicated.sort(evidenceOrder);
    const signatures = new Set(ordered.map(function (item) {
      return [item.price, item.priceConditionStatus, (item.priceConditions || []).join(",")].join("|");
    }));
    const conflict = signatures.size > 1;
    return result({
      success:true,
      status:conflict ? "PRICE_EVIDENCE_CONFLICT" : "EVIDENCE_CONSISTENT",
      code:conflict ? "PRICE_EVIDENCE_CONFLICT" : null,
      evidence:ordered,
      preferredEvidenceId:conflict ? null : ordered[0].evidenceId,
      recommendation:null,
      conflict:conflict,
      automaticWinner:false,
      sourcePriorityPolicy:[
        "OFFICIAL_LIVE_API",
        "OFFICIAL_PROVIDER_OR_MERCHANT_FEED",
        "MERCHANT_PUBLIC_STRUCTURED_OFFER",
        "AUTHORIZED_AFFILIATE_CATALOG",
        "PRICE_OBSERVATION_EVIDENCE"
      ],
      limitations:["Authority priority does not override freshness, authorization, price conditions, or conflicts."]
    });
  }

  function routePriceEvidence(input) {
    const checked = guarded(input);
    if (!checked.success) return failure("COMMERCE_INPUT_REJECTED");
    const safe = checked.value && typeof checked.value === "object" ? checked.value : {};
    const layer1 = safe.layer1 && typeof safe.layer1 === "object" ? safe.layer1 : {};
    const layer2 = safe.layer2 && typeof safe.layer2 === "object" ? safe.layer2 : {};
    if (layer1.status === "FREE_AUTHORIZED_AVAILABLE" && validEvidence(layer1.evidence)) {
      return result({ success:true, status:"LAYER_1_SELECTED", selectedLayer:"LAYER_1", evidence:clone(layer1.evidence), paidProviderDeferred:false, alternativeEvidenceAttempted:false });
    }
    const paidDeferred = layer1.status === "PAYMENT_REQUIRED";
    if (layer2.status === "VALID_EVIDENCE_AVAILABLE" && validEvidence(layer2.evidence)) {
      return result({ success:true, status:"LAYER_2_SELECTED", selectedLayer:"LAYER_2", evidence:clone(layer2.evidence), paidProviderDeferred:paidDeferred, alternativeEvidenceAttempted:true });
    }
    return result({
      success:false,
      status:"PRICE_UNVERIFIABLE",
      selectedLayer:null,
      evidence:null,
      paidProviderDeferred:paidDeferred,
      alternativeEvidenceAttempted:true,
      paymentAttempted:false,
      subscriptionAttempted:false,
      billingOpened:false,
      fallbackUsed:false
    });
  }

  function neutralRecommendation(input) {
    const checked = guarded(input);
    if (!checked.success) return failure("COMMERCE_INPUT_REJECTED");
    const safe = checked.value && typeof checked.value === "object" ? checked.value : {};
    const candidates = Array.isArray(safe.candidates) ? safe.candidates : [];
    if (!candidates.length || candidates.some(function (item) {
      return !item || typeof item !== "object" || !text(item.candidateId) || typeof item.userBenefitScore !== "number" || !Number.isFinite(item.userBenefitScore);
    })) return failure("RECOMMENDATION_INPUT_INVALID");
    const normalized = candidates.map(function (item) {
      return {
        candidateId:text(item.candidateId),
        userBenefitScore:item.userBenefitScore,
        price:typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null,
        currency:/^[A-Z]{3}$/.test(text(item.currency)) ? text(item.currency) : null,
        evidenceConfidence:text(item.evidenceConfidence) || "UNKNOWN",
        productQualityScore:typeof item.productQualityScore === "number" && Number.isFinite(item.productQualityScore) ? item.productQualityScore : null
      };
    });
    normalized.sort(function (left, right) {
      return right.userBenefitScore - left.userBenefitScore || (left.candidateId < right.candidateId ? -1 : (left.candidateId > right.candidateId ? 1 : 0));
    });
    const currencies = new Set(normalized.map(function (item) { return item.currency; }).filter(Boolean));
    const priced = normalized.filter(function (item) { return item.price !== null; }).slice().sort(function (left, right) {
      return left.price - right.price || (left.candidateId < right.candidateId ? -1 : (left.candidateId > right.candidateId ? 1 : 0));
    });
    return result({
      success:true,
      status:"USER_BENEFIT_RANKING_READY",
      rankedCandidates:normalized,
      recommendationCandidateId:normalized[0].candidateId,
      cheapestCandidateId:currencies.size === 1 && priced.length ? priced[0].candidateId : null,
      priceComparisonStatus:currencies.size <= 1 ? "COMPARABLE" : "CURRENCY_NORMALIZATION_REQUIRED",
      commercialMetadataAcceptedForRanking:false,
      commercialMetadataStored:false
    });
  }

  const PACKAGE = result({
    policyName:POLICY_NAME,
    appVersion:VERSION,
    layers:{
      LAYER_1:"CONTROLLED_AUTHORIZED_PROVIDER",
      LAYER_2:"SOURCE_SPECIFIC_PUBLIC_PRICE_EVIDENCE",
      LAYER_3:"FUTURE_COMMERCIAL_PROVIDER_DEFERRED"
    },
    defaultPolicy:"DENY",
    automaticScraping:false,
    arbitraryUrlInput:false,
    automaticPayment:false,
    automaticSubscription:false
  });

  window.WeishanGlobalCommercePriceEvidencePolicy = Object.freeze({
    VERSION,
    POLICY_NAME,
    PACKAGE,
    resolveEvidenceSet,
    routePriceEvidence,
    neutralRecommendation
  });
})();
