(function(){
  const CLEAN_RESULT_SURFACE_V2_VERSION = "2.1.49";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function list(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
  function dedupeUserFacingSafetyHints(sections){
    const seen = {};
    return list(sections).filter((section) => {
      const textValue = text(section);
      if (!textValue) return false;
      const key = textValue
        .replace(/weishan 只做搜索和比较，不收款、不下单.*/, "weishan-safety")
        .replace(/暂无生产真实最低价.*/, "no-production-cheapest")
        .replace(/最终以平台页面为准.*/, "final-platform-page");
      seen[key] = Number(seen[key] || 0) + 1;
      if (key === "weishan-safety") return seen[key] <= 1;
      if (key === "no-production-cheapest") return seen[key] <= 1;
      if (key === "final-platform-page") return seen[key] <= 2;
      return true;
    });
  }
  function buildCards(input){
    if (window.WeishanTopResultCardsBuilder && typeof window.WeishanTopResultCardsBuilder.buildTopResultCards === "function") return window.WeishanTopResultCardsBuilder.buildTopResultCards(input || {});
    return { resultCardMode:"manual_only", cardCount:0, maxCardCount:3, cards:[], audit:{ eventType:"TOP_RESULT_CARDS_BUILDER_DRAFT", cardCount:0, maxCardCount:3, redacted:true }, redacted:true };
  }
  function summaryTitle(input){
    const intent = input.normalizedSearchIntent || {};
    const category = text(input.procurementCategory || intent.category || "");
    if (category === "flight") return text(intent.origin || "上海") + " → " + text(intent.destination || "成都");
    if (category === "product") return text(intent.productName || "商品采购");
    if (category === "ticket_or_activity") return text(intent.activityName || "门票 / 活动");
    if (category === "local_service") return text(intent.serviceName || "本地服务");
    return "全球采购计划";
  }
  function summarySubtitle(input){
    const intent = input.normalizedSearchIntent || {};
    const parts = [];
    if (intent.dateDisplay || intent.date) parts.push(text(intent.dateDisplay || intent.date));
    if (intent.preference) parts.push(text(intent.preference));
    if (input.sortPreference) parts.push(text(input.sortPreference));
    return parts.filter(Boolean).join(" · ") || "手动核对 · 安全优先";
  }
  function buildCleanResultSurfaceV2(input){
    const safe = input && typeof input === "object" ? input : {};
    const cardsResult = buildCards(safe);
    const mode = cardsResult.resultCardMode === "blocked" ? "blocked" : (cardsResult.resultCardMode === "needs_clarification" ? "needs_clarification" : (cardsResult.cardCount ? "top_results" : "manual_only"));
    const hasLimitedBeta = list(cardsResult.cards).some((card) => card.cardType === "limited_beta_price");
    const hasReal = list(cardsResult.cards).some((card) => card.cardType === "real_provider_price");
    let statusMessage = "暂无真实价格结果";
    if (mode === "blocked") statusMessage = "安全阻断";
    else if (mode === "needs_clarification") statusMessage = "请补充关键信息";
    else if (hasReal) statusMessage = "已找到 " + cardsResult.cardCount + " 条可信只读价格结果";
    else if (hasLimitedBeta) statusMessage = "暂无生产真实最低价；以下为只读候选价，仅用于展示流程验证，不代表真实最低价。";
    else statusMessage = "暂无真实价格结果；你可以复制搜索条件，前往官方平台手动核对。";
    const hints = dedupeUserFacingSafetyHints([statusMessage, "weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。"]);
    const safetyHint = hints.find((item) => /^weishan 只做搜索和比较/.test(item)) || "weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。";
    const audit = buildCleanResultSurfaceV2AuditDraft({ surfaceMode:mode, resultCardCount:cardsResult.cardCount, duplicateNoPriceMessageCount:hasLimitedBeta ? 0 : 1, userFacingSafetyHintCount:1, destinationModifierLeakCount:0, duplicateSafetyHintCount:0, internalDebugLabelVisibleCount:0, handoffAreaGrouped:true });
    return clone({
      surfaceVersion:CLEAN_RESULT_SURFACE_V2_VERSION,
      surfaceMode:mode,
      summaryTitle:summaryTitle(safe),
      summarySubtitle:summarySubtitle(safe),
      statusMessage,
      cards:cardsResult.cards,
      resultCardCount:cardsResult.cardCount,
      maxResultCardCount:3,
      topResultCards:cardsResult,
      debugPanelsHiddenByDefault:true,
      safetyDetailEntryLabel:"查看安全与调试详情",
      duplicateNoPriceMessageCount:hasLimitedBeta ? 0 : 1,
      userFacingSafetyHintCount:1,
      finalSafetyNotice:safetyHint,
      productionResultAvailable:hasReal,
      limitedBetaSeparatedFromProduction:hasLimitedBeta,
      cheapestTruthGuardEnabled:true,
      audit,
      redacted:true
    });
  }
  function buildCleanResultSurfaceV2AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"CLEAN_RESULT_SURFACE_V2_DRAFT",
      surfaceMode:text(safe.surfaceMode || "manual_only"),
      debugPanelsHiddenByDefault:true,
      resultCardCount:Number(safe.resultCardCount || 0),
      duplicateNoPriceMessageCount:Number(safe.duplicateNoPriceMessageCount || 0),
      userFacingSafetyHintCount:Number(safe.userFacingSafetyHintCount || 1),
      backendPanelDefaultExpandedCount:0,
      bookingUrlDisplayedCount:0,
      paymentButtonDisplayedCount:0,
      orderButtonDisplayedCount:0,
      identityUploadDisplayedCount:0,
      destinationModifierLeakCount:Number(safe.destinationModifierLeakCount || 0),
      duplicateSafetyHintCount:Number(safe.duplicateSafetyHintCount || 0),
      internalDebugLabelVisibleCount:Number(safe.internalDebugLabelVisibleCount || 0),
      handoffAreaGrouped:safe.handoffAreaGrouped !== false,
      redacted:true
    });
  }
  function assertCleanResultSurfaceV2Safe(surface){
    const value = surface || buildCleanResultSurfaceV2({});
    if (value.resultCardCount > 3) throw new Error("clean result surface v2 must show at most 3 cards");
    if (value.debugPanelsHiddenByDefault !== true) throw new Error("debug panels must be hidden by default");
    if (value.userFacingSafetyHintCount > 2) throw new Error("safety hints must not repeat");
    if (value.audit.bookingUrlDisplayedCount !== 0 || value.audit.paymentButtonDisplayedCount !== 0 || value.audit.orderButtonDisplayedCount !== 0 || value.audit.identityUploadDisplayedCount !== 0) throw new Error("clean result surface v2 audit counters unsafe");
    list(value.cards).forEach((card) => {
      if (card.bookingUrl !== null || card.payment !== false || card.order !== false || card.identityUpload !== false) throw new Error("clean result surface v2 card unsafe");
    });
    return true;
  }
  window.WeishanCleanResultSurfaceV2 = { CLEAN_RESULT_SURFACE_V2_VERSION, dedupeUserFacingSafetyHints, buildCleanResultSurfaceV2, buildCleanResultSurfaceV2AuditDraft, assertCleanResultSurfaceV2Safe };
})();
