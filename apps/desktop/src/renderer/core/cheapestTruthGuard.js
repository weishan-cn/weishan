(function(){
  const CHEAPEST_TRUTH_GUARD_VERSION = "4.0.8";
  const FORBIDDEN_PRICE_RE = /fake|mock|demo|AI\s*估价|estimated\s*price|保证最低价|锁价|最低价已找到/i;

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function priceType(value){
    const raw = text(value || "unknown");
    return ["production_price", "limited_beta_price", "sandbox_test_price", "unknown"].includes(raw) ? raw : "unknown";
  }
  function hasTotalPayable(fare){
    return !!fare && fare.totalPayable !== null && fare.totalPayable !== undefined && Number.isFinite(Number(fare.totalPayable));
  }
  function hasProvider(card){
    return !!card && !!text(card.providerName || card.sourceHostDisplayName || card.sourceUrlHost);
  }
  function hasUpdatedAt(card){
    return !!card && !!text(card.updatedAt) && text(card.updatedAt) !== "待人工核对";
  }
  function passed(value){
    return value === true || value === "pass" || value === "passed" || value === "approved";
  }
  function userFacingCopy(card, fare){
    const safeCard = card || {};
    const safeFare = fare || {};
    return [
      safeCard.title,
      safeCard.subtitle,
      safeCard.priceDisplay,
      safeCard.priceTruthLabel,
      safeCard.cheapestClaimLabel,
      safeCard.recommendationReason,
      safeCard.actionLabel,
      safeFare.priceDisplay,
      safeFare.providerPriceLabel,
      safeFare.finalPageDisclaimer
    ].map(text).join(" ");
  }
  function decideCheapestTruth(input){
    const safe = input && typeof input === "object" ? input : {};
    const card = safe.card || {};
    const fare = safe.fareBreakdown || card.fareBreakdown || {};
    const type = priceType(fare.providerPriceType || card.providerPriceType || safe.providerSourceType || safe.providerPriceType);
    const blockers = [];

    if (type !== "production_price") blockers.push(type === "limited_beta_price" ? "limited_beta_price_not_production" : (type === "sandbox_test_price" ? "sandbox_test_price_not_production" : "provider_price_type_not_production"));
    if (!hasTotalPayable(fare)) blockers.push("missing_totalPayable");
    if (!hasUpdatedAt(card)) blockers.push("missing_updatedAt");
    if (!hasProvider(card)) blockers.push("missing_provider_or_source");
    if (fare.taxFeeCompleteness !== "complete") blockers.push("incomplete_tax_fee");
    if (!passed(safe.sourceLabelDecision)) blockers.push("source_label_not_passed");
    if (!passed(safe.priceIntegrityDecision)) blockers.push("price_integrity_not_passed");
    if (!passed(safe.resultSchemaDecision)) blockers.push("schema_not_passed");
    if (!passed(safe.manualReviewDecision)) blockers.push("manual_review_not_passed");
    if (FORBIDDEN_PRICE_RE.test(userFacingCopy(card, fare))) blockers.push("fake_or_forbidden_price_copy_blocked");

    const canRank = blockers.length === 0;
    const label = canRank ? "生产真实最低价候选" : (type === "limited_beta_price" ? "Limited Beta 只读验证价，不代表真实最低价" : (type === "sandbox_test_price" ? "Sandbox/Test 价，不代表真实最低价" : "暂无生产真实最低价"));
    return clone({
      guardName:"cheapest_truth_guard",
      canClaimCheapest:canRank,
      canParticipateInCheapestRanking:canRank,
      cheapestClaimLabel:canRank ? "可参与生产真实最低价排序" : "不可声称最便宜",
      blockedReason:blockers.join(",") || "",
      userFacingTruthLabel:label,
      requiresProductionProvider:true,
      requiresTotalPayable:true,
      requiresCompleteTaxFee:true,
      providerPriceType:type,
      fakePriceBlockedCount:blockers.includes("fake_or_forbidden_price_copy_blocked") ? 1 : 0,
      sandboxPriceExcludedFromRankingCount:type === "sandbox_test_price" ? 1 : 0,
      limitedBetaExcludedFromRankingCount:type === "limited_beta_price" ? 1 : 0,
      redacted:true
    });
  }
  function buildCheapestTruthGuardAuditDraft(input){
    const decision = input && input.guardName === "cheapest_truth_guard" ? input : decideCheapestTruth(input || {});
    return clone({
      eventType:"CHEAPEST_TRUTH_GUARD_DRAFT",
      canClaimCheapest:decision.canClaimCheapest === true,
      canParticipateInCheapestRanking:decision.canParticipateInCheapestRanking === true,
      providerPriceType:text(decision.providerPriceType || "unknown"),
      blockedReason:text(decision.blockedReason || ""),
      requiresProductionProvider:true,
      requiresTotalPayable:true,
      requiresCompleteTaxFee:true,
      fakePriceBlockedCount:Number(decision.fakePriceBlockedCount || 0),
      sandboxPriceExcludedFromRankingCount:Number(decision.sandboxPriceExcludedFromRankingCount || 0),
      limitedBetaExcludedFromRankingCount:Number(decision.limitedBetaExcludedFromRankingCount || 0),
      redacted:true
    });
  }
  function assertCheapestTruthGuardSafe(decision){
    const value = decision || decideCheapestTruth({});
    if (value.redacted !== true) throw new Error("cheapest truth guard must be redacted");
    if (value.providerPriceType === "limited_beta_price" && (value.canClaimCheapest || value.canParticipateInCheapestRanking)) throw new Error("limited beta price must not claim cheapest");
    if (value.providerPriceType === "sandbox_test_price" && (value.canClaimCheapest || value.canParticipateInCheapestRanking)) throw new Error("sandbox price must not claim cheapest");
    if (/最低价已找到|保证最低价|锁价/.test(value.userFacingTruthLabel || "")) throw new Error("cheapest truth guard uses forbidden label");
    return true;
  }

  window.WeishanCheapestTruthGuard = {
    CHEAPEST_TRUTH_GUARD_VERSION,
    decideCheapestTruth,
    buildCheapestTruthGuardAuditDraft,
    assertCheapestTruthGuardSafe
  };
})();
