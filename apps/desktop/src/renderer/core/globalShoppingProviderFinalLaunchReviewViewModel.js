;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_VERSION = "4.2.1";
  const VIEW_MODEL_NAME = "global_shopping_provider_final_launch_review_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
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

  function buildGlobalShoppingLaunchAuditSnapshotRowsForView(input) {
    const summary = resolveSummary(input, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    return rowsFor(summary, "provider_launch_audit_snapshot_missing", "Provider Launch Audit Snapshot", "Launch Audit Snapshot 仍需复核");
  }

  function buildGlobalShoppingPolicyReplayRowsForView(input) {
    const summary = resolveSummary(input, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    return rowsFor(summary, "offline_policy_replay_center_missing", "Offline Policy Replay Center", "Policy Replay Center 仍需复核");
  }

  function buildGlobalShoppingFinalDossierRowsForView(input) {
    const summary = resolveSummary(input, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    return rowsFor(summary, "human_activation_final_dossier_missing", "Human Activation Final Dossier", "Final Dossier 仍需复核");
  }

  function buildGlobalShoppingBoundaryVerifierRowsForView(input) {
    const summary = resolveSummary(input, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    return rowsFor(summary, "adapter_launch_boundary_verifier_missing", "Adapter Launch Boundary Verifier", "Boundary Verifier 仍需复核");
  }

  function buildGlobalShoppingProviderFinalLaunchReviewCards(input) {
    const safe = obj(input);
    const providerLaunchAuditSnapshotSummary = resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    const offlinePolicyReplayCenterSummary = resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const adapterLaunchBoundaryVerifierSummary = resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    return clone([
      card("launch_audit", "Launch Audit", labelOf(providerLaunchAuditSnapshotSummary, "Launch Audit Snapshot 仍需复核")),
      card("policy_replay", "Policy Replay", labelOf(offlinePolicyReplayCenterSummary, "Policy Replay Center 仍需复核")),
      card("final_dossier", "Final Dossier", labelOf(humanActivationFinalDossierSummary, "Final Dossier 仍需复核")),
      card("boundary_verifier", "Boundary Verifier", labelOf(adapterLaunchBoundaryVerifierSummary, "Boundary Verifier 仍需复核")),
      card("risk_disclosure", "风险说明", "Human final launch review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderFinalLaunchReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_final_launch_review_view_model_status", "Provider Final Launch Review", "当前只展示 provider final launch review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_final_launch_review_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderFinalLaunchReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerLaunchAuditSnapshotSummary = resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    const offlinePolicyReplayCenterSummary = resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const adapterLaunchBoundaryVerifierSummary = resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    const statuses = [
      statusOf(providerLaunchAuditSnapshotSummary),
      statusOf(offlinePolicyReplayCenterSummary),
      statusOf(humanActivationFinalDossierSummary),
      statusOf(adapterLaunchBoundaryVerifierSummary)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerLaunchAuditSnapshotSummary) ||
      !present(offlinePolicyReplayCenterSummary) ||
      !present(humanActivationFinalDossierSummary) ||
      !present(adapterLaunchBoundaryVerifierSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Final Launch Review",
      cards:buildGlobalShoppingProviderFinalLaunchReviewCards({
        providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary,
        offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary,
        humanActivationFinalDossierSummary:humanActivationFinalDossierSummary,
        adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary
      }),
      launchAuditRows:buildGlobalShoppingLaunchAuditSnapshotRowsForView({ providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary }),
      policyReplayRows:buildGlobalShoppingPolicyReplayRowsForView({ offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary }),
      finalDossierRows:buildGlobalShoppingFinalDossierRowsForView({ humanActivationFinalDossierSummary:humanActivationFinalDossierSummary }),
      boundaryVerifierRows:buildGlobalShoppingBoundaryVerifierRowsForView({ adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_final_launch_review_disclosure_launch_audit", "Provider Launch Audit Snapshot", "Launch Audit 不写文件、不保存真实决策", "pass"),
        row("provider_final_launch_review_disclosure_policy_replay", "Offline Policy Replay Center", "Policy Replay 不修改配置、不启用 provider", "pass"),
        row("provider_final_launch_review_disclosure_final_dossier", "Human Activation Final Dossier", "Final Dossier 不持久化档案", "pass"),
        row("provider_final_launch_review_disclosure_boundary_verifier", "Adapter Launch Boundary Verifier", "Boundary Verifier 不生成 endpoint、不读取密钥", "pass"),
        row("provider_final_launch_review_disclosure_manual", "风险说明", "Human final launch review 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider final launch review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。",
      providerLaunchAuditSnapshotSummary:clone(providerLaunchAuditSnapshotSummary),
      offlinePolicyReplayCenterSummary:clone(offlinePolicyReplayCenterSummary),
      humanActivationFinalDossierSummary:clone(humanActivationFinalDossierSummary),
      adapterLaunchBoundaryVerifierSummary:clone(adapterLaunchBoundaryVerifierSummary),
      safeToProceedWithHumanFinalLaunchReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderFinalLaunchReviewViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderFinalLaunchReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderFinalLaunchReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderFinalLaunchReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderFinalLaunchReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderFinalLaunchReviewViewModel = {
    GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderFinalLaunchReviewViewModel,
    buildGlobalShoppingProviderFinalLaunchReviewCards,
    buildGlobalShoppingProviderFinalLaunchReviewRows,
    buildGlobalShoppingLaunchAuditSnapshotRowsForView,
    buildGlobalShoppingPolicyReplayRowsForView,
    buildGlobalShoppingFinalDossierRowsForView,
    buildGlobalShoppingBoundaryVerifierRowsForView,
    buildGlobalShoppingProviderFinalLaunchReviewViewModelAuditDraft,
    sanitizeGlobalShoppingProviderFinalLaunchReviewViewModel
  };
})();
