(function(){
  const CLEAN_RESULT_SURFACE_V1_VERSION = "2.1.39";
  const ALLOWED_ACTIONS = ["manual_confirm", "copy_search_conditions", "external_search_manual"];

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function list(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
  function text(value){ return String(value || "").trim(); }

  function safeCard(card, rank){
    const source = card && typeof card === "object" ? card : {};
    const actionType = ALLOWED_ACTIONS.includes(source.actionType) ? source.actionType : "manual_confirm";
    return {
      cardType:source.cardType || "offline_manual_result",
      rank:rank,
      title:text(source.title || "手动核对结果"),
      priceDisplay:text(source.priceDisplay || "暂无真实价格结果"),
      providerName:text(source.providerName || "手动核对"),
      sourceHostDisplayName:text(source.sourceHostDisplayName || "官方平台或可信平台"),
      updatedAt:text(source.updatedAt || "待人工核对"),
      taxFeeSummary:text(source.taxFeeSummary || "以平台页面为准"),
      inventoryReliability:text(source.inventoryReliability || "以平台页面为准"),
      recommendationReason:text(source.recommendationReason || "建议人工核对官方渠道"),
      actionLabel:text(source.actionLabel || "手动核对"),
      actionType,
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
  }

  function defaultManualCard(category){
    return safeCard({
      cardType:"manual_check",
      title:category === "flight" ? "机票手动核对" : "手动核对",
      priceDisplay:"暂无真实价格结果",
      providerName:"官方平台 / 可信平台",
      sourceHostDisplayName:"用户自行确认",
      updatedAt:"待人工核对",
      recommendationReason:"当前仅整理搜索条件，等待可信只读价格源。",
      actionLabel:"复制搜索条件",
      actionType:"copy_search_conditions"
    }, 1);
  }

  function buildCleanResultSurfaceV1(input){
    const safeInput = input && typeof input === "object" ? input : {};
    const brain = safeInput.brainDecision || {};
    const category = text(brain.procurementCategory || safeInput.procurementCategory || "multi_category_plan");
    const killOff = safeInput.killSwitchState === "disabled" || safeInput.killSwitchState === "forced_off" || safeInput.rollbackState === "rollback_active";
    const blocked = category === "restricted_or_blocked" || brain.intentStatus === "blocked" || safeInput.restrictedCategoryDecision === "blocked";
    const needsClarification = brain.intentStatus === "needs_clarification";
    let resultSurfaceMode = "no_real_price";
    let cards = [];
    let noPriceMessage = "暂无真实价格结果";
    if (blocked) {
      resultSurfaceMode = "blocked";
      noPriceMessage = "安全阻断";
    } else if (needsClarification) {
      resultSurfaceMode = "needs_clarification";
      noPriceMessage = "请先补充关键信息";
    } else if (!killOff && category === "flight" && safeInput.limitedBetaAvailable === true) {
      resultSurfaceMode = "ready_with_results";
      noPriceMessage = "暂无生产真实价格结果";
      cards = [safeCard({
        cardType:"limited_beta_readonly_price",
        title:"Limited Beta · 只读验证价",
        priceDisplay:text(safeInput.limitedBetaPriceDisplay || "Limited Beta 只读验证价"),
        providerName:"Flight Provider Sandbox",
        sourceHostDisplayName:"Provider Sandbox",
        updatedAt:text(safeInput.updatedAt || "只读验证中"),
        taxFeeSummary:"税费与附加费以平台页面为准",
        inventoryReliability:"余票可靠性以平台页面为准",
        recommendationReason:"仅用于只读展示验证，不锁价、不保证最低价。",
        actionLabel:"手动核对",
        actionType:"manual_confirm"
      }, 1)];
    } else {
      resultSurfaceMode = "no_real_price";
      cards = [defaultManualCard(category)];
    }
    cards = cards.slice(0, 3).map((card, index) => safeCard(card, index + 1));
    if (resultSurfaceMode === "blocked" || resultSurfaceMode === "needs_clarification") cards = [];
    return clone({
      surfaceVersion:CLEAN_RESULT_SURFACE_V1_VERSION,
      resultSurfaceMode,
      resultCards:cards,
      resultCardCount:cards.length,
      maxResultCardCount:3,
      noPriceMessage,
      duplicateNoPriceMessageCount:1,
      debugPanelsHiddenByDefault:true,
      limitedBetaSeparatedFromProduction:true,
      finalSafetyNotice:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。",
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }

  function buildCleanResultSurfaceV1AuditDraft(input){
    const surface = buildCleanResultSurfaceV1(input || {});
    return clone({
      eventType:"CLEAN_RESULT_SURFACE_V1_DRAFT",
      resultSurfaceMode:surface.resultSurfaceMode,
      resultCardCount:surface.resultCardCount,
      maxResultCardCount:3,
      debugPanelsHiddenByDefault:true,
      duplicateNoPriceMessageCount:surface.duplicateNoPriceMessageCount,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }

  function assertCleanResultSurfaceV1Safe(surface){
    const value = surface || buildCleanResultSurfaceV1({});
    if (value.resultCardCount > 3) throw new Error("clean result surface must show at most 3 cards");
    if (value.debugPanelsHiddenByDefault !== true) throw new Error("debug panels must be hidden by default");
    if (value.bookingUrlDisplayedCount !== 0 || value.paymentActionDisplayedCount !== 0 || value.orderActionDisplayedCount !== 0 || value.identityUploadDisplayedCount !== 0) throw new Error("clean result surface must not expose transactional actions");
    list(value.resultCards).forEach((card) => {
      if (card.bookingUrl !== null) throw new Error("clean result card must not expose bookingUrl");
      if (card.payment !== false || card.order !== false || card.identityUpload !== false) throw new Error("clean result card must disable payment/order/identity upload");
      if (!ALLOWED_ACTIONS.includes(card.actionType)) throw new Error("clean result card action type not allowed");
      if (/立即预订|去付款|下单|锁价|自动购买/.test(card.actionLabel || "")) throw new Error("clean result card action label not allowed");
    });
    return true;
  }

  window.WeishanCleanResultSurfaceV1 = {
    CLEAN_RESULT_SURFACE_V1_VERSION,
    buildCleanResultSurfaceV1,
    buildCleanResultSurfaceV1AuditDraft,
    assertCleanResultSurfaceV1Safe
  };
})();
