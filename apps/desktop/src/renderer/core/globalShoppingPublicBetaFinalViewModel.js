;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_final_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
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

  function buildGlobalShoppingPublicBetaFinalViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingPublicBetaFinalCards(input) {
    const safe = obj(input);
    const finalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const rcConfidenceBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    return clone([
      card("final_gate", "Public Beta Final Gate", labelOf(finalGateSummary, "Public Beta Final Gate 仍需复核")),
      card("rc_confidence", "RC Confidence Board", labelOf(rcConfidenceBoardSummary, "RC Confidence Board 仍需复核")),
      card("locked_capabilities", "Locked Capabilities", "Provider-Zero 已锁定 / 未联网 / 未读取密钥 / 未生成 endpoint"),
      card("user_boundary", "User Boundary", "未打开外部平台 / 未启用付款 / 未创建订单 / 未出票"),
      card("manual_review", "Next Manual Review", "下一步仍需人工复核")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalGateRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_final_gate_missing", "Public Beta Final Gate", "Public Beta Final Gate 仍需复核", "warning")];
  }

  function buildGlobalShoppingRcConfidenceRowsForView(input) {
    const summary = resolveSummary(input, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("rc_confidence_board_missing", "RC Confidence Board", "RC Confidence Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaFinalRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_final_view_model_status", "Public Beta Final View Model", status === "ready" ? "Public Beta Final View Model 已准备" : (status === "blocked" ? "Public Beta Final View Model 已阻断" : "Public Beta Final View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_final_view_model_boundary", "只读边界", "不提供 release / push / activation / provider / key / network / endpoint 入口", "pass"),
      row("public_beta_final_view_model_manual_review", "Next Manual Review", "下一步仍需人工复核", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalViewModelAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_VERSION,
      status:safeStatus(safe.status),
      cardCount:toArray(safe.cards).length,
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

  function sanitizeGlobalShoppingPublicBetaFinalViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaFinalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const releaseCandidateConfidenceBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    const statuses = [
      safeStatus(publicBetaFinalGateSummary.status),
      safeStatus(releaseCandidateConfidenceBoardSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview = !present(publicBetaFinalGateSummary) || !present(releaseCandidateConfidenceBoardSummary) || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Final Gate",
      subtitle:"RC Confidence Board",
      cards:buildGlobalShoppingPublicBetaFinalCards({
        publicBetaFinalGateSummary:publicBetaFinalGateSummary,
        releaseCandidateConfidenceBoardSummary:releaseCandidateConfidenceBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaFinalRows({ status:status }),
      publicBetaFinalGateRows:buildGlobalShoppingPublicBetaFinalGateRowsForView({ publicBetaFinalGateSummary:publicBetaFinalGateSummary }),
      rcConfidenceRows:buildGlobalShoppingRcConfidenceRowsForView({ releaseCandidateConfidenceBoardSummary:releaseCandidateConfidenceBoardSummary }),
      userFacingSummary:{
        title:"Public Beta Final Gate",
        resultLabel:status === "ready" ? "Public Beta Final Gate / RC Confidence Board 已准备" : (status === "blocked" ? "Public Beta Final Gate / RC Confidence Board 已阻断" : "Public Beta Final Gate / RC Confidence Board 仍需复核"),
        caveat:"下一步仍需人工复核。"
      },
      publicBetaFinalGateSummary:clone(publicBetaFinalGateSummary),
      releaseCandidateConfidenceBoardSummary:clone(releaseCandidateConfidenceBoardSummary),
      safeToProceedWithManualPublicBetaReview:status === "ready",
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

  window.WeishanGlobalShoppingPublicBetaFinalViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaFinalViewModel,
    buildGlobalShoppingPublicBetaFinalCards,
    buildGlobalShoppingPublicBetaFinalRows,
    buildGlobalShoppingPublicBetaFinalGateRowsForView,
    buildGlobalShoppingRcConfidenceRowsForView,
    buildGlobalShoppingPublicBetaFinalViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalViewModel
  };
})();
