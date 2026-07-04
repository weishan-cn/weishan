;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_final_acceptance_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function normalizeStatus(value) {
    const status = text(value || "needs_review");
    if (status === "ready") return "ready";
    return /^(ready|manual_review_required|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingFinalAcceptanceLockRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaFinalAcceptanceLockSummary", "WeishanGlobalShoppingPublicBetaFinalAcceptanceLock", "buildGlobalShoppingPublicBetaFinalAcceptanceLock");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_final_acceptance_lock_missing", "Public Beta Final Acceptance Lock", "Public Beta Final Acceptance Lock 仍需复核", "warning")];
  }
  function buildGlobalShoppingReleaseCandidateAuditRowsForView(input) {
    const summary = resolveSummary(input, "offlineReleaseCandidateAuditSummary", "WeishanGlobalShoppingOfflineReleaseCandidateAudit", "buildGlobalShoppingOfflineReleaseCandidateAudit");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_release_candidate_audit_missing", "Offline Release Candidate Audit", "Offline Release Candidate Audit 仍需复核", "warning")];
  }
  function buildGlobalShoppingZeroActionSafetyRowsForView(input) {
    const summary = resolveSummary(input, "zeroActionSafetyConsoleSummary", "WeishanGlobalShoppingZeroActionSafetyConsole", "buildGlobalShoppingZeroActionSafetyConsole");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("zero_action_safety_console_missing", "Zero-Action Safety Console", "Zero-Action Safety Console 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceCards(input) {
    const finalAcceptanceSummary = resolveSummary(input, "publicBetaFinalAcceptanceLockSummary", "WeishanGlobalShoppingPublicBetaFinalAcceptanceLock", "buildGlobalShoppingPublicBetaFinalAcceptanceLock");
    const rcAuditSummary = resolveSummary(input, "offlineReleaseCandidateAuditSummary", "WeishanGlobalShoppingOfflineReleaseCandidateAudit", "buildGlobalShoppingOfflineReleaseCandidateAudit");
    const zeroActionSummary = resolveSummary(input, "zeroActionSafetyConsoleSummary", "WeishanGlobalShoppingZeroActionSafetyConsole", "buildGlobalShoppingZeroActionSafetyConsole");
    return clone([
      card("public_beta_final_acceptance_lock", "Public Beta Final Acceptance Lock", text(obj(finalAcceptanceSummary.userFacingSummary).resultLabel || "Public Beta Final Acceptance Lock 仍需复核")),
      card("offline_release_candidate_audit", "Offline Release Candidate Audit", text(obj(rcAuditSummary.userFacingSummary).resultLabel || "Offline Release Candidate Audit 仍需复核")),
      card("zero_action_safety_console", "Zero-Action Safety Console", text(obj(zeroActionSummary.userFacingSummary).resultLabel || "Zero-Action Safety Console 仍需复核")),
      card("final_acceptance", "Final Acceptance", "最终人工验收锁定仅为只读展示，不保存验收记录"),
      card("release_candidate_audit", "Release Candidate Audit", "离线 RC 审计不创建 release、不生成审计文件"),
      card("zero_action_safety", "Zero Action Safety", "零动作安全控制台确认没有任何真实动作执行入口"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_final_acceptance_view_model", "Public Beta Final Acceptance ViewModel", safe.status === "ready" ? "Public Beta Final Acceptance ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Final Acceptance ViewModel 已阻断" : "Public Beta Final Acceptance ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_acceptance", "Final Acceptance", "最终人工验收锁定仅为只读展示，不保存验收记录", "warning"),
      row("release_candidate_audit", "Release Candidate Audit", "离线 RC 审计不创建 release、不生成审计文件", "warning"),
      row("zero_action_safety", "Zero Action Safety", "零动作安全控制台确认没有任何真实动作执行入口", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaFinalAcceptanceViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaFinalAcceptanceLockSummary = resolveSummary(safe, "publicBetaFinalAcceptanceLockSummary", "WeishanGlobalShoppingPublicBetaFinalAcceptanceLock", "buildGlobalShoppingPublicBetaFinalAcceptanceLock");
    const offlineReleaseCandidateAuditSummary = resolveSummary(safe, "offlineReleaseCandidateAuditSummary", "WeishanGlobalShoppingOfflineReleaseCandidateAudit", "buildGlobalShoppingOfflineReleaseCandidateAudit");
    const zeroActionSafetyConsoleSummary = resolveSummary(safe, "zeroActionSafetyConsoleSummary", "WeishanGlobalShoppingZeroActionSafetyConsole", "buildGlobalShoppingZeroActionSafetyConsole");
    const finalAcceptanceStatus = normalizeStatus(obj(publicBetaFinalAcceptanceLockSummary).status || obj(publicBetaFinalAcceptanceLockSummary).finalAcceptanceLockStatus);
    const rcAuditStatus = normalizeStatus(obj(offlineReleaseCandidateAuditSummary).status || obj(offlineReleaseCandidateAuditSummary).releaseCandidateAuditStatus);
    const zeroActionStatus = normalizeStatus(obj(zeroActionSafetyConsoleSummary).status || obj(zeroActionSafetyConsoleSummary).zeroActionStatus);
    const missingRequired = !present(publicBetaFinalAcceptanceLockSummary) || !present(offlineReleaseCandidateAuditSummary) || !present(zeroActionSafetyConsoleSummary);
    const status = finalAcceptanceStatus === "blocked" || rcAuditStatus === "blocked" || zeroActionStatus === "blocked"
      ? "blocked"
      : (missingRequired || finalAcceptanceStatus === "needs_review" || rcAuditStatus === "needs_review" || zeroActionStatus === "needs_review"
        ? "needs_review"
        : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Final Acceptance Lock",
      subtitle:"Offline Release Candidate Audit",
      cards:buildGlobalShoppingPublicBetaFinalAcceptanceCards({
        publicBetaFinalAcceptanceLockSummary:publicBetaFinalAcceptanceLockSummary,
        offlineReleaseCandidateAuditSummary:offlineReleaseCandidateAuditSummary,
        zeroActionSafetyConsoleSummary:zeroActionSafetyConsoleSummary
      }),
      rows:buildGlobalShoppingPublicBetaFinalAcceptanceRows({ status:status }),
      finalAcceptanceLockRows:buildGlobalShoppingFinalAcceptanceLockRowsForView({ publicBetaFinalAcceptanceLockSummary:publicBetaFinalAcceptanceLockSummary }),
      releaseCandidateAuditRows:buildGlobalShoppingReleaseCandidateAuditRowsForView({ offlineReleaseCandidateAuditSummary:offlineReleaseCandidateAuditSummary }),
      zeroActionSafetyRows:buildGlobalShoppingZeroActionSafetyRowsForView({ zeroActionSafetyConsoleSummary:zeroActionSafetyConsoleSummary }),
      publicBetaFinalAcceptanceLockSummary:publicBetaFinalAcceptanceLockSummary,
      offlineReleaseCandidateAuditSummary:offlineReleaseCandidateAuditSummary,
      zeroActionSafetyConsoleSummary:zeroActionSafetyConsoleSummary,
      manualReviewRequired:true,
      safeToProceedWithManualFinalAcceptanceReview:status === "ready",
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      releaseCandidateAuditPersistence:false,
      userFacingSummary:{
        title:"Public Beta Final Acceptance ViewModel",
        resultLabel:status === "ready" ? "Public Beta Final Acceptance ViewModel 已准备" : (status === "blocked" ? "Public Beta Final Acceptance ViewModel 已阻断" : "Public Beta Final Acceptance ViewModel 仍需复核"),
        caveat:"不输出真实 provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建入口。"
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
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaFinalAcceptanceViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualFinalAcceptanceReview:safe.safeToProceedWithManualFinalAcceptanceReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalAcceptanceViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalAcceptanceViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalAcceptanceViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaFinalAcceptanceViewModel,
    buildGlobalShoppingPublicBetaFinalAcceptanceCards,
    buildGlobalShoppingPublicBetaFinalAcceptanceRows,
    buildGlobalShoppingFinalAcceptanceLockRowsForView,
    buildGlobalShoppingReleaseCandidateAuditRowsForView,
    buildGlobalShoppingZeroActionSafetyRowsForView,
    buildGlobalShoppingPublicBetaFinalAcceptanceViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalAcceptanceViewModel
  };
})();
