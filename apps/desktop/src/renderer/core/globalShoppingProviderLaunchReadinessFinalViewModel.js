;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_VERSION = "4.2.3";
  const VIEW_MODEL_NAME = "global_shopping_provider_launch_readiness_final_view_model_v1";

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
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
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

  function buildGlobalShoppingProviderLaunchReadinessFinalCards(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineLaunchReadinessFinalizerSummary = resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    const userSafePublicClaimVerifierSummary = resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    return clone([
      card("release_evidence", "Release Evidence", labelOf(publicReleaseEvidenceConsoleSummary, "Public Release Evidence Console 仍需复核")),
      card("user_assurance", "User Assurance", labelOf(noProviderUserAssurancePanelSummary, "No-Provider User Assurance Panel 仍需复核")),
      card("launch_finalizer", "Launch Finalizer", labelOf(offlineLaunchReadinessFinalizerSummary, "Offline Launch Readiness Finalizer 仍需复核")),
      card("claim_verifier", "Claim Verifier", labelOf(userSafePublicClaimVerifierSummary, "User-Safe Public Claim Verifier 仍需复核")),
      card("risk_disclosure", "风险说明", "Human launch readiness final review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingPublicReleaseEvidenceRowsForView(input) {
    const summary = resolveSummary(input, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    return rowsFor(summary, "public_release_evidence_console_missing", "Public Release Evidence Console", "Public Release Evidence Console 仍需复核");
  }

  function buildGlobalShoppingNoProviderAssuranceRowsForView(input) {
    const summary = resolveSummary(input, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    return rowsFor(summary, "no_provider_user_assurance_panel_missing", "No-Provider User Assurance Panel", "No-Provider User Assurance Panel 仍需复核");
  }

  function buildGlobalShoppingLaunchReadinessFinalizerRowsForView(input) {
    const summary = resolveSummary(input, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    return rowsFor(summary, "offline_launch_readiness_finalizer_missing", "Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 仍需复核");
  }

  function buildGlobalShoppingPublicClaimVerifierRowsForView(input) {
    const summary = resolveSummary(input, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    return rowsFor(summary, "user_safe_public_claim_verifier_missing", "User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 仍需复核");
  }

  function buildGlobalShoppingProviderLaunchReadinessFinalRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_launch_readiness_final_view_model_status", "Provider Launch Readiness Final Review", "当前只展示 provider launch readiness final review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_launch_readiness_final_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不执行真实 launch。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderLaunchReadinessFinalViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineLaunchReadinessFinalizerSummary = resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    const userSafePublicClaimVerifierSummary = resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    const statuses = [
      safeStatus(publicReleaseEvidenceConsoleSummary.status),
      safeStatus(noProviderUserAssurancePanelSummary.status),
      safeStatus(offlineLaunchReadinessFinalizerSummary.status),
      safeStatus(userSafePublicClaimVerifierSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicReleaseEvidenceConsoleSummary) ||
      !present(noProviderUserAssurancePanelSummary) ||
      !present(offlineLaunchReadinessFinalizerSummary) ||
      !present(userSafePublicClaimVerifierSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Launch Readiness Final Review",
      cards:buildGlobalShoppingProviderLaunchReadinessFinalCards({
        publicReleaseEvidenceConsoleSummary:publicReleaseEvidenceConsoleSummary,
        noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary,
        offlineLaunchReadinessFinalizerSummary:offlineLaunchReadinessFinalizerSummary,
        userSafePublicClaimVerifierSummary:userSafePublicClaimVerifierSummary
      }),
      publicReleaseEvidenceRows:buildGlobalShoppingPublicReleaseEvidenceRowsForView({ publicReleaseEvidenceConsoleSummary:publicReleaseEvidenceConsoleSummary }),
      noProviderAssuranceRows:buildGlobalShoppingNoProviderAssuranceRowsForView({ noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary }),
      launchReadinessFinalizerRows:buildGlobalShoppingLaunchReadinessFinalizerRowsForView({ offlineLaunchReadinessFinalizerSummary:offlineLaunchReadinessFinalizerSummary }),
      publicClaimVerifierRows:buildGlobalShoppingPublicClaimVerifierRowsForView({ userSafePublicClaimVerifierSummary:userSafePublicClaimVerifierSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_launch_readiness_final_disclosure_release_evidence", "Release Evidence", "Release Evidence 不生成真实证据文件", "pass"),
        row("provider_launch_readiness_final_disclosure_user_assurance", "User Assurance", "User Assurance 不生成真实用户保证书", "pass"),
        row("provider_launch_readiness_final_disclosure_launch_finalizer", "Launch Finalizer", "Launch Finalizer 不执行真实 launch", "pass"),
        row("provider_launch_readiness_final_disclosure_claim_verifier", "Claim Verifier", "Claim Verifier 不承诺最低价、最终价或官方背书", "pass"),
        row("provider_launch_readiness_final_disclosure_manual", "风险说明", "Human launch readiness final review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderLaunchReadinessFinalRows({ status:status }),
      caveat:"当前只展示 provider launch readiness final review，不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不执行真实 launch。",
      publicReleaseEvidenceConsoleSummary:clone(publicReleaseEvidenceConsoleSummary),
      noProviderUserAssurancePanelSummary:clone(noProviderUserAssurancePanelSummary),
      offlineLaunchReadinessFinalizerSummary:clone(offlineLaunchReadinessFinalizerSummary),
      userSafePublicClaimVerifierSummary:clone(userSafePublicClaimVerifierSummary),
      safeToProceedWithHumanLaunchReadinessFinalReview:status === "ready",
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchReadinessFinalViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderLaunchReadinessFinalViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderLaunchReadinessFinalViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderLaunchReadinessFinalViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLaunchReadinessFinalViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchReadinessFinalViewModel = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderLaunchReadinessFinalViewModel,
    buildGlobalShoppingProviderLaunchReadinessFinalCards,
    buildGlobalShoppingProviderLaunchReadinessFinalRows,
    buildGlobalShoppingPublicReleaseEvidenceRowsForView,
    buildGlobalShoppingNoProviderAssuranceRowsForView,
    buildGlobalShoppingLaunchReadinessFinalizerRowsForView,
    buildGlobalShoppingPublicClaimVerifierRowsForView,
    buildGlobalShoppingProviderLaunchReadinessFinalViewModelAuditDraft,
    sanitizeGlobalShoppingProviderLaunchReadinessFinalViewModel
  };
})();
