;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION = "4.1.3";
  const VIEW_MODEL_NAME = "global_shopping_provider_launch_readiness_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      return row(safe.rowId || safe.gateId || safe.stepId || ("row_" + index), safe.label || fallbackLabel || "摘要", safe.value || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", safe);
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", safe);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const blocked =
      statusOf(mockProviderAdapterRegistryRuntimeSummary) === "blocked" ||
      statusOf(providerContractReplayHarnessSummary) === "blocked" ||
      statusOf(providerLaunchReadinessBoardSummary) === "blocked" ||
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
      safe.openExternalDoc === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(mockProviderAdapterRegistryRuntimeSummary) === "ready" &&
      statusOf(providerContractReplayHarnessSummary) === "ready" &&
      statusOf(providerLaunchReadinessBoardSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockProviderAdapterRegistryRuntimeSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      blockedReasons:blocked ? ["provider_launch_readiness_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchReadinessCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("mock_adapter_registry", "Mock Adapter 注册", obj(obj(evaluation.mockProviderAdapterRegistryRuntimeSummary).userFacingSummary).resultLabel || "Mock Adapter 注册仍需复核"),
      card("contract_replay", "合同回放", obj(obj(evaluation.providerContractReplayHarnessSummary).userFacingSummary).resultLabel || "合同回放仍需复核"),
      card("launch_readiness", "启动准备", obj(obj(evaluation.providerLaunchReadinessBoardSummary).userFacingSummary).resultLabel || "启动准备仍需复核"),
      card("risk_disclosure", "风险说明", "真实 sandbox provider 仍需人工审批")
    ]);
  }

  function buildGlobalShoppingProviderLaunchReadinessRows(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.mockProviderAdapterRegistryRuntimeSummary).rows, "Mock Adapter 注册");
  }

  function buildGlobalShoppingProviderContractReplayRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.providerContractReplayHarnessSummary).rows, "合同回放");
  }

  function buildGlobalShoppingProviderLaunchGateRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.providerLaunchReadinessBoardSummary).rows, "启动准备");
  }

  function buildGlobalShoppingProviderLaunchReadinessViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderLaunchReadinessViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION,
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

  function sanitizeGlobalShoppingProviderLaunchReadinessViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 启动准备与合同回放",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderLaunchReadinessCards(safe),
      mockAdapterRows:toArray(safe.mockAdapterRows).length ? toArray(safe.mockAdapterRows) : buildGlobalShoppingProviderLaunchReadinessRows(safe),
      contractReplayRows:toArray(safe.contractReplayRows).length ? toArray(safe.contractReplayRows) : buildGlobalShoppingProviderContractReplayRowsForView(safe),
      launchReadinessRows:toArray(safe.launchReadinessRows).length ? toArray(safe.launchReadinessRows) : buildGlobalShoppingProviderLaunchGateRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_launch_scope", "当前范围", "当前只展示 provider 启动准备和合同回放", "pass"),
        row("provider_launch_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider", "pass"),
        row("provider_launch_replay_boundary", "合同回放边界", "合同回放不回放 raw request 或 raw response", "pass"),
        row("provider_launch_human_approval", "人工审批", "真实 sandbox provider 仍需人工审批", "pass")
      ],
      caveat:"当前只展示 provider 启动准备和合同回放，不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider。",
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchReadinessViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderLaunchReadinessViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLaunchReadinessViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchReadinessViewModel = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderLaunchReadinessViewModel,
    buildGlobalShoppingProviderLaunchReadinessCards,
    buildGlobalShoppingProviderLaunchReadinessRows,
    buildGlobalShoppingProviderContractReplayRowsForView,
    buildGlobalShoppingProviderLaunchGateRowsForView,
    buildGlobalShoppingProviderLaunchReadinessViewModelAuditDraft,
    sanitizeGlobalShoppingProviderLaunchReadinessViewModel
  };
})();
