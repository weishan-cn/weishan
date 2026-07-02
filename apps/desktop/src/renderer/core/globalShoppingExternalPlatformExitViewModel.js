;(function () {
  "use strict";

  const GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION = "4.0.2";
  const VIEW_MODEL_NAME = "global_shopping_external_platform_exit_view_model_v1";

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
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      export:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      confirmationStored:false,
      signatureCapture:false,
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

  function evaluateViewModel(input) {
    const safe = obj(input);
    const externalPlatformExitRampPreviewSummary = resolveSummary(safe, "externalPlatformExitRampPreviewSummary", "WeishanGlobalShoppingExternalPlatformExitRampPreview", "buildGlobalShoppingExternalPlatformExitRampPreview", safe);
    const manualVisitSafetyBriefSummary = resolveSummary(safe, "manualVisitSafetyBriefSummary", "WeishanGlobalShoppingManualVisitSafetyBrief", "buildGlobalShoppingManualVisitSafetyBrief", safe);
    const readOnlySessionClosurePackSummary = resolveSummary(safe, "readOnlySessionClosurePackSummary", "WeishanGlobalShoppingReadOnlySessionClosurePack", "buildGlobalShoppingReadOnlySessionClosurePack", safe);
    const blocked =
      statusOf(externalPlatformExitRampPreviewSummary) === "blocked" ||
      statusOf(manualVisitSafetyBriefSummary) === "blocked" ||
      statusOf(readOnlySessionClosurePackSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.rawUserTextStored === true || safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.export === true || safe.download === true || safe.fileWrite === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.signatureCapture === true || safe.paymentAuthorization === true || safe.orderCreation === true || safe.confirmationStored === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready = statusOf(externalPlatformExitRampPreviewSummary) === "ready" && statusOf(manualVisitSafetyBriefSummary) === "ready" && statusOf(readOnlySessionClosurePackSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      blockedReasons:blocked ? ["external_platform_exit_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingExternalPlatformExitCards(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      card("exit_ramp", "退出坡道", summaryLabel(evaluation.externalPlatformExitRampPreviewSummary, "外部平台退出坡道仍需复核")),
      card("safety_brief", "安全简报", summaryLabel(evaluation.manualVisitSafetyBriefSummary, "手动访问安全简报仍需复核")),
      card("closure_pack", "会话关闭包", summaryLabel(evaluation.readOnlySessionClosurePackSummary, "只读会话关闭包仍需复核")),
      card("next_step", "下一步", "用户离开 Weishan 后自行前往平台并自行判断")
    ]);
  }

  function buildGlobalShoppingExternalPlatformExitRows(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      row("scope", "外部平台手动访问前最终说明", "当前只展示离开 Weishan 前的最终说明", "pass"),
      row("exit_ramp_status", "外部平台退出坡道预览", summaryLabel(evaluation.externalPlatformExitRampPreviewSummary, "外部平台退出坡道仍需复核"), statusOf(evaluation.externalPlatformExitRampPreviewSummary) === "ready" ? "pass" : "warning"),
      row("manual_safety_status", "手动访问安全简报", summaryLabel(evaluation.manualVisitSafetyBriefSummary, "手动访问安全简报仍需复核"), statusOf(evaluation.manualVisitSafetyBriefSummary) === "ready" ? "pass" : "warning"),
      row("closure_status", "只读会话关闭包", summaryLabel(evaluation.readOnlySessionClosurePackSummary, "只读会话关闭包仍需复核"), statusOf(evaluation.readOnlySessionClosurePackSummary) === "ready" ? "pass" : "warning"),
      row("safety_line", "安全边界", "不打开平台，不生成链接，不保存选择，不构成订单、付款授权或签名", "pass")
    ]);
  }

  function sanitizeGlobalShoppingExternalPlatformExitViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluateViewModel(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION,
      status:status,
      title:"外部平台手动访问前最终说明",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingExternalPlatformExitCards(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingExternalPlatformExitRows(safe),
      caveat:"当前只展示离开 Weishan 前的最终说明，不打开平台，不生成链接，不保存选择，不构成订单、付款授权或签名。",
      externalPlatformExitRampPreviewSummary:clone(evaluation.externalPlatformExitRampPreviewSummary),
      manualVisitSafetyBriefSummary:clone(evaluation.manualVisitSafetyBriefSummary),
      readOnlySessionClosurePackSummary:clone(evaluation.readOnlySessionClosurePackSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingExternalPlatformExitViewModel(input) {
    try {
      return sanitizeGlobalShoppingExternalPlatformExitViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingExternalPlatformExitViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingExternalPlatformExitViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingExternalPlatformExitViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION,
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

  window.WeishanGlobalShoppingExternalPlatformExitViewModel = {
    GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingExternalPlatformExitViewModel,
    buildGlobalShoppingExternalPlatformExitCards,
    buildGlobalShoppingExternalPlatformExitRows,
    buildGlobalShoppingExternalPlatformExitViewModelAuditDraft,
    sanitizeGlobalShoppingExternalPlatformExitViewModel
  };
})();
