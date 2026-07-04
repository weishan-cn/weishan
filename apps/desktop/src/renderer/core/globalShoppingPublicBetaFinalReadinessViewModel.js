;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION = "4.2.2";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_final_readiness_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingFinalReadinessRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_final_readiness_missing", "Public Beta Final Readiness Command Center", "Public Beta Final Readiness Command Center 仍需复核", "warning")];
  }

  function buildGlobalShoppingLaunchBlockerRowsForView(input) {
    const summary = resolveSummary(input, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_launch_blocker_missing", "Offline Launch Blocker Matrix", "Offline Launch Blocker Matrix 仍需复核", "warning")];
  }

  function buildGlobalShoppingNextPhaseDossierRowsForView(input) {
    const summary = resolveSummary(input, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("manual_next_phase_dossier_missing", "Manual Next-Phase Dossier", "Manual Next-Phase Dossier 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaFinalReadinessCards(input) {
    const finalReadiness = resolveSummary(input, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const blockerMatrix = resolveSummary(input, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const dossier = resolveSummary(input, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    return clone([
      card("public_beta_final_readiness_command_center", "Public Beta Final Readiness Command Center", text(obj(finalReadiness.userFacingSummary).resultLabel || "Public Beta Final Readiness Command Center 仍需复核")),
      card("offline_launch_blocker_matrix", "Offline Launch Blocker Matrix", text(obj(blockerMatrix.userFacingSummary).resultLabel || "Offline Launch Blocker Matrix 仍需复核")),
      card("manual_next_phase_dossier", "Manual Next-Phase Dossier", text(obj(dossier.userFacingSummary).resultLabel || "Manual Next-Phase Dossier 仍需复核")),
      card("final_readiness", "Final Readiness", "当前仍是只读 Public Beta 候选"),
      card("launch_blockers", "Launch Blockers", "发布、provider、联网、付款、下单、出票全部保持阻断"),
      card("next_phase_dossier", "Next-Phase Dossier", "下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断"),
      card("manual_review_required", "Manual Review Required", "不创建 release、不 push、不启用交易")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalReadinessRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_final_readiness_view_model", "Public Beta Final Readiness ViewModel", safe.status === "ready" ? "Public Beta Final Readiness ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Final Readiness ViewModel 已阻断" : "Public Beta Final Readiness ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_final_readiness", "Final Readiness", "当前仍是只读 Public Beta 候选", "warning"),
      row("public_beta_launch_blockers", "Launch Blockers", "发布、provider、联网、付款、下单、出票全部保持阻断", "warning"),
      row("public_beta_next_phase_dossier", "Next-Phase Dossier", "下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断", "warning"),
      row("public_beta_final_readiness_manual", "Manual Review Required", "不创建 release、不 push、不启用交易", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaFinalReadinessViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaFinalReadinessCommandCenterSummary = resolveSummary(safe, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const manualNextPhaseDossierSummary = resolveSummary(safe, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    const finalStatus = normalizeStatus(obj(publicBetaFinalReadinessCommandCenterSummary).finalReadinessStatus || obj(publicBetaFinalReadinessCommandCenterSummary).status, "needs_review");
    const blockerStatus = normalizeStatus(obj(offlineLaunchBlockerMatrixSummary).blockerMatrixStatus || obj(offlineLaunchBlockerMatrixSummary).status, "needs_review");
    const dossierStatus = normalizeStatus(obj(manualNextPhaseDossierSummary).dossierStatus || obj(manualNextPhaseDossierSummary).status, "needs_review");
    const missingRequired = !present(publicBetaFinalReadinessCommandCenterSummary) || !present(offlineLaunchBlockerMatrixSummary) || !present(manualNextPhaseDossierSummary);
    const status = finalStatus === "blocked" || dossierStatus === "blocked"
      ? "blocked"
      : (missingRequired || blockerStatus !== "blocked" || finalStatus !== "manual_review_required" || dossierStatus !== "manual_review_required" ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Final Readiness Command Center",
      subtitle:"Offline Launch Blocker Matrix",
      cards:buildGlobalShoppingPublicBetaFinalReadinessCards({
        publicBetaFinalReadinessCommandCenterSummary:publicBetaFinalReadinessCommandCenterSummary,
        offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
        manualNextPhaseDossierSummary:manualNextPhaseDossierSummary
      }),
      rows:buildGlobalShoppingPublicBetaFinalReadinessRows({ status:status }),
      finalReadinessRows:buildGlobalShoppingFinalReadinessRowsForView({ publicBetaFinalReadinessCommandCenterSummary:publicBetaFinalReadinessCommandCenterSummary }),
      launchBlockerRows:buildGlobalShoppingLaunchBlockerRowsForView({ offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary }),
      nextPhaseDossierRows:buildGlobalShoppingNextPhaseDossierRowsForView({ manualNextPhaseDossierSummary:manualNextPhaseDossierSummary }),
      publicBetaFinalReadinessCommandCenterSummary:publicBetaFinalReadinessCommandCenterSummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      manualNextPhaseDossierSummary:manualNextPhaseDossierSummary,
      manualReviewRequired:true,
      safeToProceedWithManualFinalReadinessReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Final Readiness ViewModel",
        resultLabel:status === "ready" ? "Public Beta Final Readiness Command Center / Offline Launch Blocker Matrix / Manual Next-Phase Dossier 已准备" : (status === "blocked" ? "Public Beta Final Readiness ViewModel 已阻断" : "Public Beta Final Readiness ViewModel 仍需复核"),
        caveat:"不写文件、不联网、不打开外部平台。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalReadinessViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaFinalReadinessViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualFinalReadinessReview:safe.safeToProceedWithManualFinalReadinessReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalReadinessViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalReadinessViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalReadinessViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalReadinessViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaFinalReadinessViewModel,
    buildGlobalShoppingPublicBetaFinalReadinessCards,
    buildGlobalShoppingPublicBetaFinalReadinessRows,
    buildGlobalShoppingFinalReadinessRowsForView,
    buildGlobalShoppingLaunchBlockerRowsForView,
    buildGlobalShoppingNextPhaseDossierRowsForView,
    buildGlobalShoppingPublicBetaFinalReadinessViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalReadinessViewModel
  };
})();
