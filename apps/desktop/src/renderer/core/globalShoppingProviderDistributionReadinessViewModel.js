;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_READINESS_VIEW_MODEL_VERSION = "4.1.5";
  const DISTRIBUTION_VIEW_MODEL_NAME = "global_shopping_provider_distribution_readiness_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
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

  function buildGlobalShoppingProviderDistributionReadinessCards(input) {
    const safe = obj(input);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const providerSafetyDistributionMatrixSummary = resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    return clone([
      card("distribution_readiness", "Distribution Readiness", labelOf(offlineDistributionReadinessCenterSummary, "Distribution Readiness 仍需复核")),
      card("no_activation_enforcement", "No-Activation Enforcement", labelOf(noActivationEnforcementLedgerSummary, "No-Activation Enforcement 仍需复核")),
      card("user_trust_summary", "User Trust Summary", labelOf(finalUserTrustSummarySummary, "User Trust Summary 仍需复核")),
      card("safety_matrix", "Safety Matrix", labelOf(providerSafetyDistributionMatrixSummary, "Safety Matrix 仍需复核")),
      card("risk_disclosure", "风险说明", "Human distribution readiness review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingDistributionReadinessRowsForView(input) {
    const summary = resolveSummary(input, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    return rowsFor(summary, "offline_distribution_readiness_center_missing", "Offline Distribution Readiness Center", "Offline Distribution Readiness Center 仍需复核");
  }

  function buildGlobalShoppingNoActivationEnforcementRowsForView(input) {
    const summary = resolveSummary(input, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    return rowsFor(summary, "no_activation_enforcement_ledger_missing", "No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 仍需复核");
  }

  function buildGlobalShoppingUserTrustSummaryRowsForView(input) {
    const summary = resolveSummary(input, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    return rowsFor(summary, "final_user_trust_summary_missing", "Final User Trust Summary", "Final User Trust Summary 仍需复核");
  }

  function buildGlobalShoppingSafetyDistributionRowsForView(input) {
    const summary = resolveSummary(input, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    return rowsFor(summary, "provider_safety_distribution_matrix_missing", "Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 仍需复核");
  }

  function buildGlobalShoppingProviderDistributionReadinessRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_distribution_readiness_view_model_status", "Provider Distribution Readiness Review", "当前只展示 provider distribution readiness review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_distribution_readiness_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderDistributionReadinessViewModel(viewModel) {
    const safe = obj(viewModel);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const providerSafetyDistributionMatrixSummary = resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    const statuses = [
      safeStatus(offlineDistributionReadinessCenterSummary.status),
      safeStatus(noActivationEnforcementLedgerSummary.status),
      safeStatus(finalUserTrustSummarySummary.status),
      safeStatus(providerSafetyDistributionMatrixSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(offlineDistributionReadinessCenterSummary) ||
      !present(noActivationEnforcementLedgerSummary) ||
      !present(finalUserTrustSummarySummary) ||
      !present(providerSafetyDistributionMatrixSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:DISTRIBUTION_VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_READINESS_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Distribution Readiness Review",
      cards:buildGlobalShoppingProviderDistributionReadinessCards({
        offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary,
        noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary,
        finalUserTrustSummarySummary:finalUserTrustSummarySummary,
        providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary
      }),
      distributionReadinessRows:buildGlobalShoppingDistributionReadinessRowsForView({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary }),
      noActivationEnforcementRows:buildGlobalShoppingNoActivationEnforcementRowsForView({ noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary }),
      userTrustSummaryRows:buildGlobalShoppingUserTrustSummaryRowsForView({ finalUserTrustSummarySummary:finalUserTrustSummarySummary }),
      safetyDistributionRows:buildGlobalShoppingSafetyDistributionRowsForView({ providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_distribution_readiness_view_model_disclosure_distribution", "Offline Distribution Readiness Center", "Distribution Readiness 不创建真实分发包", "pass"),
        row("provider_distribution_readiness_view_model_disclosure_enforcement", "No-Activation Enforcement Ledger", "No-Activation Enforcement 不执行真实阻断", "pass"),
        row("provider_distribution_readiness_view_model_disclosure_trust", "Final User Trust Summary", "User Trust Summary 不写文件、不保存用户原文", "pass"),
        row("provider_distribution_readiness_view_model_disclosure_matrix", "Provider Safety Distribution Matrix", "Safety Matrix 不启用 provider、不激活 sandbox", "pass"),
        row("provider_distribution_readiness_view_model_disclosure_manual", "风险说明", "Human distribution readiness review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderDistributionReadinessRows({ status:status }),
      caveat:"当前只展示 provider distribution readiness review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包。",
      offlineDistributionReadinessCenterSummary:clone(offlineDistributionReadinessCenterSummary),
      noActivationEnforcementLedgerSummary:clone(noActivationEnforcementLedgerSummary),
      finalUserTrustSummarySummary:clone(finalUserTrustSummarySummary),
      providerSafetyDistributionMatrixSummary:clone(providerSafetyDistributionMatrixSummary),
      safeToProceedWithHumanDistributionReadinessReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderDistributionReadinessViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderDistributionReadinessViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_READINESS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:DISTRIBUTION_VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_READINESS_VIEW_MODEL_VERSION,
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
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function buildGlobalShoppingProviderDistributionReadinessViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderDistributionReadinessViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderDistributionReadinessViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderDistributionReadinessViewModel = {
    GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_READINESS_VIEW_MODEL_VERSION,
    DISTRIBUTION_VIEW_MODEL_NAME,
    buildGlobalShoppingProviderDistributionReadinessViewModel,
    buildGlobalShoppingProviderDistributionReadinessCards,
    buildGlobalShoppingProviderDistributionReadinessRows,
    buildGlobalShoppingDistributionReadinessRowsForView,
    buildGlobalShoppingNoActivationEnforcementRowsForView,
    buildGlobalShoppingUserTrustSummaryRowsForView,
    buildGlobalShoppingSafetyDistributionRowsForView,
    buildGlobalShoppingProviderDistributionReadinessViewModelAuditDraft,
    sanitizeGlobalShoppingProviderDistributionReadinessViewModel
  };
})();
