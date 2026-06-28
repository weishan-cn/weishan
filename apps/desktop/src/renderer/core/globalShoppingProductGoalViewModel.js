;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION = "2.1.89";
  const VIEW_MODEL_NAME = "global_shopping_product_goal_view_model_v1";
  const CAVEAT = "Weishan 帮用户找价、比价、归一化和跳转平台；用户需在平台自行完成下单。Weishan 不处理付款、下单或出票。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function productGoalSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.globalShoppingProductGoalSummary)).length) return obj(safe.globalShoppingProductGoalSummary);
    const charterApi = api("WeishanGlobalShoppingProductGoalCharter");
    return typeof charterApi.buildGlobalShoppingProductGoalCharter === "function"
      ? charterApi.buildGlobalShoppingProductGoalCharter(safe)
      : {};
  }
  function jumpBoundarySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.jumpToPlatformBoundarySummary)).length) return obj(safe.jumpToPlatformBoundarySummary);
    const boundaryApi = api("WeishanGlobalShoppingJumpToPlatformBoundary");
    return typeof boundaryApi.buildGlobalShoppingJumpToPlatformBoundary === "function"
      ? boundaryApi.buildGlobalShoppingJumpToPlatformBoundary(safe)
      : {};
  }
  function priceSourceNormalizationSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.priceSourceNormalizationSummary)).length) return obj(safe.priceSourceNormalizationSummary);
    const normalizerApi = api("WeishanGlobalShoppingPriceSourceNormalizer");
    return typeof normalizerApi.buildGlobalShoppingPriceSourceNormalizer === "function"
      ? normalizerApi.buildGlobalShoppingPriceSourceNormalizer(safe)
      : {};
  }
  function officialPriceAnchorSummary(input, normalizer) {
    const safe = obj(input);
    if (Object.keys(obj(safe.officialPriceAnchorSummary)).length) return obj(safe.officialPriceAnchorSummary);
    const anchorApi = api("WeishanGlobalShoppingOfficialPriceAnchorSlot");
    return typeof anchorApi.buildGlobalShoppingOfficialPriceAnchorSlot === "function"
      ? anchorApi.buildGlobalShoppingOfficialPriceAnchorSlot(Object.assign({}, safe, { normalizedCandidates:normalizer && normalizer.normalizedCandidates || safe.normalizedCandidates || [] }))
      : {};
  }
  function priceCandidateDisplaySummary(input, normalizer, anchor) {
    const safe = obj(input);
    if (Object.keys(obj(safe.priceCandidateDisplaySummary)).length) return obj(safe.priceCandidateDisplaySummary);
    const boardApi = api("WeishanGlobalShoppingPriceCandidateDisplayBoard");
    return typeof boardApi.buildGlobalShoppingPriceCandidateDisplayBoard === "function"
      ? boardApi.buildGlobalShoppingPriceCandidateDisplayBoard(Object.assign({}, safe, { priceSourceNormalizationSummary:normalizer, officialPriceAnchorSummary:anchor }))
      : {};
  }
  function buildGlobalShoppingProductGoalCards(input) {
    const goal = productGoalSummary(input || {});
    const boundary = jumpBoundarySummary(input || {});
    return clone([
      card("trusted_price", "可信候选价格", goal.productGoals && goal.productGoals.findTrustedCandidatePrices ? "已对齐" : "仍需复核"),
      card("official_anchor", "官方价格锚点", goal.productGoals && goal.productGoals.showOfficialPriceAnchor ? "已对齐" : "仍需复核"),
      card("covered_platforms", "合法平台候选价", goal.productGoals && goal.productGoals.showMultipleLegalPlatformCandidates ? "已对齐" : "仍需复核"),
      card("jump_boundary", "平台自行下单", boundary.userFacingSummary && boundary.userFacingSummary.resultLabel || "跳转边界仍需复核"),
      card("price_normalization", "价格源归一化层", priceSourceNormalizationSummary(input || {}).userFacingSummary && priceSourceNormalizationSummary(input || {}).userFacingSummary.resultLabel || "价格归一化仍需复核"),
      card("price_display_board", "全球购价格候选展示", priceCandidateDisplaySummary(input || {}, priceSourceNormalizationSummary(input || {}), officialPriceAnchorSummary(input || {}, priceSourceNormalizationSummary(input || {}))).title || "全球购价格候选展示")
    ]);
  }
  function buildGlobalShoppingProductGoalRows(input) {
    const goal = productGoalSummary(input || {});
    return clone(toArray(goal.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingJumpBoundaryRowsForView(input) {
    const boundary = jumpBoundarySummary(input || {});
    return clone(toArray(boundary.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildForbiddenCopyRows(goal) {
    const forbidden = obj(goal.forbiddenPromises);
    return clone([
      row("no_lowest_claim", "禁止最低价相关承诺", forbidden.noWholeNetworkLowestClaim ? "已阻断" : "存在风险", forbidden.noWholeNetworkLowestClaim ? "pass" : "blocked"),
      row("no_lowest_guarantee", "禁止最低价保证", forbidden.noLowestPriceGuarantee ? "已阻断" : "存在风险", forbidden.noLowestPriceGuarantee ? "pass" : "blocked"),
      row("no_locked_price", "禁止锁价承诺", forbidden.noLockedPriceClaim ? "已阻断" : "存在风险", forbidden.noLockedPriceClaim ? "pass" : "blocked"),
      row("no_one_click_order", "禁止自动下单承诺", forbidden.noOneClickOrderClaim ? "已阻断" : "存在风险", forbidden.noOneClickOrderClaim ? "pass" : "blocked"),
      row("no_one_click_ticket", "禁止一键出票承诺", forbidden.noOneClickTicketingClaim ? "已阻断" : "存在风险", forbidden.noOneClickTicketingClaim ? "pass" : "blocked")
    ]);
  }
  function buildRecommendedCopyRows(goal) {
    const copy = obj(goal.recommendedCopy);
    return clone([
      row("covered_lowest", "当前已覆盖来源中的较低候选价", copy.coveredLowestCandidate || "", "pass"),
      row("official_comparison", "与官方价对比", copy.officialComparison || "", "pass"),
      row("connected_platform", "已接入平台候选价", copy.connectedPlatformCandidate || "", "pass"),
      row("platform_realtime", "价格以跳转后平台实时页面为准", copy.platformRealtimePrice || "", "pass"),
      row("read_only_evidence", "当前仅提供只读候选证据，不提供付款、下单或出票能力", copy.readOnlyEvidence || "", "pass")
    ]);
  }
  function buildGlobalShoppingProductGoalViewModel(input) {
    try {
      const safe = obj(input);
      const goal = productGoalSummary(safe);
      const boundary = jumpBoundarySummary(safe);
      const normalizer = priceSourceNormalizationSummary(safe);
      const anchor = officialPriceAnchorSummary(safe, normalizer);
      const displayBoard = priceCandidateDisplaySummary(safe, normalizer, anchor);
      const status = goal.status === "blocked" || boundary.status === "blocked" || normalizer.status === "blocked" || anchor.status === "blocked" || displayBoard.status === "blocked"
        ? "blocked"
        : (goal.status === "needs_review" || boundary.status === "needs_review" || normalizer.status === "needs_review" || anchor.status === "needs_review" || anchor.status === "missing_official" || displayBoard.status === "needs_review" ? "needs_review" : "aligned");
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION,
        status:status,
        title:"全球购产品目标与跳转边界",
        cards:buildGlobalShoppingProductGoalCards(safe),
        productGoalRows:buildGlobalShoppingProductGoalRows(safe),
        jumpBoundaryRows:buildGlobalShoppingJumpBoundaryRowsForView(safe),
        forbiddenCopyRows:buildForbiddenCopyRows(goal),
        recommendedCopyRows:buildRecommendedCopyRows(goal),
        caveat:CAVEAT,
        globalShoppingProductGoalSummary:clone(goal),
        jumpToPlatformBoundarySummary:clone(boundary),
        priceSourceNormalizationSummary:clone(normalizer),
        officialPriceAnchorSummary:clone(anchor),
        priceCandidateDisplaySummary:clone(displayBoard),
        priceNormalizationStatus:text(normalizer.status || ""),
        officialPriceAnchorStatus:text(anchor.status || ""),
        priceCandidateDisplayStatus:text(displayBoard.status || ""),
        safeToProceedWithPriceProviderSandbox:normalizer.status === "ready" && anchor.status === "anchored" && displayBoard.status === "ready",
        redacted:true
      });
    } catch (error) {
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION,
        status:"failed_safe",
        title:"全球购产品目标与跳转边界",
        cards:[],
        productGoalRows:[],
        jumpBoundaryRows:[],
        forbiddenCopyRows:[],
        recommendedCopyRows:[],
        caveat:CAVEAT,
        redacted:true
      });
    }
  }
  function buildGlobalShoppingProductGoalViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProductGoalViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      productGoalRowCount:model.productGoalRows.length,
      jumpBoundaryRowCount:model.jumpBoundaryRows.length,
      priceNormalizationStatus:model.priceNormalizationStatus || "",
      officialPriceAnchorStatus:model.officialPriceAnchorStatus || "",
      priceCandidateDisplayStatus:model.priceCandidateDisplayStatus || "",
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      secretStored:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProductGoalViewModel = {
    GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProductGoalViewModel,
    buildGlobalShoppingProductGoalCards,
    buildGlobalShoppingProductGoalRows,
    buildGlobalShoppingJumpBoundaryRowsForView,
    buildGlobalShoppingProductGoalViewModelAuditDraft
  };
})();
