;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_PLANNING_VIEW_MODEL_VERSION = "2.3.2";
  const VIEW_MODEL_NAME = "global_shopping_sandbox_provider_planning_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      return row(safe.rowId || safe.requirementId || safe.stageId || ("row_" + index), safe.label || fallbackLabel || "摘要", safe.value || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const integrationBlueprintSummary = resolveSummary(safe, "readOnlySandboxProviderIntegrationBlueprintSummary", "WeishanGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", "buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint", safe);
    const credentialIsolationReadinessBoardSummary = resolveSummary(safe, "credentialIsolationReadinessBoardSummary", "WeishanGlobalShoppingCredentialIsolationReadinessBoard", "buildGlobalShoppingCredentialIsolationReadinessBoard", safe);
    const providerContractSelectionBoardSummary = resolveSummary(safe, "providerContractSelectionBoardSummary", "WeishanGlobalShoppingProviderContractSelectionBoard", "buildGlobalShoppingProviderContractSelectionBoard", safe);
    const blocked =
      statusOf(integrationBlueprintSummary) === "blocked" ||
      statusOf(credentialIsolationReadinessBoardSummary) === "blocked" ||
      statusOf(providerContractSelectionBoardSummary) === "blocked" ||
      safe.startRealProviderIntegration === true ||
      safe.showCredentialInput === true ||
      safe.readRealApiKey === true ||
      safe.callNetwork === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.enableProductionProvider === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(integrationBlueprintSummary) === "ready" &&
      statusOf(credentialIsolationReadinessBoardSummary) === "ready" &&
      statusOf(providerContractSelectionBoardSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      readOnlySandboxProviderIntegrationBlueprintSummary:integrationBlueprintSummary,
      credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary,
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary,
      blockedReasons:blocked ? ["sandbox_provider_planning_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderPlanningCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("integration_blueprint", "接入蓝图", obj(obj(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary).userFacingSummary).resultLabel || "接入蓝图仍需复核"),
      card("credential_isolation", "凭证隔离", obj(obj(evaluation.credentialIsolationReadinessBoardSummary).userFacingSummary).resultLabel || "凭证隔离仍需复核"),
      card("provider_contract", "Provider 选择", obj(obj(evaluation.providerContractSelectionBoardSummary).userFacingSummary).resultLabel || "Provider 选择仍需复核"),
      card("risk_disclosure", "风险说明", "下一步仍需人工法务与安全审批")
    ]);
  }

  function buildGlobalShoppingSandboxProviderPlanningRows(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary).rows, "接入蓝图");
  }
  function buildGlobalShoppingCredentialIsolationRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.credentialIsolationReadinessBoardSummary).rows, "凭证隔离");
  }
  function buildGlobalShoppingProviderContractRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.providerContractSelectionBoardSummary).rows, "Provider 选择");
  }

  function sanitizeGlobalShoppingSandboxProviderPlanningViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_PLANNING_VIEW_MODEL_VERSION,
      status:status,
      title:"只读 Sandbox Provider 接入规划",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxProviderPlanningCards(safe),
      blueprintRows:toArray(safe.blueprintRows).length ? toArray(safe.blueprintRows) : buildGlobalShoppingSandboxProviderPlanningRows(safe),
      credentialRows:toArray(safe.credentialRows).length ? toArray(safe.credentialRows) : buildGlobalShoppingCredentialIsolationRowsForView(safe),
      providerContractRows:toArray(safe.providerContractRows).length ? toArray(safe.providerContractRows) : buildGlobalShoppingProviderContractRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("planning_scope", "当前范围", "当前只展示只读 sandbox provider 接入规划", "pass"),
        row("planning_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider", "pass"),
        row("planning_human_approval", "人工审批", "下一步仍需人工法务与安全审批", "pass")
      ],
      caveat:"当前只展示只读 sandbox provider 接入规划，不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider。",
      readOnlySandboxProviderIntegrationBlueprintSummary:clone(evaluation.readOnlySandboxProviderIntegrationBlueprintSummary),
      credentialIsolationReadinessBoardSummary:clone(evaluation.credentialIsolationReadinessBoardSummary),
      providerContractSelectionBoardSummary:clone(evaluation.providerContractSelectionBoardSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderPlanningViewModel(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderPlanningViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxProviderPlanningViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingSandboxProviderPlanningViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingSandboxProviderPlanningViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_PLANNING_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_PLANNING_VIEW_MODEL_VERSION,
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

  window.WeishanGlobalShoppingSandboxProviderPlanningViewModel = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_PLANNING_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingSandboxProviderPlanningViewModel,
    buildGlobalShoppingSandboxProviderPlanningCards,
    buildGlobalShoppingSandboxProviderPlanningRows,
    buildGlobalShoppingCredentialIsolationRowsForView,
    buildGlobalShoppingProviderContractRowsForView,
    buildGlobalShoppingSandboxProviderPlanningViewModelAuditDraft,
    sanitizeGlobalShoppingSandboxProviderPlanningViewModel
  };
})();
