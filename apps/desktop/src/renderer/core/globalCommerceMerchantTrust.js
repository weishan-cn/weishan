;(function () {
  "use strict";

  const MERCHANT_TYPES = Object.freeze(["OFFICIAL", "AUTHORIZED", "MARKETPLACE", "INDIVIDUAL", "UNKNOWN"]);
  const FRAUD_RISKS = Object.freeze(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]);
  const CONFIDENCE = Object.freeze(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]);
  const EVIDENCE_TYPES = Object.freeze(["OFFICIAL_DECLARATION", "AUTHORIZATION_DECLARATION", "PLATFORM_VERIFICATION", "SELLER_VERIFICATION", "RATING_SUMMARY", "REVIEW_SUMMARY", "POLICY_DECLARATION", "OTHER_DECLARATION"]);
  const TYPE_SCORE = Object.freeze({ OFFICIAL:35, AUTHORIZED:30, MARKETPLACE:20, INDIVIDUAL:10, UNKNOWN:0 });
  const CONFIDENCE_RANK = Object.freeze({ HIGH:0, MEDIUM:1, LOW:2, UNKNOWN:3 });

  function failure(code, stage, userMessage, detailsSummary) {
    return Object.freeze({ success:false, error:Object.freeze({ code, stage, recoverable:true, userMessage, detailsSummary }) });
  }

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard;
    return api && typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : failure("COMMERCE_INPUT_REJECTED", "INPUT_GUARD", "Commerce input could not be processed safely.", "The commerce input did not satisfy the public boundary contract.");
  }

  function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }
  function bool(value, fallback) { return value === undefined ? fallback : (typeof value === "boolean" ? value : null); }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function safeEvidenceValue(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.length <= 240 && !/^(?:https?|data|file|javascript):/i.test(value.trim())) return value;
    return null;
  }

  function normalizeTrustEvidence(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    if (!Array.isArray(checked.value)) return failure("TRUST_EVIDENCE_INVALID", "EVIDENCE", "Merchant evidence is invalid.", "Evidence must be an array.");
    const output = [], seen = new Set();
    for (const item of checked.value) {
      if (!item || typeof item !== "object" || Array.isArray(item) || EVIDENCE_TYPES.indexOf(item.type) < 0 || CONFIDENCE.indexOf(item.confidence) < 0) return failure("TRUST_EVIDENCE_INVALID", "EVIDENCE", "Merchant evidence is invalid.", "Evidence must use declared type, value, and confidence.");
      const value = safeEvidenceValue(item.value);
      if (value === null) return failure("TRUST_EVIDENCE_INVALID", "EVIDENCE", "Merchant evidence is invalid.", "Evidence values must be safe primitive declarations.");
      const key = item.type + "|" + typeof value + "|" + String(value) + "|" + item.confidence;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(Object.freeze({ type:item.type, value, confidence:item.confidence }));
      }
    }
    return Object.freeze({ success:true, evidence:Object.freeze(output) });
  }

  function evidenceScore(evidence) {
    return Math.min(15, evidence.reduce(function (score, item) {
      return score + ({ HIGH:5, MEDIUM:3, LOW:1, UNKNOWN:0 })[item.confidence];
    }, 0));
  }

  function derivedConfidence(source, evidence) {
    if (source.verified && evidence.length >= 2 && source.merchantType !== "UNKNOWN") return "HIGH";
    if (evidence.length >= 1 || source.verified) return "MEDIUM";
    if (source.rating !== null) return "LOW";
    return "UNKNOWN";
  }

  function trustScore(source, evidence) {
    const reviewScore = source.reviewCount === 0 ? 0 : (source.reviewCount < 10 ? 2 : (source.reviewCount < 100 ? 5 : (source.reviewCount < 1000 ? 8 : 10)));
    const ratingScore = source.rating === null ? 0 : (source.rating / 5) * 20;
    const fraudAdjustment = ({ LOW:0, UNKNOWN:-5, MEDIUM:-20, HIGH:-50 })[source.fraudRisk];
    return Math.min(100, Math.max(0, round(TYPE_SCORE[source.merchantType] + (source.verified ? 20 : 0) + ratingScore + reviewScore + evidenceScore(evidence) + fraudAdjustment)));
  }

  function createMerchantTrustSnapshot(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source) || typeof source.merchantId !== "string" || !source.merchantId.trim()) return failure("TRUST_MERCHANT_INVALID", "MERCHANT", "Merchant declaration is invalid.", "Merchant id must be a non-empty offline identifier.");
    if (MERCHANT_TYPES.indexOf(source.merchantType) < 0) return failure("TRUST_MERCHANT_INVALID", "MERCHANT", "Merchant declaration is invalid.", "Merchant type must use a supported declared value.");

    const flags = {
      official:bool(source.official, false),
      authorized:bool(source.authorized, false),
      marketplace:bool(source.marketplace, false),
      individual:bool(source.individual, false)
    };
    if (Object.values(flags).some(function (value) { return value === null; }) || Object.values(flags).filter(Boolean).length > 1) return failure("TRUST_FLAG_CONFLICT", "MERCHANT", "Merchant declaration conflicts.", "Merchant flags must be consistent.");
    const expected = { OFFICIAL:"official", AUTHORIZED:"authorized", MARKETPLACE:"marketplace", INDIVIDUAL:"individual", UNKNOWN:null }[source.merchantType];
    if ((expected && flags[expected] !== true) || (!expected && Object.values(flags).some(Boolean))) return failure("TRUST_FLAG_CONFLICT", "MERCHANT", "Merchant declaration conflicts.", "Merchant type and flags must agree.");

    const verified = bool(source.verified, false);
    if (verified === null || FRAUD_RISKS.indexOf(source.fraudRisk === undefined ? "UNKNOWN" : source.fraudRisk) < 0) return failure("TRUST_INPUT_REJECTED", "TRUST", "Merchant trust input is invalid.", "Verified and fraud risk must use declared values.");
    const fraudRisk = source.fraudRisk === undefined ? "UNKNOWN" : source.fraudRisk;
    const rating = source.rating === undefined || source.rating === null ? null : source.rating;
    if (rating !== null && (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 5 || round(rating) !== rating)) return failure("TRUST_RATING_INVALID", "TRUST", "Merchant rating is invalid.", "Rating must be a finite number from zero to five with at most two decimals.");
    const reviewCount = source.reviewCount === undefined ? 0 : source.reviewCount;
    if (!Number.isSafeInteger(reviewCount) || reviewCount < 0 || (rating === null && reviewCount > 0)) return failure("TRUST_RATING_INVALID", "TRUST", "Merchant rating is invalid.", "Review count must match the declared rating contract.");

    const evidenceResult = normalizeTrustEvidence(source.evidence === undefined ? [] : source.evidence);
    if (!evidenceResult.success) return evidenceResult;
    const normalized = {
      merchantId:source.merchantId.trim(),
      merchantType:source.merchantType,
      official:flags.official,
      authorized:flags.authorized,
      marketplace:flags.marketplace,
      individual:flags.individual,
      verified,
      rating,
      reviewCount,
      fraudRisk,
      evidence:evidenceResult.evidence
    };
    const trustConfidence = derivedConfidence(normalized, normalized.evidence);
    if (own(source, "trustConfidence") && CONFIDENCE.indexOf(source.trustConfidence) < 0) return failure("TRUST_INPUT_REJECTED", "TRUST", "Merchant trust input is invalid.", "Trust confidence must use a supported declared value.");
    const calculatedScore = trustScore(normalized, normalized.evidence);
    if (own(source, "trustScore") && (typeof source.trustScore !== "number" || !Number.isFinite(source.trustScore) || round(source.trustScore) !== calculatedScore)) return failure("TRUST_SCORE_MISMATCH", "TRUST", "Merchant trust score could not be verified.", "Provided trust score does not match the offline calculation.");

    const reasonCodes = [];
    if (rating !== null && reviewCount === 0) reasonCodes.push("RATING_WITHOUT_REVIEWS");
    if (verified) reasonCodes.push("VERIFIED_DECLARATION");
    else reasonCodes.push("MERCHANT_NOT_VERIFIED");
    if (normalized.evidence.length) reasonCodes.push("EVIDENCE_PRESENT");
    if (fraudRisk === "HIGH") reasonCodes.push("HIGH_FRAUD_RISK_DECLARED");
    else if (fraudRisk === "UNKNOWN") reasonCodes.push("FRAUD_RISK_UNKNOWN");
    if (trustConfidence === "LOW" || trustConfidence === "UNKNOWN") reasonCodes.push("LOW_CONFIDENCE_EVIDENCE");
    const trusted = calculatedScore >= 60 && fraudRisk !== "HIGH" && (verified || normalized.evidence.length > 0 || (rating !== null && reviewCount > 0));
    return Object.freeze({ success:true, snapshot:Object.freeze(Object.assign({}, normalized, {
      trustConfidence,
      trustScore:calculatedScore,
      trusted,
      reasonCodes:Object.freeze(reasonCodes)
    })) });
  }

  function validateMerchantTrustSnapshot(input) { return createMerchantTrustSnapshot(input); }

  function calculateMerchantTrustScore(input) {
    const result = createMerchantTrustSnapshot(input);
    return result.success ? Object.freeze({ success:true, trustScore:result.snapshot.trustScore, trusted:result.snapshot.trusted, reasonCodes:result.snapshot.reasonCodes }) : result;
  }

  function compareMerchantTrustSnapshots(input) {
    const checked = guard(input);
    if (!checked.success) return checked;
    if (!Array.isArray(checked.value)) return failure("TRUST_INPUT_REJECTED", "COMPARISON", "Merchant trust comparison input is invalid.", "Merchant trust comparison requires an array.");
    const snapshots = [];
    for (const item of checked.value) {
      const result = createMerchantTrustSnapshot(item);
      if (!result.success) return result;
      snapshots.push(result.snapshot);
    }
    const ordered = snapshots.map(function (snapshot, index) { return { snapshot, index }; }).sort(function (left, right) {
      return Number(right.snapshot.trusted) - Number(left.snapshot.trusted) || right.snapshot.trustScore - left.snapshot.trustScore || CONFIDENCE_RANK[left.snapshot.trustConfidence] - CONFIDENCE_RANK[right.snapshot.trustConfidence] || left.index - right.index;
    }).map(function (entry) { return entry.snapshot; });
    return Object.freeze({ success:true, snapshots:Object.freeze(ordered) });
  }

  function createMerchantTrustAssessment(input) {
    const result = createMerchantTrustSnapshot(input);
    return result.success ? Object.freeze({ success:true, trust:result.snapshot }) : result;
  }

  window.WeishanGlobalCommerceMerchantTrust = Object.freeze({
    MERCHANT_TYPES,
    FRAUD_RISKS,
    CONFIDENCE,
    EVIDENCE_TYPES,
    createMerchantTrustSnapshot,
    validateMerchantTrustSnapshot,
    normalizeTrustEvidence,
    calculateMerchantTrustScore,
    compareMerchantTrustSnapshots,
    createMerchantTrustAssessment
  });
})();
