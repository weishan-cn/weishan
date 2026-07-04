;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_provider_pilot_control_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
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
      return row(
        safe.rowId || safe.panelId || safe.categoryId || safe.stepId || ("row_" + index),
        safe.label || fallbackLabel || "摘要",
        safe.value || safe.summary || "",
        safe.status === "pass" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")
      );
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom", safe);
    const mockProviderIncidentDrillSummary = resolveSummary(safe, "mockProviderIncidentDrillSummary", "WeishanGlobalShoppingMockProviderIncidentDrill", "buildGlobalShoppingMockProviderIncidentDrill", safe);
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix", safe);
    const blocked =
      statusOf(providerSandboxPilotControlRoomSummary) === "blocked" ||
      statusOf(mockProviderIncidentDrillSummary) === "blocked" ||
      statusOf(productionBlockerMatrixSummary) === "blocked" ||
      safe.startRealProvider === true ||
      safe.showCredentialInput === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.enableProductionProvider === true ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDocument === true ||
      safe.executeRollback === true ||
      safe.modifyRuntimeConfig === true ||
      safe.enableProvider === true ||
      safe.disableProvider === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(providerSandboxPilotControlRoomSummary) === "ready" &&
      statusOf(mockProviderIncidentDrillSummary) === "ready" &&
      statusOf(productionBlockerMatrixSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      providerSandboxPilotControlRoomSummary:clone(providerSandboxPilotControlRoomSummary),
      mockProviderIncidentDrillSummary:clone(mockProviderIncidentDrillSummary),
      productionBlockerMatrixSummary:clone(productionBlockerMatrixSummary),
      blockedReasons:blocked ? ["provider_pilot_control_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderPilotControlCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("pilot_control", "Pilot 控制室", obj(obj(evaluation.providerSandboxPilotControlRoomSummary).userFacingSummary).resultLabel || "Sandbox Pilot 控制室仍需复核"),
      card("incident_drill", "事故演练", obj(obj(evaluation.mockProviderIncidentDrillSummary).userFacingSummary).resultLabel || "Mock 事故演练仍需复核"),
      card("production_blockers", "阻断矩阵", obj(obj(evaluation.productionBlockerMatrixSummary).userFacingSummary).resultLabel || "Production 阻断矩阵仍需复核"),
      card("risk_disclosure", "风险说明", "Human-controlled pilot 仍需人工审批")
    ]);
  }

  function buildGlobalShoppingProviderPilotControlRows(input) {
    return rowsFrom(obj(evaluate(input).providerSandboxPilotControlRoomSummary).rows, "Pilot 控制室");
  }

  function buildGlobalShoppingMockIncidentRowsForView(input) {
    return rowsFrom(obj(evaluate(input).mockProviderIncidentDrillSummary).rows, "事故演练");
  }

  function buildGlobalShoppingProductionBlockerRowsForView(input) {
    return rowsFrom(obj(evaluate(input).productionBlockerMatrixSummary).rows, "阻断矩阵");
  }

  function buildGlobalShoppingProviderPilotControlViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderPilotControlViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION,
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

  function sanitizeGlobalShoppingProviderPilotControlViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox Pilot 控制与阻断",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderPilotControlCards(safe),
      pilotControlRows:toArray(safe.pilotControlRows).length ? toArray(safe.pilotControlRows) : buildGlobalShoppingProviderPilotControlRows(safe),
      incidentDrillRows:toArray(safe.incidentDrillRows).length ? toArray(safe.incidentDrillRows) : buildGlobalShoppingMockIncidentRowsForView(safe),
      productionBlockerRows:toArray(safe.productionBlockerRows).length ? toArray(safe.productionBlockerRows) : buildGlobalShoppingProductionBlockerRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("pilot_control_scope", "当前范围", "当前只展示 sandbox pilot 控制、mock 事故演练和 production 阻断矩阵", "pass"),
        row("pilot_control_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚", "pass"),
        row("pilot_control_human_gate", "人工审批", "Human-controlled pilot 仍需人工审批", "pass"),
        row("pilot_control_config", "配置边界", "不提供启用 provider、修改配置、生成 endpoint 或邮件动作", "pass")
      ],
      caveat:"当前只展示 sandbox pilot 控制、mock 事故演练和 production 阻断矩阵，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚。",
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderPilotControlViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderPilotControlViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderPilotControlViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderPilotControlViewModel = {
    GLOBAL_SHOPPING_PROVIDER_PILOT_CONTROL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderPilotControlViewModel,
    buildGlobalShoppingProviderPilotControlCards,
    buildGlobalShoppingProviderPilotControlRows,
    buildGlobalShoppingMockIncidentRowsForView,
    buildGlobalShoppingProductionBlockerRowsForView,
    buildGlobalShoppingProviderPilotControlViewModelAuditDraft,
    sanitizeGlobalShoppingProviderPilotControlViewModel
  };
})();
