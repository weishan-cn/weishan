;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION = "2.2.8";
  const SCORE_NAME = "global_shopping_read_only_source_trust_score_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedType(value) {
    const type = text(value || "unknown");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(type) ? type : "unknown";
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
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
  function scoreBase(type) {
    if (type === "official") return 90;
    if (type === "authorized") return 82;
    if (type === "partner") return 70;
    if (type === "affiliate") return 64;
    if (type === "aggregator") return 52;
    if (type === "fixture") return 48;
    return 36;
  }
  function labelFor(score, type) {
    if (type === "aggregator") return "needs_review";
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    if (score >= 45) return "low";
    return "needs_review";
  }
  function trustLevel(type) {
    if (type === "official") return "official";
    if (type === "authorized") return "authorized";
    if (type === "partner") return "partner";
    if (type === "affiliate") return "affiliate";
    if (type === "aggregator") return "aggregator";
    if (type === "fixture") return "fixture";
    return "unknown";
  }
  function collectSources(input) {
    const safe = obj(input);
    if (toArray(obj(safe.dryRunProviderResponseNormalizerSummary).normalizedSourceInputs).length) return toArray(obj(safe.dryRunProviderResponseNormalizerSummary).normalizedSourceInputs);
    return toArray(safe.sources);
  }

  function evaluateGlobalShoppingReadOnlySourceTrust(input) {
    const safe = obj(input);
    const sources = collectSources(safe);
    const blockedReasons = [];
    if (safe.claimsOfficialEndorsement === true) blockedReasons.push("official_endorsement_claim_detected");
    if (safe.claimsLowestPriceGuarantee === true || safe.lowestPriceAlwaysBest === true) blockedReasons.push("lowest_price_claim_detected");
    if (safe.claimsAvailabilityGuarantee === true) blockedReasons.push("availability_claim_detected");
    if (safe.realProviderEnabled === true || safe.networkEnabled === true || safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("real_provider_or_transaction_detected");
    const trustScores = toArray(sources).map(function (item) {
      const safeItem = obj(item);
      const type = allowedType(safeItem.sourceType || safeItem.providerType);
      const baseTrustScore = scoreBase(type);
      const evidenceScore = safeItem.lastCheckedAt ? 8 : 2;
      const priceCompletenessScore = safeItem.basePrice != null ? 6 : -4;
      const providerSafetyScore = safeItem.redacted === false ? -20 : 6;
      const disclosurePenalty = type === "partner" || type === "affiliate" ? 6 : 0;
      const riskPenalty = type === "aggregator" ? 10 : (type === "unknown" ? 8 : 0);
      const finalTrustScore = Math.max(0, Math.min(100, baseTrustScore + evidenceScore + priceCompletenessScore + providerSafetyScore - disclosurePenalty - riskPenalty));
      return {
        sourceId:text(safeItem.sourceId || safeItem.providerId || safeItem.sourceName || "source"),
        sourceName:text(safeItem.sourceName || safeItem.providerName || "Source"),
        sourceType:type,
        sourceTrustLevel:trustLevel(type),
        baseTrustScore:baseTrustScore,
        evidenceScore:evidenceScore,
        priceCompletenessScore:priceCompletenessScore,
        providerSafetyScore:providerSafetyScore,
        disclosurePenalty:disclosurePenalty,
        riskPenalty:riskPenalty,
        finalTrustScore:finalTrustScore,
        trustLabel:labelFor(finalTrustScore, type),
        caveat:type === "official" ? "官方来源权重更高，但不代表官方背书或可下单能力。" : (type === "aggregator" ? "聚合来源需要复核，低价不自动视为最佳。" : "来源可信度只用于排序和复核，不代表官方背书或最低价。")
      };
    }).sort(function (a, b) { return b.finalTrustScore - a.finalTrustScore; });
    const officialBest = trustScores.filter(function (item) { return item.sourceType === "official"; })[0];
    const fixtureBest = trustScores.filter(function (item) { return item.sourceType === "fixture"; })[0];
    const trustHealth = {
      hasSources:trustScores.length > 0,
      hasOfficialWeighting:trustScores.every(function (item) { return item.sourceType !== "official" || item.baseTrustScore >= 90; }),
      hasDisclosurePenalty:trustScores.some(function (item) { return item.sourceType === "partner" || item.sourceType === "affiliate"; }) ? trustScores.some(function (item) { return (item.sourceType === "partner" || item.sourceType === "affiliate") && item.disclosurePenalty > 0; }) : true,
      hasRiskPenalty:trustScores.some(function (item) { return item.sourceType === "aggregator"; }) ? trustScores.some(function (item) { return item.sourceType === "aggregator" && item.riskPenalty > 0; }) : true,
      doesNotTreatLowestPriceAsBest:safe.lowestPriceAlwaysBest !== true,
      doesNotOverrideOfficialWithUserOrFixture:!(officialBest && fixtureBest && fixtureBest.finalTrustScore > officialBest.finalTrustScore),
      doesNotImplyOfficialEndorsement:safe.claimsOfficialEndorsement !== true,
      doesNotImplyLowestPrice:safe.claimsLowestPriceGuarantee !== true,
      doesNotImplyAvailability:safe.claimsAvailabilityGuarantee !== true
    };
    if (!trustHealth.doesNotOverrideOfficialWithUserOrFixture) blockedReasons.push("fixture_overrides_official_detected");
    return clone({
      trustScores:trustScores,
      trustHealth:trustHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (trustHealth.hasSources ? "ready" : "needs_review"),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySourceTrustRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlySourceTrust(input || {});
    return clone(toArray(evaluation.trustScores).map(function (item) {
      return row(item.sourceId, item.sourceName, item.sourceType + " / " + item.trustLabel + " / " + item.finalTrustScore, item.trustLabel === "high" ? "pass" : (item.trustLabel === "needs_review" ? "warning" : "pass"));
    }));
  }

  function sanitizeGlobalShoppingReadOnlySourceTrustScore(score) {
    const safe = obj(score);
    const evaluation = evaluateGlobalShoppingReadOnlySourceTrust(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      scoreName:SCORE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION,
      status:status,
      trustScores:clone(evaluation.trustScores),
      trustHealth:clone(evaluation.trustHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingReadOnlySourceTrustRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"只读来源可信度评分",
        resultLabel:status === "ready" ? "来源可信度评分已准备" : (status === "needs_review" ? "来源可信度仍需复核" : "来源可信度已阻断"),
        caveat:"来源可信度只用于排序和复核，不代表官方背书、最低价、库存、可订或可下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySourceTrustScore(input) {
    try {
      return sanitizeGlobalShoppingReadOnlySourceTrustScore(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlySourceTrustScore({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingReadOnlySourceTrustScoreAuditDraft(input) {
    const score = buildGlobalShoppingReadOnlySourceTrustScore(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_AUDIT_DRAFT",
      scoreName:SCORE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION,
      status:score.status,
      blockedReasons:score.blockedReasons,
      trustScoreCount:toArray(score.trustScores).length,
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
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingReadOnlySourceTrustScore = {
    GLOBAL_SHOPPING_READ_ONLY_SOURCE_TRUST_SCORE_VERSION,
    SCORE_NAME,
    buildGlobalShoppingReadOnlySourceTrustScore,
    evaluateGlobalShoppingReadOnlySourceTrust,
    buildGlobalShoppingReadOnlySourceTrustRows,
    buildGlobalShoppingReadOnlySourceTrustScoreAuditDraft,
    sanitizeGlobalShoppingReadOnlySourceTrustScore
  };
})();
