;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION = "3.0.0";
  const VIEW_MODEL_NAME = "global_shopping_platform_visit_preparation_view_model_v1";

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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
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
  function card(cardId, label, value) {
    return {
      cardId:text(cardId),
      label:text(label),
      value:text(value),
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

  function evaluateViewModel(input) {
    const safe = obj(input);
    const manualPlatformVisitPreparationCenterSummary = resolveSummary(safe, "manualPlatformVisitPreparationCenterSummary", "WeishanGlobalShoppingManualPlatformVisitPreparationCenter", "buildGlobalShoppingManualPlatformVisitPreparationCenter", safe);
    const externalPlatformBoundaryBriefSummary = resolveSummary(safe, "externalPlatformBoundaryBriefSummary", "WeishanGlobalShoppingExternalPlatformBoundaryBrief", "buildGlobalShoppingExternalPlatformBoundaryBrief", safe);
    const finalUserSafetyChecklistSummary = resolveSummary(safe, "finalUserSafetyChecklistSummary", "WeishanGlobalShoppingFinalUserSafetyChecklist", "buildGlobalShoppingFinalUserSafetyChecklist", safe);
    const blocked = statusOf(manualPlatformVisitPreparationCenterSummary) === "blocked" ||
      statusOf(externalPlatformBoundaryBriefSummary) === "blocked" ||
      statusOf(finalUserSafetyChecklistSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.signatureCapture === true || safe.paymentAuthorization === true || safe.orderCreation === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready = statusOf(manualPlatformVisitPreparationCenterSummary) === "ready" &&
      statusOf(externalPlatformBoundaryBriefSummary) === "ready" &&
      statusOf(finalUserSafetyChecklistSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      blockedReasons:blocked ? ["platform_visit_preparation_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingPlatformVisitPreparationCards(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      card("visit_preparation", "平台访问准备", summaryLabel(evaluation.manualPlatformVisitPreparationCenterSummary, "平台访问准备仍需复核")),
      card("platform_boundary", "平台边界说明", summaryLabel(evaluation.externalPlatformBoundaryBriefSummary, "平台边界说明仍需复核")),
      card("final_safety", "最终安全清单", summaryLabel(evaluation.finalUserSafetyChecklistSummary, "最终安全清单仍需复核")),
      card("next_step", "下一步", "离开 Weishan 后由用户自行判断")
    ]);
  }

  function buildGlobalShoppingPlatformVisitPreparationRows(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      row("visit_preparation_scope", "平台访问准备", "当前只展示平台访问准备、外部平台边界和最终安全清单", "pass"),
      row("visit_preparation_status", "手动访问平台准备中心", summaryLabel(evaluation.manualPlatformVisitPreparationCenterSummary, "平台访问准备仍需复核"), statusOf(evaluation.manualPlatformVisitPreparationCenterSummary) === "ready" ? "pass" : "warning"),
      row("platform_boundary_status", "外部平台边界说明", summaryLabel(evaluation.externalPlatformBoundaryBriefSummary, "平台边界说明仍需复核"), statusOf(evaluation.externalPlatformBoundaryBriefSummary) === "ready" ? "pass" : "warning"),
      row("final_safety_status", "最终用户安全清单", summaryLabel(evaluation.finalUserSafetyChecklistSummary, "最终安全清单仍需复核"), statusOf(evaluation.finalUserSafetyChecklistSummary) === "ready" ? "pass" : "warning"),
      row("no_open", "安全边界", "不打开平台，不保存选择，不构成订单、付款授权或签名", "pass")
    ]);
  }

  function buildGlobalShoppingExternalPlatformBoundaryRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return clone(toArray(obj(evaluation.externalPlatformBoundaryBriefSummary).boundaryStatements).map(function (item) {
      return row(item.statementId, item.label, item.statement, item.status === "blocked" ? "blocked" : "pass");
    }));
  }

  function buildGlobalShoppingFinalUserSafetyRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return clone(toArray(obj(evaluation.finalUserSafetyChecklistSummary).safetyItems).map(function (item) {
      return row(item.itemId, item.label, item.summary, item.status === "blocked" ? "blocked" : "pass");
    }));
  }

  function sanitizeGlobalShoppingPlatformVisitPreparationViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluateViewModel(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION,
      status:status,
      title:"平台访问准备与最终安全清单",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingPlatformVisitPreparationCards(safe),
      preparationRows:toArray(safe.preparationRows).length ? toArray(safe.preparationRows) : buildGlobalShoppingPlatformVisitPreparationRows(safe),
      boundaryRows:toArray(safe.boundaryRows).length ? toArray(safe.boundaryRows) : buildGlobalShoppingExternalPlatformBoundaryRowsForView(safe),
      finalSafetyRows:toArray(safe.finalSafetyRows).length ? toArray(safe.finalSafetyRows) : buildGlobalShoppingFinalUserSafetyRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("platform_final_authority", "平台页面为最终依据", "价格、库存、条款和最终订单都以平台页面为准", "pass"),
        row("user_decision_boundary", "离开 Weishan 后由用户自行判断", "Weishan 不代替用户完成登录、付款、下单或出票", "pass")
      ],
      caveat:"当前只展示平台访问准备、外部平台边界和最终安全清单，不打开平台，不保存选择，不构成订单、付款授权或签名。",
      manualPlatformVisitPreparationCenterSummary:clone(evaluation.manualPlatformVisitPreparationCenterSummary),
      externalPlatformBoundaryBriefSummary:clone(evaluation.externalPlatformBoundaryBriefSummary),
      finalUserSafetyChecklistSummary:clone(evaluation.finalUserSafetyChecklistSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingPlatformVisitPreparationViewModel(input) {
    try {
      return sanitizeGlobalShoppingPlatformVisitPreparationViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformVisitPreparationViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingPlatformVisitPreparationViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingPlatformVisitPreparationViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION,
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

  window.WeishanGlobalShoppingPlatformVisitPreparationViewModel = {
    GLOBAL_SHOPPING_PLATFORM_VISIT_PREPARATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPlatformVisitPreparationViewModel,
    buildGlobalShoppingPlatformVisitPreparationCards,
    buildGlobalShoppingPlatformVisitPreparationRows,
    buildGlobalShoppingExternalPlatformBoundaryRowsForView,
    buildGlobalShoppingFinalUserSafetyRowsForView,
    buildGlobalShoppingPlatformVisitPreparationViewModelAuditDraft,
    sanitizeGlobalShoppingPlatformVisitPreparationViewModel
  };
})();
