;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION = "4.2.0";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_candidate_view_model_v1";

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

  function buildGlobalShoppingCandidateLockRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_candidate_lock_missing", "Public Beta Candidate Lock", "Public Beta Candidate Lock 仍需复核", "warning")];
  }

  function buildGlobalShoppingTrialHandoffRowsForView(input) {
    const summary = resolveSummary(input, "finalTrialHandoffConsoleSummary", "WeishanGlobalShoppingFinalTrialHandoffConsole", "buildGlobalShoppingFinalTrialHandoffConsole");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("final_trial_handoff_console_missing", "Final Trial Handoff Console", "Final Trial Handoff Console 仍需复核", "warning")];
  }

  function buildGlobalShoppingProductionBoundaryRowsForView(input) {
    const summary = resolveSummary(input, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("no_provider_production_boundary_missing", "No-Provider Production Boundary", "No-Provider Production Boundary 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaCandidateCards(input) {
    const candidateLock = resolveSummary(input, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const handoffConsole = resolveSummary(input, "finalTrialHandoffConsoleSummary", "WeishanGlobalShoppingFinalTrialHandoffConsole", "buildGlobalShoppingFinalTrialHandoffConsole");
    const productionBoundary = resolveSummary(input, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    return clone([
      card("public_beta_candidate_lock", "Public Beta Candidate Lock", text(obj(candidateLock.userFacingSummary).resultLabel || "Public Beta Candidate Lock 仍需复核")),
      card("final_trial_handoff_console", "Final Trial Handoff Console", text(obj(handoffConsole.userFacingSummary).resultLabel || "Final Trial Handoff Console 仍需复核")),
      card("no_provider_production_boundary", "No-Provider Production Boundary", text(obj(productionBoundary.userFacingSummary).resultLabel || "No-Provider Production Boundary 仍需复核")),
      card("candidate_scope", "Candidate Scope", "当前锁定的是只读 Public Beta 候选范围，不修改配置"),
      card("trial_handoff", "Trial Handoff", "最终试用交接仅为只读摘要，不生成文件"),
      card("production_boundary", "Production Boundary", "当前不是 production provider 版本"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push 全部保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_candidate_view_model", "Public Beta Candidate ViewModel", safe.status === "ready" ? "Public Beta Candidate ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Candidate ViewModel 已阻断" : "Public Beta Candidate ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_candidate_scope", "Candidate Scope", "当前锁定的是只读 Public Beta 候选范围，不修改配置", "warning"),
      row("public_beta_trial_handoff", "Trial Handoff", "最终试用交接仅为只读摘要，不生成文件", "warning"),
      row("public_beta_production_boundary", "Production Boundary", "当前不是 production provider 版本", "warning"),
      row("public_beta_candidate_manual", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push 全部保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaCandidateViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaCandidateLockSummary = resolveSummary(safe, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const finalTrialHandoffConsoleSummary = resolveSummary(safe, "finalTrialHandoffConsoleSummary", "WeishanGlobalShoppingFinalTrialHandoffConsole", "buildGlobalShoppingFinalTrialHandoffConsole");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const candidateLockStatus = normalizeStatus(obj(publicBetaCandidateLockSummary).candidateLockStatus || obj(publicBetaCandidateLockSummary).status, "needs_review");
    const handoffStatus = normalizeStatus(obj(finalTrialHandoffConsoleSummary).handoffStatus || obj(finalTrialHandoffConsoleSummary).status, "needs_review");
    const boundaryStatus = normalizeStatus(obj(noProviderProductionBoundarySummary).boundaryStatus || obj(noProviderProductionBoundarySummary).status, "needs_review");
    const missingRequired = !present(publicBetaCandidateLockSummary) || !present(finalTrialHandoffConsoleSummary) || !present(noProviderProductionBoundarySummary);
    const status = candidateLockStatus === "blocked" || handoffStatus === "blocked" || boundaryStatus === "blocked"
      ? "blocked"
      : (missingRequired ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Candidate Lock",
      subtitle:"Final Trial Handoff Console",
      cards:buildGlobalShoppingPublicBetaCandidateCards({
        publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
        finalTrialHandoffConsoleSummary:finalTrialHandoffConsoleSummary,
        noProviderProductionBoundarySummary:noProviderProductionBoundarySummary
      }),
      rows:buildGlobalShoppingPublicBetaCandidateRows({ status:status }),
      candidateLockRows:buildGlobalShoppingCandidateLockRowsForView({ publicBetaCandidateLockSummary:publicBetaCandidateLockSummary }),
      trialHandoffRows:buildGlobalShoppingTrialHandoffRowsForView({ finalTrialHandoffConsoleSummary:finalTrialHandoffConsoleSummary }),
      productionBoundaryRows:buildGlobalShoppingProductionBoundaryRowsForView({ noProviderProductionBoundarySummary:noProviderProductionBoundarySummary }),
      publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
      finalTrialHandoffConsoleSummary:finalTrialHandoffConsoleSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      manualReviewRequired:true,
      safeToProceedWithManualCandidateReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Candidate ViewModel",
        resultLabel:status === "ready" ? "Public Beta Candidate Lock / Final Trial Handoff Console / No-Provider Production Boundary 已准备" : (status === "blocked" ? "Public Beta Candidate ViewModel 已阻断" : "Public Beta Candidate ViewModel 仍需复核"),
        caveat:"不输出 release/push/activation/launch/付款/下单/出票/provider/key/network/endpoint 入口。"
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

  function buildGlobalShoppingPublicBetaCandidateViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaCandidateViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualCandidateReview:safe.safeToProceedWithManualCandidateReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaCandidateViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaCandidateViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaCandidateViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaCandidateViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaCandidateViewModel,
    buildGlobalShoppingPublicBetaCandidateCards,
    buildGlobalShoppingPublicBetaCandidateRows,
    buildGlobalShoppingCandidateLockRowsForView,
    buildGlobalShoppingTrialHandoffRowsForView,
    buildGlobalShoppingProductionBoundaryRowsForView,
    buildGlobalShoppingPublicBetaCandidateViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaCandidateViewModel
  };
})();
