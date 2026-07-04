;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_VERSION = "4.2.5";
  const VIEW_MODEL_NAME = "global_shopping_manual_launch_handoff_view_model_v1";

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
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingStabilityAuditRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_stability_audit_missing", "Public Beta Stability Audit", "Public Beta Stability Audit 仍需复核", "warning")];
  }

  function buildGlobalShoppingManualHandoffRowsForView(input) {
    const summary = resolveSummary(input, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("manual_launch_handoff_pack_missing", "Manual Launch Handoff Pack", "Manual Launch Handoff Pack 仍需复核", "warning")];
  }

  function buildGlobalShoppingManualLaunchHandoffCards(input) {
    const stabilitySummary = resolveSummary(input, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const handoffSummary = resolveSummary(input, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    return clone([
      card("public_beta_stability_audit", "Public Beta Stability Audit", text(obj(stabilitySummary.userFacingSummary).resultLabel || "Public Beta Stability Audit 仍需复核")),
      card("manual_launch_handoff_pack", "Manual Launch Handoff Pack", text(obj(handoffSummary.userFacingSummary).resultLabel || "Manual Launch Handoff Pack 仍需复核")),
      card("locked_capabilities", "Locked Capabilities", "不自动发布、不接 provider、不启用交易"),
      card("next_decision_options", "Next Decision Options", toArray(handoffSummary.nextDecisionOptions).join(" / ") || "manual_review_required / continue_testing"),
      card("continue_testing", "Continue Testing", "可继续人工试用和问题记录"),
      card("manual_review_required", "Manual Review Required", "人工复核通过后才能进入下一阶段")
    ]);
  }

  function buildGlobalShoppingManualLaunchHandoffRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("manual_launch_handoff_view_model_status", "Manual Launch Handoff View Model", status === "ready" ? "Manual Launch Handoff View Model 已准备" : (status === "blocked" ? "Manual Launch Handoff View Model 已阻断" : "Manual Launch Handoff View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("manual_launch_handoff_view_model_boundary", "Locked Capabilities", "不自动发布、不接 provider、不启用交易", "warning"),
      row("manual_launch_handoff_view_model_continue", "Continue Testing", "可继续人工试用和问题记录", "warning"),
      row("manual_launch_handoff_view_model_review", "Manual Review Required", "当前仍为只读 Public Beta 候选", "warning")
    ]);
  }

  function sanitizeGlobalShoppingManualLaunchHandoffViewModel(viewModel) {
    const safe = obj(viewModel);
    const hasStabilitySummary = present(safe.publicBetaStabilityAuditSummary);
    const hasHandoffSummary = present(safe.manualLaunchHandoffPackSummary);
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const manualLaunchHandoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const stabilityStatus = text(publicBetaStabilityAuditSummary.status || "needs_review");
    const handoffStatus = text(manualLaunchHandoffPackSummary.status || "needs_review");
    const status = stabilityStatus === "blocked" || handoffStatus === "blocked"
      ? "blocked"
      : (!hasStabilitySummary || !hasHandoffSummary || stabilityStatus !== "ready" || handoffStatus !== "ready" ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Stability Audit",
      subtitle:"Manual Launch Handoff Pack",
      cards:buildGlobalShoppingManualLaunchHandoffCards({
        publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
        manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary
      }),
      rows:buildGlobalShoppingManualLaunchHandoffRows({ status:status }),
      stabilityAuditRows:buildGlobalShoppingStabilityAuditRowsForView({ publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary }),
      manualHandoffRows:buildGlobalShoppingManualHandoffRowsForView({ manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary }),
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary,
      manualReviewRequired:true,
      safeToProceedWithManualLaunchHandoffReview:status === "ready",
      userFacingSummary:{
        title:"Manual Launch Handoff Review",
        resultLabel:status === "ready" ? "Public Beta Stability Audit / Manual Launch Handoff Pack 已准备" : (status === "blocked" ? "Manual Launch Handoff View Model 已阻断" : "Manual Launch Handoff View Model 仍需复核"),
        caveat:"不输出 release / push / activation / provider / payment / order / ticketing 入口。"
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

  function buildGlobalShoppingManualLaunchHandoffViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingManualLaunchHandoffViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualLaunchHandoffReview:safe.safeToProceedWithManualLaunchHandoffReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingManualLaunchHandoffViewModel(input) {
    try {
      return sanitizeGlobalShoppingManualLaunchHandoffViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualLaunchHandoffViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualLaunchHandoffViewModel = {
    GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingManualLaunchHandoffViewModel,
    buildGlobalShoppingManualLaunchHandoffCards,
    buildGlobalShoppingManualLaunchHandoffRows,
    buildGlobalShoppingStabilityAuditRowsForView,
    buildGlobalShoppingManualHandoffRowsForView,
    buildGlobalShoppingManualLaunchHandoffViewModelAuditDraft,
    sanitizeGlobalShoppingManualLaunchHandoffViewModel
  };
})();
