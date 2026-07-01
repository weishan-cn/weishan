;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_VERSION = "3.8.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_trust_closure_view_model_v1";

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

  function buildGlobalShoppingProviderTrustClosureCards(input) {
    const safe = obj(input);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    return clone([
      card("public_trust_closure", "Public Trust Closure", labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核")),
      card("release_memory", "Release Memory", labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核")),
      card("no_provider_guard", "No-Provider Guard", labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核")),
      card("safety_boundary", "Safety Boundary", labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核")),
      card("risk_disclosure", "风险说明", "Human trust closure review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingPublicTrustClosureRowsForView(input) {
    const summary = resolveSummary(input, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    return rowsFor(summary, "provider_public_trust_closure_center_missing", "Provider Public Trust Closure Center", "Provider Public Trust Closure Center 仍需复核");
  }

  function buildGlobalShoppingReleaseMemoryRowsForView(input) {
    const summary = resolveSummary(input, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    return rowsFor(summary, "offline_release_memory_snapshot_missing", "Offline Release Memory Snapshot", "Offline Release Memory Snapshot 仍需复核");
  }

  function buildGlobalShoppingNoProviderGuardRowsForView(input) {
    const summary = resolveSummary(input, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    return rowsFor(summary, "no_provider_execution_final_guard_missing", "No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 仍需复核");
  }

  function buildGlobalShoppingSafetyBoundaryRowsForView(input) {
    const summary = resolveSummary(input, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    return rowsFor(summary, "user_visible_safety_boundary_explainer_missing", "User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 仍需复核");
  }

  function buildGlobalShoppingProviderTrustClosureRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_trust_closure_view_model_status", "Provider Trust Closure Review", "当前只展示 provider trust closure review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_trust_closure_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不打开平台。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderTrustClosureViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const statuses = [
      safeStatus(providerPublicTrustClosureCenterSummary.status),
      safeStatus(offlineReleaseMemorySnapshotSummary.status),
      safeStatus(noProviderExecutionFinalGuardSummary.status),
      safeStatus(userVisibleSafetyBoundaryExplainerSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerPublicTrustClosureCenterSummary) ||
      !present(offlineReleaseMemorySnapshotSummary) ||
      !present(noProviderExecutionFinalGuardSummary) ||
      !present(userVisibleSafetyBoundaryExplainerSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Trust Closure Review",
      cards:buildGlobalShoppingProviderTrustClosureCards({
        providerPublicTrustClosureCenterSummary:providerPublicTrustClosureCenterSummary,
        offlineReleaseMemorySnapshotSummary:offlineReleaseMemorySnapshotSummary,
        noProviderExecutionFinalGuardSummary:noProviderExecutionFinalGuardSummary,
        userVisibleSafetyBoundaryExplainerSummary:userVisibleSafetyBoundaryExplainerSummary
      }),
      publicTrustClosureRows:buildGlobalShoppingPublicTrustClosureRowsForView({ providerPublicTrustClosureCenterSummary:providerPublicTrustClosureCenterSummary }),
      releaseMemoryRows:buildGlobalShoppingReleaseMemoryRowsForView({ offlineReleaseMemorySnapshotSummary:offlineReleaseMemorySnapshotSummary }),
      noProviderGuardRows:buildGlobalShoppingNoProviderGuardRowsForView({ noProviderExecutionFinalGuardSummary:noProviderExecutionFinalGuardSummary }),
      safetyBoundaryRows:buildGlobalShoppingSafetyBoundaryRowsForView({ userVisibleSafetyBoundaryExplainerSummary:userVisibleSafetyBoundaryExplainerSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_trust_closure_view_model_disclosure_public", "Public Trust Closure", "Public Trust Closure 不生成真实公开声明", "pass"),
        row("provider_trust_closure_view_model_disclosure_memory", "Release Memory", "Release Memory 不持久化记忆快照", "pass"),
        row("provider_trust_closure_view_model_disclosure_guard", "No-Provider Guard", "No-Provider Guard 不执行真实阻断、不打开平台", "pass"),
        row("provider_trust_closure_view_model_disclosure_boundary", "Safety Boundary", "Safety Boundary 不承诺最低价、最终价或官方背书", "pass"),
        row("provider_trust_closure_view_model_disclosure_manual", "风险说明", "Human trust closure review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderTrustClosureRows({ status:status }),
      caveat:"当前只展示 provider trust closure review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不打开平台。",
      providerPublicTrustClosureCenterSummary:clone(providerPublicTrustClosureCenterSummary),
      offlineReleaseMemorySnapshotSummary:clone(offlineReleaseMemorySnapshotSummary),
      noProviderExecutionFinalGuardSummary:clone(noProviderExecutionFinalGuardSummary),
      userVisibleSafetyBoundaryExplainerSummary:clone(userVisibleSafetyBoundaryExplainerSummary),
      safeToProceedWithHumanTrustClosureReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderTrustClosureViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderTrustClosureViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderTrustClosureViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderTrustClosureViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderTrustClosureViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderTrustClosureViewModel = {
    GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderTrustClosureViewModel,
    buildGlobalShoppingProviderTrustClosureCards,
    buildGlobalShoppingProviderTrustClosureRows,
    buildGlobalShoppingPublicTrustClosureRowsForView,
    buildGlobalShoppingReleaseMemoryRowsForView,
    buildGlobalShoppingNoProviderGuardRowsForView,
    buildGlobalShoppingSafetyBoundaryRowsForView,
    buildGlobalShoppingProviderTrustClosureViewModelAuditDraft,
    sanitizeGlobalShoppingProviderTrustClosureViewModel
  };
})();
