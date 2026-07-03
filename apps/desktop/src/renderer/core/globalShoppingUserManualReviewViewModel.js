;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_VERSION = "4.1.2";
  const VIEW_MODEL_NAME = "global_shopping_user_manual_review_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function card(cardId, title, line) { return { cardId:text(cardId), title:text(title), line:text(line), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }

  function evaluateViewModel(input) {
    const safe = obj(input);
    const userFacingManualReviewFlowSummary = resolveSummary(safe, "userFacingManualReviewFlowSummary", "WeishanGlobalShoppingUserFacingManualReviewFlow", "buildGlobalShoppingUserFacingManualReviewFlow", safe);
    const platformVerificationProgressTrackerSummary = resolveSummary(safe, "platformVerificationProgressTrackerSummary", "WeishanGlobalShoppingPlatformVerificationProgressTracker", "buildGlobalShoppingPlatformVerificationProgressTracker", safe);
    const safeNextActionPanelSummary = resolveSummary(safe, "safeNextActionPanelSummary", "WeishanGlobalShoppingSafeNextActionPanel", "buildGlobalShoppingSafeNextActionPanel", safe);
    const blocked = statusOf(userFacingManualReviewFlowSummary) === "blocked" ||
      statusOf(platformVerificationProgressTrackerSummary) === "blocked" ||
      statusOf(safeNextActionPanelSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.signatureCapture === true || safe.paymentAuthorization === true || safe.orderCreation === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready = statusOf(userFacingManualReviewFlowSummary) === "ready" &&
      statusOf(platformVerificationProgressTrackerSummary) === "ready" &&
      statusOf(safeNextActionPanelSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      blockedReasons:blocked ? ["manual_review_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingUserManualReviewCards(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      card("manual_review_flow", "手动复核流程", obj(obj(evaluation.userFacingManualReviewFlowSummary).userFacingSummary).resultLabel || "用户手动复核流程仍需复核"),
      card("verification_progress", "平台核对进度", obj(obj(evaluation.platformVerificationProgressTrackerSummary).userFacingSummary).resultLabel || "平台核对进度仍需复核"),
      card("safe_next_action", "安全下一步", obj(obj(evaluation.safeNextActionPanelSummary).userFacingSummary).resultLabel || "安全下一步仍需复核"),
      card("risk_disclosure", "风险说明", "用户必须自行完成最终平台判断")
    ]);
  }

  function buildGlobalShoppingUserManualReviewRows(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      row("manual_review_scope", "用户手动复核与安全下一步", "当前只展示手动复核流程、平台核对进度和安全下一步", "pass"),
      row("no_persistence", "平台核对进度", "平台核对进度不保存勾选", "pass"),
      row("no_open", "安全下一步", "安全下一步不打开平台", "pass"),
      row("no_buying", "交易边界", "下一步不包含购买、下单、付款或出票", "pass"),
      row("human_decision", "最终判断", "用户必须自行完成最终平台判断", "pass"),
      row("flow_status", "用户手动复核流程", obj(obj(evaluation.userFacingManualReviewFlowSummary).userFacingSummary).resultLabel || "用户手动复核流程仍需复核", statusOf(evaluation.userFacingManualReviewFlowSummary) === "ready" ? "pass" : "warning"),
      row("progress_status", "平台核对进度", obj(obj(evaluation.platformVerificationProgressTrackerSummary).userFacingSummary).resultLabel || "平台核对进度仍需复核", statusOf(evaluation.platformVerificationProgressTrackerSummary) === "ready" ? "pass" : "warning"),
      row("next_action_status", "安全下一步", obj(obj(evaluation.safeNextActionPanelSummary).userFacingSummary).resultLabel || "安全下一步仍需复核", statusOf(evaluation.safeNextActionPanelSummary) === "ready" ? "pass" : "warning")
    ]);
  }

  function buildGlobalShoppingPlatformVerificationRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return clone(toArray(obj(evaluation.platformVerificationProgressTrackerSummary).progressRows).map(function (item) {
      return row(item.itemId, item.label, item.summary, item.status === "blocked" ? "blocked" : "pass");
    }));
  }

  function buildGlobalShoppingSafeNextActionRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return clone(toArray(obj(evaluation.safeNextActionPanelSummary).safeActionRows).map(function (item) {
      return row(item.actionId, "安全下一步", item.label, "pass");
    }).concat(toArray(obj(evaluation.safeNextActionPanelSummary).forbiddenActionRows).map(function (item) {
      return row(item.actionId, "已阻断动作", item.label, "pass");
    })));
  }

  function sanitizeGlobalShoppingUserManualReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluateViewModel(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"用户手动复核与安全下一步",
      userFacingManualReviewFlowSummary:clone(evaluation.userFacingManualReviewFlowSummary),
      platformVerificationProgressTrackerSummary:clone(evaluation.platformVerificationProgressTrackerSummary),
      safeNextActionPanelSummary:clone(evaluation.safeNextActionPanelSummary),
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingUserManualReviewCards(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingUserManualReviewRows(safe),
      platformVerificationRows:toArray(safe.platformVerificationRows).length ? toArray(safe.platformVerificationRows) : buildGlobalShoppingPlatformVerificationRowsForView(safe),
      safeNextActionRows:toArray(safe.safeNextActionRows).length ? toArray(safe.safeNextActionRows) : buildGlobalShoppingSafeNextActionRowsForView(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"用户手动复核与安全下一步",
        resultLabel:status === "ready" ? "用户手动复核与安全下一步已准备" : (status === "blocked" ? "用户手动复核与安全下一步已阻断" : "用户手动复核与安全下一步仍需复核"),
        caveat:"当前只展示手动复核流程、平台核对进度和安全下一步，不打开平台，不保存选择，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingUserManualReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingUserManualReviewViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingUserManualReviewViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingUserManualReviewViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingUserManualReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_VERSION,
      status:viewModel.status,
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

  window.WeishanGlobalShoppingUserManualReviewViewModel = {
    GLOBAL_SHOPPING_USER_MANUAL_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingUserManualReviewViewModel,
    buildGlobalShoppingUserManualReviewCards,
    buildGlobalShoppingUserManualReviewRows,
    buildGlobalShoppingPlatformVerificationRowsForView,
    buildGlobalShoppingSafeNextActionRowsForView,
    buildGlobalShoppingUserManualReviewViewModelAuditDraft,
    sanitizeGlobalShoppingUserManualReviewViewModel
  };
})();
