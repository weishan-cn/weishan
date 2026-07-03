;(function () {
  "use strict";

  const GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION = "4.1.2";
  const VIEW_MODEL_NAME = "global_shopping_commerce_session_recap_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
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
  function rowsFrom(list, fallbackLabel) {
    return toArray(list).map(function (item, index) {
      const safe = obj(item);
      return row(safe.rowId || safe.statementId || safe.sectionId || ("row_" + index), safe.label || safe.title || fallbackLabel || "摘要", safe.value || safe.statement || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluateViewModel(input) {
    const safe = obj(input);
    const readOnlyCommerceSessionRecapCenterSummary = resolveSummary(safe, "readOnlyCommerceSessionRecapCenterSummary", "WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter", "buildGlobalShoppingReadOnlyCommerceSessionRecapCenter", safe);
    const userTrustClosureSummarySummary = resolveSummary(safe, "userTrustClosureSummarySummary", "WeishanGlobalShoppingUserTrustClosureSummary", "buildGlobalShoppingUserTrustClosureSummary", safe);
    const nextFeatureReadinessGateSummary = resolveSummary(safe, "nextFeatureReadinessGateSummary", "WeishanGlobalShoppingNextFeatureReadinessGate", "buildGlobalShoppingNextFeatureReadinessGate", safe);
    const blocked =
      statusOf(readOnlyCommerceSessionRecapCenterSummary) === "blocked" ||
      statusOf(userTrustClosureSummarySummary) === "blocked" ||
      statusOf(nextFeatureReadinessGateSummary) === "blocked" ||
      safe.realEndpointDetected === true || safe.hasRealApiKey === true || safe.networkEnabled === true ||
      safe.rawResponseStored === true || safe.rawUserTextStored === true || safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.export === true || safe.download === true || safe.signatureCapture === true || safe.paymentAuthorization === true || safe.orderCreation === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true;
    const ready =
      statusOf(readOnlyCommerceSessionRecapCenterSummary) === "ready" &&
      statusOf(userTrustClosureSummarySummary) === "ready" &&
      statusOf(nextFeatureReadinessGateSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary,
      blockedReasons:blocked ? ["commerce_session_recap_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingCommerceSessionRecapCards(input) {
    const evaluation = evaluateViewModel(input);
    return clone([
      card("session_recap", "会话总结", text(obj(obj(evaluation.readOnlyCommerceSessionRecapCenterSummary).userFacingSummary).resultLabel || "会话总结仍需复核")),
      card("trust_closure", "信任闭环", text(obj(obj(evaluation.userTrustClosureSummarySummary).userFacingSummary).resultLabel || "信任闭环仍需复核")),
      card("next_feature_readiness", "下一功能准备", text(obj(obj(evaluation.nextFeatureReadinessGateSummary).userFacingSummary).resultLabel || "下一功能仍需复核")),
      card("risk_disclosure", "风险说明", "下一步仍需人工审批")
    ]);
  }

  function buildGlobalShoppingCommerceSessionRecapRows(input) {
    const evaluation = evaluateViewModel(input);
    return rowsFrom(obj(evaluation.readOnlyCommerceSessionRecapCenterSummary).rows, "会话总结");
  }
  function buildGlobalShoppingUserTrustClosureRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return rowsFrom(obj(evaluation.userTrustClosureSummarySummary).rows, "信任闭环");
  }
  function buildGlobalShoppingNextFeatureReadinessRowsForView(input) {
    const evaluation = evaluateViewModel(input);
    return rowsFrom(obj(evaluation.nextFeatureReadinessGateSummary).rows, "下一功能准备");
  }

  function sanitizeGlobalShoppingCommerceSessionRecapViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluateViewModel(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION,
      status:status,
      title:"只读全球购会话总结与下一步准备",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingCommerceSessionRecapCards(safe),
      sessionRecapRows:toArray(safe.sessionRecapRows).length ? toArray(safe.sessionRecapRows) : buildGlobalShoppingCommerceSessionRecapRows(safe),
      trustClosureRows:toArray(safe.trustClosureRows).length ? toArray(safe.trustClosureRows) : buildGlobalShoppingUserTrustClosureRowsForView(safe),
      nextFeatureRows:toArray(safe.nextFeatureRows).length ? toArray(safe.nextFeatureRows) : buildGlobalShoppingNextFeatureReadinessRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("recap_boundary", "当前范围", "当前只展示本次只读全球购会话总结、信任闭环和下一功能准备度", "pass"),
        row("recap_safety", "安全边界", "不打开平台，不接真实 provider，不读取密钥，不构成订单、付款授权或签名", "pass"),
        row("human_approval", "人工审批", "下一步仍需人工审批", "pass")
      ],
      caveat:"当前只展示本次只读全球购会话总结、信任闭环和下一功能准备度，不打开平台，不接真实 provider，不读取密钥，不构成订单、付款授权或签名。",
      readOnlyCommerceSessionRecapCenterSummary:clone(evaluation.readOnlyCommerceSessionRecapCenterSummary),
      userTrustClosureSummarySummary:clone(evaluation.userTrustClosureSummarySummary),
      nextFeatureReadinessGateSummary:clone(evaluation.nextFeatureReadinessGateSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingCommerceSessionRecapViewModel(input) {
    try {
      return sanitizeGlobalShoppingCommerceSessionRecapViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingCommerceSessionRecapViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingCommerceSessionRecapViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingCommerceSessionRecapViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION,
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

  window.WeishanGlobalShoppingCommerceSessionRecapViewModel = {
    GLOBAL_SHOPPING_COMMERCE_SESSION_RECAP_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingCommerceSessionRecapViewModel,
    buildGlobalShoppingCommerceSessionRecapCards,
    buildGlobalShoppingCommerceSessionRecapRows,
    buildGlobalShoppingUserTrustClosureRowsForView,
    buildGlobalShoppingNextFeatureReadinessRowsForView,
    buildGlobalShoppingCommerceSessionRecapViewModelAuditDraft,
    sanitizeGlobalShoppingCommerceSessionRecapViewModel
  };
})();
