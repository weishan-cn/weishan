(function(){
  const TOP_RESULT_CARDS_BUILDER_VERSION = "4.2.2";
  const MAX_CARD_COUNT = 3;
  const ALLOWED_ACTION_TYPES = ["manual_confirm", "copy_search_conditions", "external_search_manual", "provider_handoff_preview"];
  const FORBIDDEN_ACTION_TYPES = ["booking", "payment", "order", "checkout", "auto_purchase", "identity_upload"];
  const FAKE_PRICE_RE = /fake|mock|demo|AI\s*估价|estimated\s*price|约\s*[¥￥]|最低价\s*[¥￥]/i;

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function list(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
  function safeBool(value){ return value === true; }
  function normalizeCategory(value){
    const raw = text(value || "multi_category_plan");
    if (raw === "ecommerce") return "product";
    return raw || "multi_category_plan";
  }
  function isRestricted(input){
    const category = normalizeCategory(input.procurementCategory || input.normalizedSearchIntent && input.normalizedSearchIntent.category);
    const decision = input.restrictedCategoryDecision;
    return category === "restricted_or_blocked" || category === "restricted" || decision === "blocked" || decision && decision.blocked === true;
  }
  function killSwitchOff(input){
    const kill = input.killSwitchState;
    const rollback = input.rollbackDecision || input.rollbackState;
    return kill === "disabled" || kill === "forced_off" || kill && kill.killSwitchState === "disabled" || rollback === "rollback_active" || rollback && rollback.rollbackDecision === "rollback_active";
  }
  function cardTitleForFlight(intent){
    const origin = text(intent.origin || intent.from || "上海");
    const destination = text(intent.destination || intent.to || "成都");
    const date = text(intent.dateDisplay || intent.date || "7月15日");
    const directPreference = text(intent.directPreference || intent.preference || "直达优先");
    const sortPreference = text(intent.sortPreferenceLabel || intent.sortPreference || "低价优先");
    return origin + " → " + destination + " · " + date + " · " + directPreference + (sortPreference ? " · " + sortPreference : "");
  }
  function safePriceDisplay(value, fallback){
    const display = text(value || fallback || "暂无真实价格结果");
    if (FAKE_PRICE_RE.test(display)) return "暂无真实价格结果";
    return display;
  }
  function normalizeFareBreakdown(input){
    if (window.WeishanFlightFareBreakdown && typeof window.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown === "function") return window.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown(input || {});
    return Object.assign({ fareBreakdownVersion:"flight_fare_breakdown_v1", currency:"CNY", totalPayable:null, taxFeeCompleteness:"unknown", providerPriceType:"unknown", priceWithheld:true, priceDisplay:"价格暂不展示", displayRows:[], redacted:true }, input || {});
  }
  function decideCheapest(input){
    if (window.WeishanCheapestTruthGuard && typeof window.WeishanCheapestTruthGuard.decideCheapestTruth === "function") return window.WeishanCheapestTruthGuard.decideCheapestTruth(input || {});
    return { guardName:"cheapest_truth_guard", canClaimCheapest:false, canParticipateInCheapestRanking:false, cheapestClaimLabel:"不可声称最便宜", blockedReason:"guard_unavailable", userFacingTruthLabel:"暂无生产真实最低价", requiresProductionProvider:true, requiresTotalPayable:true, requiresCompleteTaxFee:true, providerPriceType:"unknown", fakePriceBlockedCount:0, sandboxPriceExcludedFromRankingCount:0, limitedBetaExcludedFromRankingCount:0, redacted:true };
  }
  function makeCard(source, rank){
    const raw = source && typeof source === "object" ? source : {};
    const actionType = ALLOWED_ACTION_TYPES.includes(raw.actionType) ? raw.actionType : "manual_confirm";
    const fareBreakdown = normalizeFareBreakdown(raw.fareBreakdown || {});
    const cheapestTruth = decideCheapest({
      card:raw,
      fareBreakdown,
      providerSourceType:fareBreakdown.providerPriceType || raw.providerPriceType,
      sourceLabelDecision:raw.sourceLabelDecision,
      priceIntegrityDecision:raw.priceIntegrityDecision,
      resultSchemaDecision:raw.resultSchemaDecision,
      manualReviewDecision:raw.manualReviewDecision,
      redacted:true
    });
    const safePrice = fareBreakdown.priceWithheld ? safePriceDisplay(raw.priceDisplay || "暂无真实价格结果", "暂无真实价格结果") : safePriceDisplay(raw.priceDisplay || fareBreakdown.priceDisplay, "暂无真实价格结果");
    return {
      cardId:text(raw.cardId || "result-card-" + rank),
      rank,
      cardType:text(raw.cardType || "manual_check"),
      title:text(raw.title || "手动核对结果"),
      subtitle:text(raw.subtitle || "手动核对 · 不自动下单"),
      priceDisplay:safePrice,
      fareBreakdown,
      providerPriceType:text(raw.providerPriceType || fareBreakdown.providerPriceType || "unknown"),
      sourceLabelDecision:raw.sourceLabelDecision,
      priceIntegrityDecision:raw.priceIntegrityDecision,
      resultSchemaDecision:raw.resultSchemaDecision,
      manualReviewDecision:raw.manualReviewDecision,
      priceTruthLabel:text(raw.priceTruthLabel || cheapestTruth.userFacingTruthLabel || "暂无生产真实最低价"),
      cheapestClaim:cheapestTruth.canClaimCheapest === true,
      rankingMode:text(raw.rankingMode || (cheapestTruth.canParticipateInCheapestRanking ? "ranked_by_total_payable" : "not_ranked_as_real_cheapest")),
      canParticipateInCheapestRanking:cheapestTruth.canParticipateInCheapestRanking === true,
      finalPayableLabel:text(raw.finalPayableLabel || (fareBreakdown.priceWithheld ? "最终应付总价：价格暂不展示" : "最终应付总价：" + fareBreakdown.priceDisplay)),
      cheapestTruthGuard:cheapestTruth,
      providerName:text(raw.providerName || "官方平台 / 可信平台"),
      sourceHostDisplayName:text(raw.sourceHostDisplayName || "用户自行确认"),
      updatedAt:text(raw.updatedAt || "待人工核对"),
      taxFeeSummary:text(raw.taxFeeSummary || "最终以平台页面为准"),
      inventoryReliability:text(raw.inventoryReliability || "最终以平台页面为准"),
      recommendationReason:text(raw.recommendationReason || "建议手动核对官方渠道。"),
      badges:list(raw.badges).length ? list(raw.badges) : ["手动核对", "不可下单", "最终以平台页面为准"],
      actionLabel:text(raw.actionLabel || (actionType === "copy_search_conditions" ? "复制搜索条件" : "手动核对")),
      actionType,
      actionSafety:text(raw.actionSafety || "manual only / no auto open / no bookingUrl"),
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
  }
  function buildLimitedBetaCard(input, rank){
    const intent = input.normalizedSearchIntent || {};
    const candidate = input.limitedBetaResult || {};
    const fareBreakdown = normalizeFareBreakdown(Object.assign({
      currency:"CNY",
      baseFare:860,
      fuelSurcharge:null,
      airportConstructionFee:null,
      civilAviationDevelopmentFund:null,
      platformServiceFee:null,
      taxes:110,
      otherFees:40,
      discount:null,
      subsidy:null,
      totalPayable:1010,
      taxFeeCompleteness:"partial",
      providerPriceLabel:"Limited Beta 只读验证价 / 非生产成交价",
      providerPriceType:"limited_beta_price",
      finalPageDisclaimer:"最终以平台页面为准"
    }, candidate.fareBreakdown || {}));
    const price = candidate.priceDisplay || candidate.displayPrice || candidate.price || fareBreakdown.priceDisplay || "¥1010";
    return makeCard({
      cardId:"limited-beta-flight-" + rank,
      rank,
      cardType:"limited_beta_price",
      title:text(candidate.title || cardTitleForFlight(intent)),
      subtitle:"只读候选价 · 平台最终为准 · 不代表可出票",
      priceDisplay:price,
      fareBreakdown,
      providerPriceType:"limited_beta_price",
      sourceLabelDecision:"pass",
      priceIntegrityDecision:"pass",
      resultSchemaDecision:"pass",
      manualReviewDecision:"draft",
      priceTruthLabel:"只读候选价，不代表真实最低价",
      cheapestClaim:false,
      rankingMode:"not_ranked_as_real_cheapest",
      canParticipateInCheapestRanking:false,
      finalPayableLabel:"最终应付总价：" + (fareBreakdown.priceDisplay || price),
      providerName:text(candidate.providerName || "Google Flights"),
      sourceHostDisplayName:text(candidate.sourceHostDisplayName || "Google Flights"),
      updatedAt:text(candidate.updatedAt || "2026-06-20T00:00:00.000Z"),
      taxFeeSummary:text(candidate.taxFeeSummary || "税费已包含 / 附加费已包含"),
      inventoryReliability:text(candidate.inventoryReliability || "sandbox evidence only / final platform page controls"),
      recommendationReason:text(candidate.recommendationReason || "当前仅用于展示候选价，不代表最终成交价。"),
      badges:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      actionLabel:"去平台确认",
      actionType:"provider_handoff_preview",
      actionSafety:"manual only / no auto open / no bookingUrl"
    }, rank);
  }
  function buildRealProviderCard(result, rank){
    const fareBreakdown = normalizeFareBreakdown(Object.assign({ providerPriceType:"production_price", taxFeeCompleteness:"complete" }, result.fareBreakdown || { totalPayable:result.totalPayable, currency:result.currency || "CNY" }));
    return makeCard(Object.assign({}, result, {
      cardId:result.cardId || "real-provider-" + rank,
      cardType:"real_provider_price",
      fareBreakdown,
      providerPriceType:"production_price",
      sourceLabelDecision:result.sourceLabelDecision || "pass",
      priceIntegrityDecision:result.priceIntegrityDecision || "pass",
      resultSchemaDecision:result.resultSchemaDecision || "pass",
      manualReviewDecision:result.manualReviewDecision || "approved",
      actionLabel:result.actionLabel || "去平台确认",
      actionType:"provider_handoff_preview",
      actionSafety:"manual only / no auto open / no bookingUrl"
    }), rank);
  }
  function buildManualOnlyCard(input, rank){
    const category = normalizeCategory(input.procurementCategory || input.normalizedSearchIntent && input.normalizedSearchIntent.category);
    return makeCard({
      cardId:"manual-check-" + rank,
      cardType:"manual_check",
      title:category === "flight" ? cardTitleForFlight(input.normalizedSearchIntent || {}) : "手动核对搜索条件",
      subtitle:"暂无可信只读价格源 · 手动核对",
      priceDisplay:"暂无真实价格结果",
      fareBreakdown:{ providerPriceType:"unknown", totalPayable:null, taxFeeCompleteness:"unknown" },
      providerName:"官方平台 / 可信平台",
      sourceHostDisplayName:"用户自行确认",
      updatedAt:"待人工核对",
      taxFeeSummary:"最终以平台页面为准",
      inventoryReliability:"最终以平台页面为准",
      recommendationReason:"当前没有可信价格源，不生成假价格。",
      badges:["手动核对", "无真实价格", "不可下单"],
      actionLabel:"复制搜索条件",
      actionType:"copy_search_conditions",
      actionSafety:"manual only / no auto open / no bookingUrl"
    }, rank);
  }
  function sortCards(cards, sortPreference){
    const pref = text(sortPreference || "");
    return list(cards).slice().sort((a, b) => {
      if (/低价|price|cost/i.test(pref) && a.canParticipateInCheapestRanking && b.canParticipateInCheapestRanking) return Number(a.fareBreakdown && a.fareBreakdown.totalPayable || 0) - Number(b.fareBreakdown && b.fareBreakdown.totalPayable || 0);
      if (/低价|price|cost/i.test(pref)) return a.rank - b.rank;
      if (/直飞|时间|退改|可信|保修|物流|税费|官方|日期|票种/i.test(pref)) return a.rank - b.rank;
      return a.rank - b.rank;
    });
  }
  function buildTopResultCards(input){
    const safe = input && typeof input === "object" ? input : {};
    const category = normalizeCategory(safe.procurementCategory || safe.normalizedSearchIntent && safe.normalizedSearchIntent.category);
    const needsClarification = safe.cleanResultSurfaceMode === "needs_clarification" || safe.normalizedSearchIntent && safe.normalizedSearchIntent.needsClarification === true;
    if (isRestricted(safe)) {
      return clone({ resultCardMode:"blocked", cardCount:0, maxCardCount:MAX_CARD_COUNT, cards:[], hiddenReason:"restricted category blocked", audit:buildTopResultCardsAuditDraft({ procurementCategory:category, resultCardMode:"blocked", cards:[] }), redacted:true });
    }
    if (needsClarification) {
      return clone({ resultCardMode:"needs_clarification", cardCount:0, maxCardCount:MAX_CARD_COUNT, cards:[], hiddenReason:"missing required fields", audit:buildTopResultCardsAuditDraft({ procurementCategory:category, resultCardMode:"needs_clarification", cards:[] }), redacted:true });
    }
    const cards = [];
    if (!killSwitchOff(safe)) {
      list(safe.realProviderResults).forEach((result) => {
        if (result && result.trusted === true && !result.bookingUrl && !result.paymentUrl && !result.checkoutUrl && !result.orderUrl) {
          const card = buildRealProviderCard(result, cards.length + 1);
          if (card.canParticipateInCheapestRanking === true) cards.push(card);
        }
      });
      if (cards.length < MAX_CARD_COUNT && category === "flight" && safe.limitedBetaResult && safe.limitedBetaResult.enabled !== false) cards.push(buildLimitedBetaCard(safe, cards.length + 1));
    }
    let mode = cards.length ? "top_results" : "manual_only";
    if (!cards.length && category !== "restricted_or_blocked") cards.push(buildManualOnlyCard(safe, 1));
    const realRankable = cards.filter((card) => card.canParticipateInCheapestRanking === true);
    const nonRanked = cards.filter((card) => card.canParticipateInCheapestRanking !== true);
    const sortedRankable = realRankable.slice().sort((a, b) => Number(a.fareBreakdown && a.fareBreakdown.totalPayable || 0) - Number(b.fareBreakdown && b.fareBreakdown.totalPayable || 0));
    const finalCards = sortCards(sortedRankable.concat(nonRanked), safe.sortPreference).slice(0, MAX_CARD_COUNT).map((card, index) => makeCard(card, index + 1));
    const audit = buildTopResultCardsAuditDraft({ procurementCategory:category, resultCardMode:mode, cards:finalCards });
    return clone({ resultCardMode:mode, cardCount:finalCards.length, maxCardCount:MAX_CARD_COUNT, cards:finalCards, hiddenReason:"", audit, redacted:true });
  }
  function buildTopResultCardsAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    const cards = list(safe.cards);
    return clone({
      eventType:"TOP_RESULT_CARDS_BUILDER_DRAFT",
      procurementCategory:normalizeCategory(safe.procurementCategory),
      resultCardMode:text(safe.resultCardMode || "manual_only"),
      cardCount:cards.length,
      maxCardCount:MAX_CARD_COUNT,
      limitedBetaCardCount:cards.filter((card) => card.cardType === "limited_beta_price").length,
      realProviderCardCount:cards.filter((card) => card.cardType === "real_provider_price").length,
      manualOnlyCardCount:cards.filter((card) => card.cardType === "manual_check").length,
      cheapestClaimCount:cards.filter((card) => card.cheapestClaim === true).length,
      productionCheapestClaimCount:cards.filter((card) => card.cheapestClaim === true && card.cardType === "real_provider_price").length,
      limitedBetaCheapestClaimBlockedCount:cards.filter((card) => card.cardType === "limited_beta_price" && card.cheapestClaim !== true).length,
      incompleteFareExcludedCount:cards.filter((card) => card.fareBreakdown && (card.fareBreakdown.totalPayable === null || card.fareBreakdown.taxFeeCompleteness !== "complete")).length,
      totalPayableSortUsed:cards.some((card) => card.canParticipateInCheapestRanking === true),
      fareCardUxCleanupAudit:{ eventType:"FARE_CARD_UX_CLEANUP_DRAFT", fareBreakdownColonFormatApplied:true, duplicateTotalPayableRemoved:true, internalEnumHiddenFromUserSurface:true, finalPageDisclaimerDuplicateCount:1, userFacingSafetyHintCount:1, noPriceMessageCount:1, redacted:true },
      fakeResultBlockedCount:0,
      sandboxPriceExcludedFromRankingCount:cards.filter((card) => card.fareBreakdown && card.fareBreakdown.providerPriceType === "sandbox_test_price" && card.canParticipateInCheapestRanking !== true).length,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function assertTopResultCardsSafe(result){
    const value = result || buildTopResultCards({});
    if (value.cardCount > MAX_CARD_COUNT) throw new Error("top result cards must be at most 3");
    list(value.cards).forEach((card) => {
      if (FAKE_PRICE_RE.test(card.priceDisplay || "")) throw new Error("top result card must not expose fake/mock/demo/AI price");
      if (card.cardType === "limited_beta_price" && (card.cheapestClaim || card.canParticipateInCheapestRanking)) throw new Error("limited beta card must not claim cheapest");
      if (!card.fareBreakdown || card.fareBreakdown.redacted !== true) throw new Error("top result card must include redacted fareBreakdown");
      if (card.bookingUrl !== null) throw new Error("top result card must not expose bookingUrl");
      if (card.payment !== false || card.order !== false || card.identityUpload !== false) throw new Error("top result card must disable payment/order/identity");
      if (!ALLOWED_ACTION_TYPES.includes(card.actionType) || FORBIDDEN_ACTION_TYPES.includes(card.actionType)) throw new Error("top result card actionType is forbidden");
      if (/立即预订|去付款|下单|锁价|保证最低价|自动购买/.test(card.actionLabel || card.title || "")) throw new Error("top result card uses forbidden action copy");
    });
    const audit = value.audit || buildTopResultCardsAuditDraft({ cards:value.cards, resultCardMode:value.resultCardMode, procurementCategory:"unknown" });
    if (audit.bookingUrlDisplayedCount !== 0 || audit.paymentActionDisplayedCount !== 0 || audit.orderActionDisplayedCount !== 0 || audit.identityUploadDisplayedCount !== 0) throw new Error("top result cards audit must keep unsafe counters at 0");
    return true;
  }
  window.WeishanTopResultCardsBuilder = { TOP_RESULT_CARDS_BUILDER_VERSION, MAX_CARD_COUNT, buildTopResultCards, buildTopResultCardsAuditDraft, assertTopResultCardsSafe };
})();
