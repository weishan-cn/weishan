;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION = "3.2.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_dry_run_view_model_v1";
  const CAVEAT = "当前只展示 provider sandbox 离线 dry-run，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function hasBlockedBoundary(summary) {
    const safe = obj(summary);
    return safe.startRealProvider === true ||
      safe.startPilot === true ||
      safe.activateSandbox === true ||
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
      safe.download === true ||
      safe.exportRealFile === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      !!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl);
  }

  function buildGlobalShoppingMockProviderResultRowsForView(input) {
    const summary = resolveSummary(input, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("mock_result_normalizer_missing", "Mock 结果归一化", "Mock 结果归一化仍需复核", "warning")]);
  }

  function buildGlobalShoppingManualActivationDryRunRowsForView(input) {
    const summary = resolveSummary(input, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("manual_activation_dry_run_missing", "激活 Dry-run", "激活 Dry-run 仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxDryRunRows(input) {
    const summary = resolveSummary(input, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("offline_trace_missing", "离线 Trace 检查", "离线 Trace 检查仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxDryRunCards(input) {
    const safe = obj(input);
    const traceInspector = resolveSummary(safe, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    const resultNormalizer = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const dryRunChecklist = resolveSummary(safe, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    return clone([
      card("offline_trace", "离线 Trace 检查", obj(traceInspector.userFacingSummary).resultLabel || "离线 Trace 检查仍需复核"),
      card("mock_result_normalizer", "Mock 结果归一化", obj(resultNormalizer.userFacingSummary).resultLabel || "Mock 结果归一化仍需复核"),
      card("activation_dry_run", "激活 Dry-run", obj(dryRunChecklist.userFacingSummary).resultLabel || "激活 Dry-run 仍需复核"),
      card("risk_disclosure", "风险说明", "Manual sandbox dry-run 仍需人工复核")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxDryRunViewModel(viewModel) {
    const safe = obj(viewModel);
    const offlineSandboxTraceInspectorSummary = resolveSummary(safe, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    const mockProviderResultNormalizerSummary = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const manualActivationDryRunChecklistSummary = resolveSummary(safe, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    const blocked =
      hasBlockedBoundary(safe) ||
      hasBlockedBoundary(offlineSandboxTraceInspectorSummary) ||
      hasBlockedBoundary(mockProviderResultNormalizerSummary) ||
      hasBlockedBoundary(manualActivationDryRunChecklistSummary) ||
      statusOf(offlineSandboxTraceInspectorSummary) === "blocked" ||
      statusOf(mockProviderResultNormalizerSummary) === "blocked" ||
      statusOf(manualActivationDryRunChecklistSummary) === "blocked";
    const needsReview = !blocked && (!present(offlineSandboxTraceInspectorSummary) || !present(mockProviderResultNormalizerSummary) || !present(manualActivationDryRunChecklistSummary));
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox 离线 Dry-run",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderSandboxDryRunCards(safe),
      offlineTraceRows:toArray(safe.offlineTraceRows).length ? toArray(safe.offlineTraceRows) : buildGlobalShoppingProviderSandboxDryRunRows(safe),
      mockResultRows:toArray(safe.mockResultRows).length ? toArray(safe.mockResultRows) : buildGlobalShoppingMockProviderResultRowsForView(safe),
      activationDryRunRows:toArray(safe.activationDryRunRows).length ? toArray(safe.activationDryRunRows) : buildGlobalShoppingManualActivationDryRunRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("offline_trace_disclosure", "离线 Trace 检查不保存 raw trace", "离线 Trace 检查不保存 raw trace", "pass"),
        row("mock_result_disclosure", "Mock 结果归一化不处理真实 provider response", "Mock 结果归一化不处理真实 provider response", "pass"),
        row("activation_dry_run_disclosure", "激活 Dry-run 不激活 sandbox、不创建 release", "激活 Dry-run 不激活 sandbox、不创建 release", "pass"),
        row("manual_review_disclosure", "Manual sandbox dry-run 仍需人工复核", "Manual sandbox dry-run 仍需人工复核", "warning")
      ],
      offlineSandboxTraceInspectorSummary:clone(offlineSandboxTraceInspectorSummary),
      mockProviderResultNormalizerSummary:clone(mockProviderResultNormalizerSummary),
      manualActivationDryRunChecklistSummary:clone(manualActivationDryRunChecklistSummary),
      caveat:CAVEAT,
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxDryRunViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxDryRunViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderSandboxDryRunViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderSandboxDryRunViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderSandboxDryRunViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
      status:viewModel.status,
      cardCount:viewModel.cards.length,
      offlineTraceRowCount:viewModel.offlineTraceRows.length,
      mockResultRowCount:viewModel.mockResultRows.length,
      activationDryRunRowCount:viewModel.activationDryRunRows.length,
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

  window.WeishanGlobalShoppingProviderSandboxDryRunViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxDryRunViewModel,
    buildGlobalShoppingProviderSandboxDryRunCards,
    buildGlobalShoppingProviderSandboxDryRunRows,
    buildGlobalShoppingMockProviderResultRowsForView,
    buildGlobalShoppingManualActivationDryRunRowsForView,
    buildGlobalShoppingProviderSandboxDryRunViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxDryRunViewModel
  };
})();
