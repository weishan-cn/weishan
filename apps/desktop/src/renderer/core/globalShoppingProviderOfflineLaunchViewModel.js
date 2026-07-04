;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_VERSION = "4.2.2";
  const VIEW_MODEL_NAME = "global_shopping_provider_offline_launch_view_model_v1";
  const BUILD_GUARD_KEY = "__weishanGlobalShoppingProviderOfflineLaunchViewModelBuilding";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) {
    const value = text(obj(summary).status || "");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(value) ? value : "needs_review";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
  }

  function buildGlobalShoppingOfflineLaunchDecisionRowsForView(input) {
    const summary = resolveSummary(input, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    return rowsFor(summary, "offline_launch_decision_simulator_missing", "Offline Launch Decision Simulator", "离线发布决策仍需复核");
  }

  function buildGlobalShoppingActivationReceiptRowsForView(input) {
    const summary = resolveSummary(input, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    return rowsFor(summary, "sandbox_activation_receipt_ledger_missing", "Sandbox Activation Receipt Ledger", "Sandbox 激活回执仍需复核");
  }

  function buildGlobalShoppingSecurityRegressionGuardRowsForView(input) {
    const summary = resolveSummary(input, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    return rowsFor(summary, "adapter_security_regression_guard_missing", "Adapter Security Regression Guard", "Adapter 安全回归仍需复核");
  }

  function buildGlobalShoppingOfflineLaunchChecklistRowsForView(input) {
    const summary = resolveSummary(input, "providerOfflineLaunchChecklistSummary", "WeishanGlobalShoppingProviderOfflineLaunchChecklist", "buildGlobalShoppingProviderOfflineLaunchChecklist");
    return rowsFor(summary, "provider_offline_launch_checklist_missing", "Provider Offline Launch Checklist", "离线 Launch Checklist 仍需复核");
  }

  function buildGlobalShoppingProviderOfflineLaunchCards(input) {
    const safe = obj(input);
    const offlineLaunchDecisionSimulatorSummary = resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const providerOfflineLaunchChecklistSummary = resolveSummary(safe, "providerOfflineLaunchChecklistSummary", "WeishanGlobalShoppingProviderOfflineLaunchChecklist", "buildGlobalShoppingProviderOfflineLaunchChecklist");
    return clone([
      card("launch_decision", "Launch Decision", labelOf(offlineLaunchDecisionSimulatorSummary, "离线发布决策仍需复核")),
      card("activation_receipt", "Activation Receipt", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核")),
      card("security_guard", "Security Guard", labelOf(adapterSecurityRegressionGuardSummary, "Adapter 安全回归仍需复核")),
      card("launch_checklist", "Launch Checklist", labelOf(providerOfflineLaunchChecklistSummary, "离线 Launch Checklist 仍需复核")),
      card("risk_disclosure", "风险说明", "Manual offline launch decision 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderOfflineLaunchRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_offline_launch_view_model_status", "Provider 离线 Launch 决策与安全守卫", "当前只展示 provider 离线 launch 决策与安全守卫", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_offline_launch_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderOfflineLaunchViewModel(viewModel) {
    const safe = obj(viewModel);
    const offlineLaunchDecisionSimulatorSummary = resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const providerOfflineLaunchChecklistSummary = resolveSummary(safe, "providerOfflineLaunchChecklistSummary", "WeishanGlobalShoppingProviderOfflineLaunchChecklist", "buildGlobalShoppingProviderOfflineLaunchChecklist");
    const statuses = [
      statusOf(offlineLaunchDecisionSimulatorSummary),
      statusOf(sandboxActivationReceiptLedgerSummary),
      statusOf(adapterSecurityRegressionGuardSummary),
      statusOf(providerOfflineLaunchChecklistSummary)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(offlineLaunchDecisionSimulatorSummary) ||
      !present(sandboxActivationReceiptLedgerSummary) ||
      !present(adapterSecurityRegressionGuardSummary) ||
      !present(providerOfflineLaunchChecklistSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 离线 Launch 决策与安全守卫",
      cards:buildGlobalShoppingProviderOfflineLaunchCards({
        offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary,
        sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary,
        adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary,
        providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary
      }),
      launchDecisionRows:buildGlobalShoppingOfflineLaunchDecisionRowsForView({ offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary }),
      activationReceiptRows:buildGlobalShoppingActivationReceiptRowsForView({ sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary }),
      securityGuardRows:buildGlobalShoppingSecurityRegressionGuardRowsForView({ adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary }),
      launchChecklistRows:buildGlobalShoppingOfflineLaunchChecklistRowsForView({ providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_offline_launch_disclosure_decision", "Offline Launch Decision Simulator", "Launch Decision 不保存真实决策", "pass"),
        row("provider_offline_launch_disclosure_receipt", "Sandbox Activation Receipt Ledger", "Activation Receipt Ledger 不保存真实回执", "pass"),
        row("provider_offline_launch_disclosure_guard", "Adapter Security Regression Guard", "Security Guard 不修改配置、不启用 provider", "pass"),
        row("provider_offline_launch_disclosure_checklist", "Provider Offline Launch Checklist", "Launch Checklist 不创建 release、不 push", "pass"),
        row("provider_offline_launch_disclosure_manual", "风险说明", "Manual offline launch decision 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider 离线 launch 决策与安全守卫，不接真实 provider，不读取密钥，不联网，不创建 release，不 push。",
      offlineLaunchDecisionSimulatorSummary:clone(offlineLaunchDecisionSimulatorSummary),
      sandboxActivationReceiptLedgerSummary:clone(sandboxActivationReceiptLedgerSummary),
      adapterSecurityRegressionGuardSummary:clone(adapterSecurityRegressionGuardSummary),
      providerOfflineLaunchChecklistSummary:clone(providerOfflineLaunchChecklistSummary),
      safeToProceedWithManualOfflineLaunchDecisionReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderOfflineLaunchViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderOfflineLaunchViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_VERSION,
      status:viewModel.status,
      cardCount:toArray(viewModel.cards).length,
      disclosureRowCount:toArray(viewModel.disclosureRows).length,
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

  function buildGlobalShoppingProviderOfflineLaunchViewModel(input) {
    if (window[BUILD_GUARD_KEY] === true) {
      return sanitizeGlobalShoppingProviderOfflineLaunchViewModel({ status:"needs_review" });
    }
    window[BUILD_GUARD_KEY] = true;
    try {
      return sanitizeGlobalShoppingProviderOfflineLaunchViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderOfflineLaunchViewModel({ status:"failed_safe" });
    } finally {
      window[BUILD_GUARD_KEY] = false;
    }
  }

  window.WeishanGlobalShoppingProviderOfflineLaunchViewModel = {
    GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderOfflineLaunchViewModel,
    buildGlobalShoppingProviderOfflineLaunchCards,
    buildGlobalShoppingProviderOfflineLaunchRows,
    buildGlobalShoppingOfflineLaunchDecisionRowsForView,
    buildGlobalShoppingActivationReceiptRowsForView,
    buildGlobalShoppingSecurityRegressionGuardRowsForView,
    buildGlobalShoppingOfflineLaunchChecklistRowsForView,
    buildGlobalShoppingProviderOfflineLaunchViewModelAuditDraft,
    sanitizeGlobalShoppingProviderOfflineLaunchViewModel
  };
})();
