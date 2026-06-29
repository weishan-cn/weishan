;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION = "2.2.5";
  const EXPLAINER_NAME = "global_shopping_candidate_confidence_explainer_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label || ""), value:text(value || ""), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      sensitiveStored:false,
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
  function buildCandidates(input) {
    const safe = obj(input);
    if (toArray(safe.candidateItems).length) {
      return toArray(safe.candidateItems).map(function (item, index) {
        const candidate = obj(item);
        return Object.assign({}, candidate, {
          candidateId:text(candidate.candidateId || ("candidate_" + (index + 1))),
          sourceId:text(candidate.sourceId || candidate.providerId || "source"),
          sourceName:text(candidate.sourceName || candidate.providerName || "候选来源"),
          redacted:true
        });
      });
    }
    const traceItems = toArray(obj(safe.providerEvidenceTrace).evidenceItems);
    if (!traceItems.length) return [];
    return [{ candidateId:"candidate_1", sourceId:text(traceItems[0].sourceId || "source"), sourceName:text(traceItems[0].sourceName || "来源"), redacted:true }];
  }
  function scoreFor(label) {
    if (label === "high") return 86;
    if (label === "medium") return 68;
    if (label === "low") return 46;
    return 30;
  }
  function buildGlobalShoppingCandidateConfidenceExplanations(input) {
    const safe = obj(input);
    const trace = obj(safe.providerEvidenceTrace);
    const trust = obj(safe.readOnlySourceTrustScore);
    const candidates = buildCandidates(safe);
    return clone(candidates.map(function (candidate, index) {
      const traceItems = toArray(trace.evidenceItems).filter(function (item) { return item.candidateId === candidate.candidateId; });
      const bestTrace = traceItems[0] || {};
      const confidenceLabel = text(bestTrace.trustLabel || "needs_review");
      const positiveFactors = [];
      const riskFactors = [];
      const missingEvidence = [];
      if (traceItems.some(function (item) { return item.evidenceType === "official_anchor" && item.evidenceStatus === "pass"; })) positiveFactors.push("存在官方参考价锚点");
      if (traceItems.some(function (item) { return item.evidenceType === "source_trust" && /high|medium/.test(item.trustLabel); })) positiveFactors.push("来源可信度结构已建立");
      if (traceItems.some(function (item) { return item.evidenceType === "tax_fee_normalization" && item.evidenceStatus === "pass"; })) positiveFactors.push("税费归一化步骤已完成");
      if (traceItems.some(function (item) { return item.evidenceType === "covered_lowest"; })) riskFactors.push("低价只在已覆盖来源范围内比较");
      if (confidenceLabel === "low" || confidenceLabel === "needs_review") riskFactors.push("仍需人工复核更多来源证据");
      if (!traceItems.some(function (item) { return item.evidenceType === "official_anchor"; })) missingEvidence.push("缺少官方参考价锚点");
      if (!traceItems.some(function (item) { return item.evidenceType === "source_trust"; })) missingEvidence.push("缺少来源可信度说明");
      if (!traceItems.some(function (item) { return item.evidenceType === "tax_fee_normalization"; })) missingEvidence.push("缺少税费完整性说明");
      return {
        candidateId:text(candidate.candidateId || ("candidate_" + (index + 1))),
        sourceId:text(candidate.sourceId || bestTrace.sourceId || "source"),
        sourceName:text(candidate.sourceName || bestTrace.sourceName || "候选来源"),
        confidenceLabel:/^(high|medium|low|needs_review)$/.test(confidenceLabel) ? confidenceLabel : "needs_review",
        confidenceScore:scoreFor(confidenceLabel),
        positiveFactors:positiveFactors,
        riskFactors:riskFactors.length ? riskFactors : ["可信度不代表最低价保证"],
        missingEvidence:missingEvidence,
        explanation:text((positiveFactors[0] || "当前候选价具有有限的脱敏来源证据。") + " 可信度只解释候选价来源和证据完整性，不代表最低价、官方背书、库存、可订、付款、下单或出票能力。"),
        caveat:"可信度只解释候选价来源和证据完整性，不代表最低价、官方背书、库存、可订、付款、下单或出票能力。",
        redacted:true
      };
    }));
  }
  function evaluateGlobalShoppingCandidateConfidence(input) {
    const safe = obj(input);
    const trace = obj(safe.providerEvidenceTrace);
    const trust = obj(safe.readOnlySourceTrustScore);
    const coverage = obj(safe.providerCoverageDashboard);
    const normalizedBoard = obj(safe.normalizedPriceCandidateBoard);
    const confidenceExplanations = buildGlobalShoppingCandidateConfidenceExplanations(safe);
    const confidenceHealth = {
      hasCandidates:confidenceExplanations.length > 0,
      hasEvidenceTrace:Object.keys(trace).length > 0,
      hasSourceTrustScore:Object.keys(trust).length > 0,
      hasPriceCompletenessCheck:Object.keys(normalizedBoard).length > 0 || confidenceExplanations.some(function (item) { return item.positiveFactors.some(function (factor) { return /税费/.test(factor); }); }),
      hasRiskFactorCheck:confidenceExplanations.every(function (item) { return toArray(item.riskFactors).length > 0; }),
      hasMissingEvidenceCheck:confidenceExplanations.every(function (item) { return Array.isArray(item.missingEvidence); }),
      doesNotTreatLowestAsBest:safe.claimsLowestPriceGuarantee !== true && safe.claimsBestPriceGuarantee !== true,
      doesNotOverrideOfficialAnchor:safe.overridesOfficialAnchor !== true,
      noOfficialEndorsementClaim:safe.claimsOfficialEndorsement !== true,
      noAvailabilityClaim:safe.claimsAvailability !== true,
      noLockedPriceClaim:safe.claimsLockedPrice !== true,
      noBookabilityClaim:safe.claimsBookability !== true,
      noCheckoutPaymentTicketing:safe.canCheckout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true
    };
    const blockedReasons = [];
    if (safe.claimsLowestPriceGuarantee === true) blockedReasons.push("lowest_price_guarantee_detected");
    if (safe.claimsBestPriceGuarantee === true) blockedReasons.push("best_price_guarantee_detected");
    if (safe.claimsOfficialEndorsement === true) blockedReasons.push("official_endorsement_detected");
    if (safe.claimsAvailability === true || safe.claimsLockedPrice === true || safe.claimsBookability === true) blockedReasons.push("availability_or_bookability_claim_detected");
    if (!confidenceHealth.noCheckoutPaymentTicketing) blockedReasons.push("transaction_capability_detected");
    if (safe.realProviderEnabled === true || safe.networkEnabled === true || safe.openExternal === true) blockedReasons.push("real_provider_or_external_open_detected");
    const needsReview = !confidenceHealth.hasCandidates || !confidenceHealth.hasEvidenceTrace || !confidenceHealth.hasSourceTrustScore || !confidenceHealth.hasPriceCompletenessCheck || !confidenceHealth.hasRiskFactorCheck || !confidenceHealth.hasMissingEvidenceCheck;
    return clone({
      explainerName:EXPLAINER_NAME,
      appVersion:GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      confidenceBoundary:{
        readOnly:true,
        sandboxOnly:true,
        fixtureOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        doesNotClaimLowestPrice:true,
        doesNotClaimBestPrice:true,
        doesNotClaimOfficialEndorsement:true,
        doesNotClaimAvailability:true,
        doesNotClaimLockedPrice:true,
        doesNotClaimBookability:true,
        doesNotClaimCheckoutAbility:true,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false
      },
      confidenceExplanations:confidenceExplanations,
      confidenceHealth:confidenceHealth,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingCandidateConfidenceRows(input) {
    const evaluated = evaluateGlobalShoppingCandidateConfidence(input || {});
    return clone(evaluated.confidenceExplanations.map(function (item) {
      return row(item.candidateId, item.sourceName + " / " + item.confidenceLabel, item.explanation, item.confidenceLabel === "needs_review" || item.confidenceLabel === "low" ? "warning" : "pass");
    }));
  }
  function sanitizeGlobalShoppingCandidateConfidenceExplainer(explainer) {
    const safe = obj(explainer);
    const evaluated = evaluateGlobalShoppingCandidateConfidence(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      explainerName:EXPLAINER_NAME,
      appVersion:GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION,
      status:status,
      confidenceBoundary:clone(evaluated.confidenceBoundary),
      confidenceExplanations:clone(evaluated.confidenceExplanations),
      confidenceHealth:clone(evaluated.confidenceHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingCandidateConfidenceRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"候选价可信度解释",
        resultLabel:status === "ready" ? "候选价可信度解释已准备" : (status === "needs_review" ? "候选价可信度仍需复核" : "候选价可信度已阻断"),
        caveat:"可信度只解释候选价来源和证据完整性，不代表最低价、官方背书、库存、可订、付款、下单或出票能力。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingCandidateConfidenceExplainer(input) {
    try {
      return sanitizeGlobalShoppingCandidateConfidenceExplainer(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingCandidateConfidenceExplainer({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingCandidateConfidenceExplainerAuditDraft(input) {
    const explainer = buildGlobalShoppingCandidateConfidenceExplainer(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_AUDIT_DRAFT",
      explainerName:EXPLAINER_NAME,
      appVersion:GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION,
      status:explainer.status,
      blockedReasons:explainer.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      sensitiveStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingCandidateConfidenceExplainer = {
    GLOBAL_SHOPPING_CANDIDATE_CONFIDENCE_EXPLAINER_VERSION,
    EXPLAINER_NAME,
    buildGlobalShoppingCandidateConfidenceExplainer,
    evaluateGlobalShoppingCandidateConfidence,
    buildGlobalShoppingCandidateConfidenceRows,
    buildGlobalShoppingCandidateConfidenceExplanations,
    buildGlobalShoppingCandidateConfidenceExplainerAuditDraft,
    sanitizeGlobalShoppingCandidateConfidenceExplainer
  };
})();