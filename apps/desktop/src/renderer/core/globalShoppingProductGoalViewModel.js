;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRODUCT_GOAL_VIEW_MODEL_VERSION = "2.1.94";
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
  function sameItemMatcherSummary(input, normalizer) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sameItemMatcherSummary)).length) return obj(safe.sameItemMatcherSummary);
    const matcherApi = api("WeishanGlobalShoppingSameItemMatcher");
    return typeof matcherApi.buildGlobalShoppingSameItemMatcher === "function"
      ? matcherApi.buildGlobalShoppingSameItemMatcher(Object.assign({}, safe, { normalizedCandidates:normalizer && normalizer.normalizedCandidates || [] }))
      : {};
  }
  function duplicateCandidateMergerSummary(input, matcher) {
    const safe = obj(input);
    if (Object.keys(obj(safe.duplicateCandidateMergerSummary)).length) return obj(safe.duplicateCandidateMergerSummary);
    const mergerApi = api("WeishanGlobalShoppingDuplicateCandidateMerger");
    return typeof mergerApi.buildGlobalShoppingDuplicateCandidateMerger === "function"
      ? mergerApi.buildGlobalShoppingDuplicateCandidateMerger(Object.assign({}, safe, { sameItemMatcherSummary:matcher }))
      : {};
  }
  function coveredLowestCandidateBoardSummary(input, merger, anchor) {
    const safe = obj(input);
    if (Object.keys(obj(safe.coveredLowestCandidateBoardSummary)).length) return obj(safe.coveredLowestCandidateBoardSummary);
    const boardApi = api("WeishanGlobalShoppingCoveredLowestCandidateBoard");
    return typeof boardApi.buildGlobalShoppingCoveredLowestCandidateBoard === "function"
      ? boardApi.buildGlobalShoppingCoveredLowestCandidateBoard(Object.assign({}, safe, { duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor }))
      : {};
  }
  function sandboxDeepLinkCandidateSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxDeepLinkCandidateSummary)).length) return obj(safe.sandboxDeepLinkCandidateSummary);
    const sandboxApi = api("WeishanGlobalShoppingSandboxDeepLinkCandidate");
    return typeof sandboxApi.buildGlobalShoppingSandboxDeepLinkCandidate === "function"
      ? sandboxApi.buildGlobalShoppingSandboxDeepLinkCandidate(safe)
      : {};
  }
  function platformAvailabilitySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.platformAvailabilitySummary)).length) return obj(safe.platformAvailabilitySummary);
    const gateApi = api("WeishanGlobalShoppingPlatformAvailabilityGate");
    return typeof gateApi.buildGlobalShoppingPlatformAvailabilityGate === "function"
      ? gateApi.buildGlobalShoppingPlatformAvailabilityGate(safe)
      : {};
  }
  function partnerLinkPolicySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.partnerLinkPolicySummary)).length) return obj(safe.partnerLinkPolicySummary);
    const policyApi = api("WeishanGlobalShoppingPartnerLinkPolicy");
    return typeof policyApi.buildGlobalShoppingPartnerLinkPolicy === "function"
      ? policyApi.buildGlobalShoppingPartnerLinkPolicy(safe)
      : {};
  }
  function sandboxHandoffViewModelSummary(input, sandbox, availability, partner) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxHandoffViewModelSummary)).length) return obj(safe.sandboxHandoffViewModelSummary);
    const modelApi = api("WeishanGlobalShoppingSandboxHandoffViewModel");
    return typeof modelApi.buildGlobalShoppingSandboxHandoffViewModel === "function"
      ? modelApi.buildGlobalShoppingSandboxHandoffViewModel(Object.assign({}, safe, {
        sandboxDeepLinkCandidateSummary:sandbox,
        platformAvailabilitySummary:availability,
        partnerLinkPolicySummary:partner
      }))
      : {};
  }
  function legalProviderFixtureSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.legalProviderFixtureSummary)).length) return obj(safe.legalProviderFixtureSummary);
    const adapterApi = api("WeishanGlobalShoppingLegalProviderFixtureAdapter");
    return typeof adapterApi.buildGlobalShoppingLegalProviderFixtureAdapter === "function"
      ? adapterApi.buildGlobalShoppingLegalProviderFixtureAdapter(safe)
      : {};
  }
  function providerCredentialSafetySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.providerCredentialSafetySummary)).length) return obj(safe.providerCredentialSafetySummary);
    const reviewApi = api("WeishanGlobalShoppingProviderCredentialSafetyReview");
    return typeof reviewApi.buildGlobalShoppingProviderCredentialSafetyReview === "function"
      ? reviewApi.buildGlobalShoppingProviderCredentialSafetyReview(safe)
      : {};
  }
  function sandboxPriceFeedSummary(input, legal, credential) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxPriceFeedSummary)).length) return obj(safe.sandboxPriceFeedSummary);
    const gateApi = api("WeishanGlobalShoppingSandboxPriceFeedGate");
    return typeof gateApi.buildGlobalShoppingSandboxPriceFeedGate === "function"
      ? gateApi.buildGlobalShoppingSandboxPriceFeedGate(Object.assign({}, safe, {
        legalProviderFixtureSummary:legal,
        providerCredentialSafetySummary:credential,
        normalizedSourceInputs:legal && legal.normalizedSourceInputs || []
      }))
      : {};
  }
  function providerFixtureViewModelSummary(input, legal, credential, feed) {
    const safe = obj(input);
    if (Object.keys(obj(safe.providerFixtureViewModelSummary)).length) return obj(safe.providerFixtureViewModelSummary);
    const viewModelApi = api("WeishanGlobalShoppingProviderFixtureViewModel");
    return typeof viewModelApi.buildGlobalShoppingProviderFixtureViewModel === "function"
      ? viewModelApi.buildGlobalShoppingProviderFixtureViewModel(Object.assign({}, safe, {
        legalProviderFixtureSummary:legal,
        providerCredentialSafetySummary:credential,
        sandboxPriceFeedSummary:feed
      }))
      : {};
  }
  function buildGlobalShoppingProductGoalCards(input) {
    const goal = productGoalSummary(input || {});
    const boundary = jumpBoundarySummary(input || {});
    const legal = legalProviderFixtureSummary(input || {});
    const credential = providerCredentialSafetySummary(input || {});
    const feed = sandboxPriceFeedSummary(input || {}, legal, credential);
    return clone([
      card("trusted_price", "可信候选价格", goal.productGoals && goal.productGoals.findTrustedCandidatePrices ? "已对齐" : "仍需复核"),
      card("official_anchor", "官方价格锚点", goal.productGoals && goal.productGoals.showOfficialPriceAnchor ? "已对齐" : "仍需复核"),
      card("covered_platforms", "合法平台候选价", goal.productGoals && goal.productGoals.showMultipleLegalPlatformCandidates ? "已对齐" : "仍需复核"),
      card("jump_boundary", "平台自行下单", boundary.userFacingSummary && boundary.userFacingSummary.resultLabel || "跳转边界仍需复核"),
      card("price_normalization", "价格源归一化层", priceSourceNormalizationSummary(input || {}).userFacingSummary && priceSourceNormalizationSummary(input || {}).userFacingSummary.resultLabel || "价格归一化仍需复核"),
      card("same_item_matcher", "同款候选识别", sameItemMatcherSummary(input || {}, priceSourceNormalizationSummary(input || {})).userFacingSummary && sameItemMatcherSummary(input || {}, priceSourceNormalizationSummary(input || {})).userFacingSummary.resultLabel || "同款识别仍需复核"),
      card("duplicate_merge", "重复候选合并", duplicateCandidateMergerSummary(input || {}, sameItemMatcherSummary(input || {}, priceSourceNormalizationSummary(input || {}))).userFacingSummary && duplicateCandidateMergerSummary(input || {}, sameItemMatcherSummary(input || {}, priceSourceNormalizationSummary(input || {}))).userFacingSummary.resultLabel || "重复候选仍需复核"),
      card("covered_lowest_board", "已覆盖来源候选价合并", coveredLowestCandidateBoardSummary(input || {}, duplicateCandidateMergerSummary(input || {}, sameItemMatcherSummary(input || {}, priceSourceNormalizationSummary(input || {}))), officialPriceAnchorSummary(input || {}, priceSourceNormalizationSummary(input || {}))).title || "已覆盖来源候选价合并"),
      card("provider_fixture_view", "合法 Provider Fixture 与 Sandbox 价格 Feed", providerFixtureViewModelSummary(input || {}, legal, credential, feed).title || "合法 Provider Fixture 与 Sandbox 价格 Feed"),
      card("sandbox_handoff", "Sandbox 跳转候选与平台可用性", sandboxHandoffViewModelSummary(input || {}, sandboxDeepLinkCandidateSummary(input || {}), platformAvailabilitySummary(input || {}), partnerLinkPolicySummary(input || {})).title || "Sandbox 跳转候选与平台可用性")
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
      const matcher = sameItemMatcherSummary(safe, normalizer);
      const merger = duplicateCandidateMergerSummary(safe, matcher);
      const coveredBoard = coveredLowestCandidateBoardSummary(safe, merger, anchor);
      const legal = legalProviderFixtureSummary(safe);
      const credential = providerCredentialSafetySummary(safe);
      const feed = sandboxPriceFeedSummary(safe, legal, credential);
      const sandbox = sandboxDeepLinkCandidateSummary(safe);
      const availability = platformAvailabilitySummary(safe);
      const partner = partnerLinkPolicySummary(safe);
      const sandboxHandoff = sandboxHandoffViewModelSummary(safe, sandbox, availability, partner);
      const fixtureView = providerFixtureViewModelSummary(safe, legal, credential, feed);
      const status = goal.status === "blocked" || boundary.status === "blocked" || normalizer.status === "blocked" || anchor.status === "blocked" || displayBoard.status === "blocked" || matcher.status === "blocked" || merger.status === "blocked" || coveredBoard.status === "blocked" || legal.status === "blocked" || credential.status === "blocked" || feed.status === "blocked" || fixtureView.status === "blocked" || sandbox.status === "blocked" || availability.status === "blocked" || partner.status === "blocked" || sandboxHandoff.status === "blocked"
        ? "blocked"
        : (goal.status === "needs_review" || boundary.status === "needs_review" || normalizer.status === "needs_review" || anchor.status === "needs_review" || anchor.status === "missing_official" || displayBoard.status === "needs_review" || matcher.status === "needs_review" || merger.status === "needs_review" || coveredBoard.status === "needs_review" || legal.status === "needs_review" || credential.status === "needs_review" || feed.status === "needs_review" || fixtureView.status === "needs_review" || sandbox.status === "needs_review" || availability.status === "needs_review" || partner.status === "needs_review" || sandboxHandoff.status === "needs_review" ? "needs_review" : "aligned");
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
        sameItemMatcherSummary:clone(matcher),
        duplicateCandidateMergerSummary:clone(merger),
        coveredLowestCandidateBoardSummary:clone(coveredBoard),
        legalProviderFixtureSummary:clone(legal),
        providerCredentialSafetySummary:clone(credential),
        sandboxPriceFeedSummary:clone(feed),
        providerFixtureViewModelSummary:clone(fixtureView),
        sandboxDeepLinkCandidateSummary:clone(sandbox),
        platformAvailabilitySummary:clone(availability),
        partnerLinkPolicySummary:clone(partner),
        sandboxHandoffViewModelSummary:clone(sandboxHandoff),
        priceNormalizationStatus:text(normalizer.status || ""),
        officialPriceAnchorStatus:text(anchor.status || ""),
        priceCandidateDisplayStatus:text(displayBoard.status || ""),
        sameItemMatcherStatus:text(matcher.status || ""),
        duplicateMergeStatus:text(merger.status || ""),
        coveredLowestStatus:text(coveredBoard.status || ""),
        legalProviderFixtureStatus:text(legal.status || ""),
        providerCredentialSafetyStatus:text(credential.status || ""),
        sandboxPriceFeedStatus:text(feed.status || ""),
        sandboxDeepLinkStatus:text(sandbox.status || ""),
        platformAvailabilityStatus:text(availability.status || ""),
        partnerLinkPolicyStatus:text(partner.status || ""),
        sandboxHandoffStatus:text(sandboxHandoff.status || ""),
        safeToProceedWithPriceProviderSandbox:normalizer.status === "ready" && anchor.status === "anchored" && displayBoard.status === "ready" && legal.status === "ready" && credential.status === "ready" && feed.status === "ready",
        safeToProceedWithReadOnlyPriceProviderSandbox:legal.status === "ready" && credential.status === "ready" && feed.status === "ready",
        safeToProceedWithDeepLinkSafetyGate:matcher.status === "ready" && merger.status === "merged" && coveredBoard.status === "ready",
        safeToProceedWithSandboxDeepLinkCandidate:legal.status === "ready" && credential.status === "ready" && feed.status === "ready" && sandbox.status === "ready" && availability.status === "available" && partner.status === "compliant",
        safeToProceedWithPartnerFixtureAdapter:legal.status === "ready" && credential.status === "ready" && feed.status === "ready" && sandbox.status === "ready" && availability.status === "available" && partner.status === "compliant" && sandboxHandoff.status === "ready",
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
      sameItemMatcherStatus:model.sameItemMatcherStatus || "",
      duplicateMergeStatus:model.duplicateMergeStatus || "",
      coveredLowestStatus:model.coveredLowestStatus || "",
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
