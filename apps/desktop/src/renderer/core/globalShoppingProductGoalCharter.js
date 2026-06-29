;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_VERSION = "2.1.97";
  const CHARTER_NAME = "global_shopping_product_goal_charter_v1";
  const SUMMARY_CAVEAT = "Weishan 只提供候选价格、官方价对比、归一化、风险提示和平台跳转辅助，不替用户付款、下单或出票。";
  const DEFAULT_RECOMMENDED_COPY = {
    coveredLowestCandidate:"当前已覆盖来源中的较低候选价",
    officialComparison:"与官方价对比",
    connectedPlatformCandidate:"已接入平台候选价",
    platformRealtimePrice:"价格以跳转后平台实时页面为准",
    readOnlyEvidence:"当前仅提供只读候选证据，不提供付款、下单或出票能力"
  };

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
  function safety() {
    return {
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
    };
  }
  function buildProductGoals(input) {
    const safe = obj(input);
    const overrides = obj(safe.productGoals);
    return {
      findTrustedCandidatePrices: overrides.findTrustedCandidatePrices !== false,
      showOfficialPriceAnchor: overrides.showOfficialPriceAnchor !== false,
      showMultipleLegalPlatformCandidates: overrides.showMultipleLegalPlatformCandidates !== false,
      normalizeTaxShippingServiceCurrency: overrides.normalizeTaxShippingServiceCurrency !== false,
      mergeDuplicateProductFlightHotelCandidates: overrides.mergeDuplicateProductFlightHotelCandidates !== false,
      showSourceTimestampTrust: overrides.showSourceTimestampTrust !== false,
      jumpToOfficialOrLegalPlatform: overrides.jumpToOfficialOrLegalPlatform !== false,
      platformRealTimePriceAsFinal: overrides.platformRealTimePriceAsFinal !== false,
      doNotStoreUserAccountIdentityBankPaymentCredential: overrides.doNotStoreUserAccountIdentityBankPaymentCredential !== false,
      noPaymentNoOrderNoTicketing: overrides.noPaymentNoOrderNoTicketing !== false
    };
  }
  function buildForbiddenPromises(input) {
    const safe = obj(input);
    const overrides = obj(safe.forbiddenPromises);
    return {
      noWholeNetworkLowestClaim: overrides.noWholeNetworkLowestClaim !== false,
      noLowestPriceGuarantee: overrides.noLowestPriceGuarantee !== false,
      noLockedPriceClaim: overrides.noLockedPriceClaim !== false,
      noRealFinalPriceClaim: overrides.noRealFinalPriceClaim !== false,
      noOneClickOrderClaim: overrides.noOneClickOrderClaim !== false,
      noOneClickTicketingClaim: overrides.noOneClickTicketingClaim !== false,
      noOfficialBookableGuarantee: overrides.noOfficialBookableGuarantee !== false,
      noAllProductsCoverageClaim: overrides.noAllProductsCoverageClaim !== false
    };
  }
  function buildRecommendedCopy(input) {
    return Object.assign({}, DEFAULT_RECOMMENDED_COPY, obj(obj(input).recommendedCopy));
  }
  function evaluateGlobalShoppingProductGoalCoverage(input) {
    const productGoals = buildProductGoals(input);
    const forbiddenPromises = buildForbiddenPromises(input);
    const recommendedCopy = buildRecommendedCopy(input);
    const blockedReasons = [];
    const needsReviewReasons = [];

    if (!productGoals.noPaymentNoOrderNoTicketing) blockedReasons.push("payment_order_ticketing_forbidden_goal_missing");
    if (!productGoals.doNotStoreUserAccountIdentityBankPaymentCredential) blockedReasons.push("sensitive_storage_boundary_missing");
    Object.keys(forbiddenPromises).forEach(function (key) {
      if (forbiddenPromises[key] !== true) blockedReasons.push(key);
    });
    Object.keys(productGoals).forEach(function (key) {
      if (productGoals[key] !== true && key !== "noPaymentNoOrderNoTicketing" && key !== "doNotStoreUserAccountIdentityBankPaymentCredential") {
        needsReviewReasons.push(key);
      }
    });

    let status = "aligned";
    if (blockedReasons.length) status = "blocked";
    else if (needsReviewReasons.length) status = "needs_review";

    return clone({
      status:status,
      productGoals:productGoals,
      forbiddenPromises:forbiddenPromises,
      recommendedCopy:recommendedCopy,
      blockedReasons:blockedReasons,
      needsReviewReasons:needsReviewReasons,
      safeToProceedWithJumpToPlatformMvp:status === "aligned",
      redacted:true
    });
  }
  function buildGlobalShoppingProductGoalRows(input) {
    const evaluation = evaluateGlobalShoppingProductGoalCoverage(input || {});
    const productGoals = evaluation.productGoals;
    const forbiddenPromises = evaluation.forbiddenPromises;
    const recommendedCopy = evaluation.recommendedCopy;
    return clone([
      row("trusted_price", "可信候选价格", productGoals.findTrustedCandidatePrices ? "已对齐" : "仍需补充可信候选价格目标", productGoals.findTrustedCandidatePrices ? "pass" : "warning"),
      row("official_anchor", "官方价格锚点", productGoals.showOfficialPriceAnchor ? "已对齐" : "仍需补充官方价格锚点", productGoals.showOfficialPriceAnchor ? "pass" : "warning"),
      row("covered_platforms", "合法平台候选价", productGoals.showMultipleLegalPlatformCandidates ? "已对齐" : "仍需补充合法平台候选价", productGoals.showMultipleLegalPlatformCandidates ? "pass" : "warning"),
      row("normalized_price", "归一化价格", productGoals.normalizeTaxShippingServiceCurrency ? "已对齐" : "仍需补充税费/运费/服务费归一化", productGoals.normalizeTaxShippingServiceCurrency ? "pass" : "warning"),
      row("jump_boundary", "平台跳转边界", productGoals.jumpToOfficialOrLegalPlatform ? "仅辅助跳转合法平台" : "平台跳转边界仍需复核", productGoals.jumpToOfficialOrLegalPlatform ? "pass" : "warning"),
      row("platform_final", "平台实时价格为准", productGoals.platformRealTimePriceAsFinal ? recommendedCopy.platformRealtimePrice : "缺少平台实时价格为准提示", productGoals.platformRealTimePriceAsFinal ? "pass" : "warning"),
      row("no_payment", "不付款/不下单/不出票", productGoals.noPaymentNoOrderNoTicketing ? recommendedCopy.readOnlyEvidence : "交易边界已失守", productGoals.noPaymentNoOrderNoTicketing ? "pass" : "blocked"),
      row("no_sensitive_storage", "不存储身份与支付凭据", productGoals.doNotStoreUserAccountIdentityBankPaymentCredential ? "敏感身份与支付凭据不存储" : "敏感身份与支付凭据边界已失守", productGoals.doNotStoreUserAccountIdentityBankPaymentCredential ? "pass" : "blocked"),
      row("no_lowest_claim", "禁止最低价相关承诺", forbiddenPromises.noWholeNetworkLowestClaim ? "已阻断最低价相关承诺" : "存在最低价相关承诺风险", forbiddenPromises.noWholeNetworkLowestClaim ? "pass" : "blocked"),
      row("no_one_click_order", "禁止自动下单承诺", forbiddenPromises.noOneClickOrderClaim ? "已阻断自动下单承诺" : "存在自动下单承诺风险", forbiddenPromises.noOneClickOrderClaim ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingProductGoalCharter(charter) {
    const safeChart = obj(charter);
    const evaluation = evaluateGlobalShoppingProductGoalCoverage(safeChart);
    const safeStatus = /^(aligned|needs_review|blocked|failed_safe)$/.test(safeChart.status) ? safeChart.status : evaluation.status;
    return clone({
      charterName:CHARTER_NAME,
      appVersion:GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_VERSION,
      status:safeStatus,
      productGoals:evaluation.productGoals,
      forbiddenPromises:evaluation.forbiddenPromises,
      recommendedCopy:evaluation.recommendedCopy,
      rows:toArray(safeChart.rows).length ? toArray(safeChart.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingProductGoalRows(evaluation),
      blockedReasons:toArray(safeChart.blockedReasons).map(text),
      userFacingSummary:{
        title:"全球购产品目标",
        resultLabel:safeStatus === "aligned" ? "产品目标已对齐" : safeStatus === "needs_review" ? "产品目标仍需复核" : "产品目标已阻断",
        caveat:SUMMARY_CAVEAT,
        redacted:true
      },
      safety:Object.assign(safety(), obj(safeChart.safety)),
      safeToProceedWithJumpToPlatformMvp:safeChart.safeToProceedWithJumpToPlatformMvp === true || evaluation.safeToProceedWithJumpToPlatformMvp === true,
      redacted:true
    });
  }
  function buildGlobalShoppingProductGoalCharter(input) {
    try {
      const evaluation = evaluateGlobalShoppingProductGoalCoverage(input || {});
      return sanitizeGlobalShoppingProductGoalCharter({
        status:evaluation.status,
        rows:buildGlobalShoppingProductGoalRows(evaluation),
        blockedReasons:evaluation.blockedReasons,
        safeToProceedWithJumpToPlatformMvp:evaluation.safeToProceedWithJumpToPlatformMvp
      });
    } catch (error) {
      return sanitizeGlobalShoppingProductGoalCharter({
        status:"failed_safe",
        rows:[],
        blockedReasons:["failed_safe"]
      });
    }
  }
  function buildGlobalShoppingProductGoalCharterAuditDraft(input) {
    const charter = buildGlobalShoppingProductGoalCharter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_AUDIT_DRAFT",
      charterName:CHARTER_NAME,
      appVersion:GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_VERSION,
      status:charter.status,
      rowCount:charter.rows.length,
      blockedReasonCount:charter.blockedReasons.length,
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

  window.WeishanGlobalShoppingProductGoalCharter = {
    GLOBAL_SHOPPING_PRODUCT_GOAL_CHARTER_VERSION,
    CHARTER_NAME,
    buildGlobalShoppingProductGoalCharter,
    evaluateGlobalShoppingProductGoalCoverage,
    buildGlobalShoppingProductGoalRows,
    buildGlobalShoppingProductGoalCharterAuditDraft,
    sanitizeGlobalShoppingProductGoalCharter
  };
})();
