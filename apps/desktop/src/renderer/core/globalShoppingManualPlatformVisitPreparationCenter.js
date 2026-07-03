;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_VERSION = "4.1.1";
  const CENTER_NAME = "global_shopping_manual_platform_visit_preparation_center_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function summaryLabel(summary, fallback) { return text(obj(obj(summary).userFacingSummary).resultLabel || fallback || ""); }
  function countItems(value) { return Array.isArray(value) ? value.length : 0; }
  function safeBool(value, fallback) { return typeof value === "boolean" ? value : fallback; }
  function section(sectionId, title, status, summary, caveat) {
    return {
      sectionId:text(sectionId),
      title:text(title),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function evaluateGlobalShoppingManualPlatformVisitPreparationCenter(input) {
    const safe = obj(input);
    const userManualReviewViewModelSummary = resolveSummary(safe, "userManualReviewViewModelSummary", "WeishanGlobalShoppingUserManualReviewViewModel", "buildGlobalShoppingUserManualReviewViewModel", safe);
    const userFacingManualReviewFlowSummary = resolveSummary(safe, "userFacingManualReviewFlowSummary", "WeishanGlobalShoppingUserFacingManualReviewFlow", "buildGlobalShoppingUserFacingManualReviewFlow", safe);
    const platformVerificationProgressTrackerSummary = resolveSummary(safe, "platformVerificationProgressTrackerSummary", "WeishanGlobalShoppingPlatformVerificationProgressTracker", "buildGlobalShoppingPlatformVerificationProgressTracker", safe);
    const safeNextActionPanelSummary = resolveSummary(safe, "safeNextActionPanelSummary", "WeishanGlobalShoppingSafeNextActionPanel", "buildGlobalShoppingSafeNextActionPanel", safe);
    const platformRealityCheckBoardSummary = resolveSummary(safe, "platformRealityCheckBoardSummary", "WeishanGlobalShoppingPlatformRealityCheckBoard", "buildGlobalShoppingPlatformRealityCheckBoard", safe);
    const manualPlatformReviewCockpitSummary = resolveSummary(safe, "manualPlatformReviewCockpitSummary", "WeishanGlobalShoppingManualPlatformReviewCockpit", "buildGlobalShoppingManualPlatformReviewCockpit", safe);

    const missingUserManualReviewViewModel = !Object.keys(userManualReviewViewModelSummary).length;
    const missingManualReviewFlow = !Object.keys(userFacingManualReviewFlowSummary).length;
    const missingProgressTracker = !Object.keys(platformVerificationProgressTrackerSummary).length;
    const missingSafeNextActionPanel = !Object.keys(safeNextActionPanelSummary).length;
    const missingRealityCheckBoard = !Object.keys(platformRealityCheckBoardSummary).length;

    const blocked = safe.openExternal === true || safe.windowOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.userChoiceStored === true || safe.userChoiceSubmitted === true ||
      safe.download === true || safe.export === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.createOrder === true || safe.paymentAuthorization === true ||
      safe.hasForbiddenClaim === true;

    const platformFinalAuthorityVisible = safeBool(safe.platformFinalAuthorityVisible, true);
    const userManualDecisionVisible = safeBool(safe.userManualDecisionVisible, true);
    const needsReview = missingUserManualReviewViewModel || missingManualReviewFlow || missingProgressTracker ||
      missingSafeNextActionPanel || missingRealityCheckBoard || platformFinalAuthorityVisible === false || userManualDecisionVisible === false;

    const nonSensitiveParameterCount = countItems(safe.nonSensitiveParameters) || countItems(obj(platformRealityCheckBoardSummary).realityChecks);
    const userOnlyActionCount = countItems(obj(safeNextActionPanelSummary).safeActionRows);
    const platformOnlyVerificationCount = countItems(obj(platformVerificationProgressTrackerSummary).progressRows);
    const forbiddenActionCount = countItems(obj(safeNextActionPanelSummary).forbiddenActionRows);
    const preparationSections = buildGlobalShoppingManualPlatformVisitPreparationSections(Object.assign({}, safe, {
      userManualReviewViewModelSummary,
      userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary,
      platformRealityCheckBoardSummary,
      manualPlatformReviewCockpitSummary
    }));

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      userManualReviewViewModelSummary:userManualReviewViewModelSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary,
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary,
      preparationBoundary:{
        preparationId:"manual_platform_visit_preparation",
        preparationMode:text(safe.preparationMode || "review_only") || "review_only",
        displayOnly:true,
        reviewOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canPersistUserChoice:false,
        canSubmitUserChoice:false,
        canDownload:false,
        canExport:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false,
        canAuthorizePayment:false
      },
      preparationSummary:{
        hasUserManualReviewViewModel:!missingUserManualReviewViewModel,
        hasManualReviewFlow:!missingManualReviewFlow,
        hasProgressTracker:!missingProgressTracker,
        hasSafeNextActionPanel:!missingSafeNextActionPanel,
        hasRealityCheckBoard:!missingRealityCheckBoard,
        preparationSectionCount:preparationSections.length,
        nonSensitiveParameterCount:nonSensitiveParameterCount,
        userOnlyActionCount:userOnlyActionCount,
        platformOnlyVerificationCount:platformOnlyVerificationCount,
        forbiddenActionCount:forbiddenActionCount
      },
      preparationSections:preparationSections,
      preparationHealth:{
        noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
        noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
        noPersistedUserChoice:safe.userChoiceStored !== true,
        noSubmittedUserChoice:safe.userChoiceSubmitted !== true,
        noDownloadExport:safe.download !== true && safe.export !== true,
        noCheckoutPaymentTicketingOrder:safe.payment !== true && safe.order !== true && safe.ticketing !== true && safe.createOrder !== true,
        noPaymentAuthorization:safe.paymentAuthorization !== true,
        noForbiddenClaims:safe.hasForbiddenClaim !== true,
        platformFinalAuthorityVisible:platformFinalAuthorityVisible,
        userManualDecisionVisible:userManualDecisionVisible
      },
      blockedReasons:blocked ? [
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.userChoiceStored === true ? "persisted_user_choice_detected" : "",
        safe.userChoiceSubmitted === true ? "submitted_user_choice_detected" : "",
        safe.download === true || safe.export === true ? "download_export_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true || safe.createOrder === true ? "transaction_detected" : "",
        safe.paymentAuthorization === true ? "payment_authorization_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingManualPlatformVisitPreparationSections(input) {
    const safe = obj(input);
    const hasResolvedSummaries = Object.keys(obj(safe.userFacingManualReviewFlowSummary)).length ||
      Object.keys(obj(safe.platformVerificationProgressTrackerSummary)).length ||
      Object.keys(obj(safe.safeNextActionPanelSummary)).length ||
      Object.keys(obj(safe.platformRealityCheckBoardSummary)).length ||
      Object.keys(obj(safe.manualPlatformReviewCockpitSummary)).length;
    const evaluation = safe.preparationSummary || hasResolvedSummaries ? safe : evaluateGlobalShoppingManualPlatformVisitPreparationCenter(safe);
    return clone([
      section("candidate_source", "候选来源摘要", statusOf(evaluation.manualPlatformReviewCockpitSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.manualPlatformReviewCockpitSummary, "候选来源摘要仍需复核"), "当前只展示脱敏候选摘要，不生成真实平台链接。"),
      section("evidence_summary", "证据摘要", statusOf(evaluation.userFacingManualReviewFlowSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.userFacingManualReviewFlowSummary, "证据摘要仍需复核"), "证据只用于用户离开 Weishan 前的准备说明。"),
      section("non_sensitive_parameters", "非敏感搜索参数", "pass", "仅展示非敏感搜索参数，不保存平台账号、密码、证件或支付资料。", "搜索参数仅用于人工核对，不代表跳转或代填。"),
      section("platform_verification", "平台核对项目", statusOf(evaluation.platformVerificationProgressTrackerSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.platformVerificationProgressTrackerSummary, "平台核对项目仍需复核"), "价格、税费、库存、退改和最终订单都以平台页面为准。"),
      section("user_only_actions", "用户必须自行完成事项", "pass", "登录、身份验证、支付、下单、出票都只能由用户在平台自行完成。", "Weishan 不代表平台，不代替用户完成最终判断。"),
      section("weishan_boundaries", "Weishan 不执行事项", "pass", "不打开平台、不保存选择、不创建订单、不付款、不出票。", "当前只展示准备信息，不构成订单、付款授权或签名。")
    ]);
  }

  function buildGlobalShoppingManualPlatformVisitPreparationRows(input) {
    const evaluation = evaluateGlobalShoppingManualPlatformVisitPreparationCenter(input);
    return clone([
      row("visit_preparation_scope", "手动访问平台准备中心", "当前只展示用户前往平台人工核对前的准备信息", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("candidate_summary", "候选来源摘要", summaryLabel(evaluation.manualPlatformReviewCockpitSummary, "候选来源摘要仍需复核"), statusOf(evaluation.manualPlatformReviewCockpitSummary) === "ready" ? "pass" : "warning"),
      row("evidence_summary", "证据摘要", summaryLabel(evaluation.userFacingManualReviewFlowSummary, "证据摘要仍需复核"), statusOf(evaluation.userFacingManualReviewFlowSummary) === "ready" ? "pass" : "warning"),
      row("non_sensitive_parameters", "非敏感搜索参数", "只展示非敏感搜索参数，不保存用户选择", "pass"),
      row("platform_verification", "平台核对项目", summaryLabel(evaluation.platformVerificationProgressTrackerSummary, "平台核对项目仍需复核"), statusOf(evaluation.platformVerificationProgressTrackerSummary) === "ready" ? "pass" : "warning"),
      row("user_only_actions", "用户必须自行完成事项", "登录、付款、下单、出票均由用户在平台自行完成", "pass"),
      row("weishan_boundaries", "Weishan 不执行事项", "不打开平台，不创建订单，不付款，不出票", "pass")
    ]);
  }

  function sanitizeGlobalShoppingManualPlatformVisitPreparationCenter(center) {
    const safe = obj(center);
    const evaluation = evaluateGlobalShoppingManualPlatformVisitPreparationCenter(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_VERSION,
      status:status,
      preparationBoundary:clone(evaluation.preparationBoundary),
      preparationSummary:clone(evaluation.preparationSummary),
      preparationSections:toArray(safe.preparationSections).length ? toArray(safe.preparationSections) : buildGlobalShoppingManualPlatformVisitPreparationSections(safe),
      preparationHealth:clone(evaluation.preparationHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingManualPlatformVisitPreparationRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"手动访问平台准备中心",
        resultLabel:status === "ready" ? "平台访问准备已完成" : (status === "blocked" ? "平台访问准备已阻断" : "平台访问准备仍需复核"),
        caveat:"当前只展示用户前往平台人工核对前的准备信息，不打开平台，不保存选择，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingManualPlatformVisitPreparationCenter(input) {
    try {
      return sanitizeGlobalShoppingManualPlatformVisitPreparationCenter(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingManualPlatformVisitPreparationCenter({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingManualPlatformVisitPreparationCenterAuditDraft(input) {
    const center = buildGlobalShoppingManualPlatformVisitPreparationCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_VERSION,
      status:center.status,
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

  window.WeishanGlobalShoppingManualPlatformVisitPreparationCenter = {
    GLOBAL_SHOPPING_MANUAL_PLATFORM_VISIT_PREPARATION_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingManualPlatformVisitPreparationCenter,
    evaluateGlobalShoppingManualPlatformVisitPreparationCenter,
    buildGlobalShoppingManualPlatformVisitPreparationRows,
    buildGlobalShoppingManualPlatformVisitPreparationSections,
    buildGlobalShoppingManualPlatformVisitPreparationCenterAuditDraft,
    sanitizeGlobalShoppingManualPlatformVisitPreparationCenter
  };
})();
