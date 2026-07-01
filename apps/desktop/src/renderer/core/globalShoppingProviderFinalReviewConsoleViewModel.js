;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_VERSION = "3.3.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_final_review_console_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
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
  function statusOf(summary) { return safeStatus(obj(summary).status || ""); }
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
  }

  function buildGlobalShoppingFinalReviewConsoleCards(input) {
    const safe = obj(input);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const offlineProviderReadinessDecisionMatrixSummary = resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix");
    return clone([
      card("final_offline_launch_review_console", "Final Review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Review 仍需复核")),
      card("provider_activation_blocker_sentinel", "Activation Blockers", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核")),
      card("read_only_release_evidence_summary", "Evidence Summary", labelOf(readOnlyReleaseEvidenceSummary, "Evidence Summary 仍需复核")),
      card("offline_provider_readiness_decision_matrix", "Decision Matrix", labelOf(offlineProviderReadinessDecisionMatrixSummary, "Decision Matrix 仍需复核")),
      card("risk_disclosure", "风险说明", "Final offline provider review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderFinalReviewConsoleRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_final_review_console_view_model_status", "Provider Final Review Console", "当前只展示 provider final review console", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_final_review_console_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderFinalReviewConsoleViewModel(viewModel) {
    const safe = obj(viewModel);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const offlineProviderReadinessDecisionMatrixSummary = resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix");
    const statuses = [
      statusOf(finalOfflineLaunchReviewConsoleSummary),
      statusOf(providerActivationBlockerSentinelSummary),
      statusOf(readOnlyReleaseEvidenceSummary),
      statusOf(offlineProviderReadinessDecisionMatrixSummary)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(finalOfflineLaunchReviewConsoleSummary) ||
      !present(providerActivationBlockerSentinelSummary) ||
      !present(readOnlyReleaseEvidenceSummary) ||
      !present(offlineProviderReadinessDecisionMatrixSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Final Review Console",
      cards:buildGlobalShoppingFinalReviewConsoleCards({
        finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary,
        providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary,
        readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary,
        offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary
      }),
      finalReviewRows:rowsFor(finalOfflineLaunchReviewConsoleSummary, "final_offline_launch_review_console_missing", "Final Offline Launch Review Console", "Final Review Console 仍需复核"),
      activationBlockerRows:rowsFor(providerActivationBlockerSentinelSummary, "provider_activation_blocker_sentinel_missing", "Provider Activation Blocker Sentinel", "Activation Blockers 仍需复核"),
      releaseEvidenceRows:rowsFor(readOnlyReleaseEvidenceSummary, "read_only_release_evidence_summary_missing", "Read-Only Release Evidence Summary", "Evidence Summary 仍需复核"),
      decisionMatrixRows:rowsFor(offlineProviderReadinessDecisionMatrixSummary, "offline_provider_readiness_decision_matrix_missing", "Offline Provider Readiness Decision Matrix", "Decision Matrix 仍需复核"),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_final_review_console_disclosure_final_review", "Final Offline Launch Review Console", "Final Review 不保存真实决策", "pass"),
        row("provider_final_review_console_disclosure_activation_blocker", "Provider Activation Blocker Sentinel", "Activation Blocker 不修改配置、不启用 provider", "pass"),
        row("provider_final_review_console_disclosure_evidence_summary", "Read-Only Release Evidence Summary", "Evidence Summary 不写文件、不上传", "pass"),
        row("provider_final_review_console_disclosure_decision_matrix", "Offline Provider Readiness Decision Matrix", "Decision Matrix 不创建 release、不 push", "pass"),
        row("provider_final_review_console_disclosure_manual", "风险说明", "Final offline provider review 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider final review console，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。",
      finalOfflineLaunchReviewConsoleSummary:clone(finalOfflineLaunchReviewConsoleSummary),
      providerActivationBlockerSentinelSummary:clone(providerActivationBlockerSentinelSummary),
      readOnlyReleaseEvidenceSummary:clone(readOnlyReleaseEvidenceSummary),
      offlineProviderReadinessDecisionMatrixSummary:clone(offlineProviderReadinessDecisionMatrixSummary),
      safeToProceedWithFinalOfflineProviderReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderFinalReviewConsoleViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderFinalReviewConsoleViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderFinalReviewConsoleViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderFinalReviewConsoleViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderFinalReviewConsoleViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderFinalReviewConsoleViewModel = {
    GLOBAL_SHOPPING_PROVIDER_FINAL_REVIEW_CONSOLE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderFinalReviewConsoleViewModel,
    buildGlobalShoppingFinalReviewConsoleCards,
    buildGlobalShoppingProviderFinalReviewConsoleRows,
    buildGlobalShoppingProviderFinalReviewConsoleViewModelAuditDraft,
    sanitizeGlobalShoppingProviderFinalReviewConsoleViewModel
  };
})();
