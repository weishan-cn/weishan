;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_VERSION = "2.3.2";
  const VIEW_MODEL_NAME = "global_shopping_provider_mock_runtime_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      return row(safe.rowId || safe.clauseId || safe.stageId || ("row_" + index), safe.label || fallbackLabel || "摘要", safe.value || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const sandboxProviderMockRuntimeSummary = resolveSummary(safe, "sandboxProviderMockRuntimeSummary", "WeishanGlobalShoppingSandboxProviderMockRuntime", "buildGlobalShoppingSandboxProviderMockRuntime", safe);
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", safe);
    const legalApprovalWorkflowBoardSummary = resolveSummary(safe, "legalApprovalWorkflowBoardSummary", "WeishanGlobalShoppingLegalApprovalWorkflowBoard", "buildGlobalShoppingLegalApprovalWorkflowBoard", safe);
    const blocked =
      statusOf(sandboxProviderMockRuntimeSummary) === "blocked" ||
      statusOf(vaultBoundaryContractSummary) === "blocked" ||
      statusOf(legalApprovalWorkflowBoardSummary) === "blocked" ||
      safe.startRealIntegration === true ||
      safe.readRealApiKey === true ||
      safe.showCredentialInput === true ||
      safe.callNetwork === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDoc === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(sandboxProviderMockRuntimeSummary) === "ready" &&
      statusOf(vaultBoundaryContractSummary) === "ready" &&
      statusOf(legalApprovalWorkflowBoardSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
      safeToProceedWithMockAdapterRuntimeHardening:obj(sandboxProviderMockRuntimeSummary).safeToProceedWithMockAdapterRuntimeHardening === true && !blocked,
      blockedReasons:blocked ? ["provider_mock_runtime_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderMockRuntimeCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("mock_runtime", "Mock Runtime", obj(obj(evaluation.sandboxProviderMockRuntimeSummary).userFacingSummary).resultLabel || "Sandbox Provider Mock Runtime 仍需复核"),
      card("vault_boundary", "Vault 边界", obj(obj(evaluation.vaultBoundaryContractSummary).userFacingSummary).resultLabel || "Vault 边界合同仍需复核"),
      card("legal_approval", "法务审批流程", obj(obj(evaluation.legalApprovalWorkflowBoardSummary).userFacingSummary).resultLabel || "法务审批流程板仍需复核"),
      card("risk_disclosure", "风险说明", "下一步仍需人工审批")
    ]);
  }

  function buildGlobalShoppingProviderMockRuntimeRows(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.sandboxProviderMockRuntimeSummary).rows, "Mock Runtime");
  }
  function buildGlobalShoppingVaultBoundaryRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.vaultBoundaryContractSummary).rows, "Vault 边界");
  }
  function buildGlobalShoppingLegalApprovalRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.legalApprovalWorkflowBoardSummary).rows, "法务审批流程");
  }

  function buildGlobalShoppingProviderMockRuntimeViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderMockRuntimeViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_VERSION,
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

  function sanitizeGlobalShoppingProviderMockRuntimeViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Mock Runtime 与审批准备",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderMockRuntimeCards(safe),
      mockRuntimeRows:toArray(safe.mockRuntimeRows).length ? toArray(safe.mockRuntimeRows) : buildGlobalShoppingProviderMockRuntimeRows(safe),
      vaultBoundaryRows:toArray(safe.vaultBoundaryRows).length ? toArray(safe.vaultBoundaryRows) : buildGlobalShoppingVaultBoundaryRowsForView(safe),
      legalApprovalRows:toArray(safe.legalApprovalRows).length ? toArray(safe.legalApprovalRows) : buildGlobalShoppingLegalApprovalRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("mock_runtime_scope", "当前范围", "当前只展示 provider mock runtime、vault 边界和审批准备", "pass"),
        row("mock_runtime_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider", "pass"),
        row("mock_runtime_approval_boundary", "审批边界", "审批流程不创建任务、不发邮件", "pass"),
        row("mock_runtime_human_review", "人工审批", "下一步仍需人工审批", "pass")
      ],
      caveat:"当前只展示 provider mock runtime、vault 边界和审批准备，不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider。",
      sandboxProviderMockRuntimeSummary:clone(evaluation.sandboxProviderMockRuntimeSummary),
      vaultBoundaryContractSummary:clone(evaluation.vaultBoundaryContractSummary),
      legalApprovalWorkflowBoardSummary:clone(evaluation.legalApprovalWorkflowBoardSummary),
      safeToProceedWithMockAdapterRuntimeHardening:evaluation.safeToProceedWithMockAdapterRuntimeHardening,
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderMockRuntimeViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderMockRuntimeViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderMockRuntimeViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderMockRuntimeViewModel = {
    GLOBAL_SHOPPING_PROVIDER_MOCK_RUNTIME_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderMockRuntimeViewModel,
    buildGlobalShoppingProviderMockRuntimeCards,
    buildGlobalShoppingProviderMockRuntimeRows,
    buildGlobalShoppingVaultBoundaryRowsForView,
    buildGlobalShoppingLegalApprovalRowsForView,
    buildGlobalShoppingProviderMockRuntimeViewModelAuditDraft,
    sanitizeGlobalShoppingProviderMockRuntimeViewModel
  };
})();
