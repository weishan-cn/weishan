;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_VERSION = "4.0.4";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_operator_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
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

  function buildGlobalShoppingOperatorConsoleRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaOperatorConsoleSummary", "WeishanGlobalShoppingPublicBetaOperatorConsole", "buildGlobalShoppingPublicBetaOperatorConsole");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_operator_console_missing", "Public Beta Operator Console", "Public Beta Operator Console 仍需复核", "warning")];
  }
  function buildGlobalShoppingCategoryExpansionRowsForView(input) {
    const summary = resolveSummary(input, "categoryExpansionShellSummary", "WeishanGlobalShoppingCategoryExpansionShell", "buildGlobalShoppingCategoryExpansionShell");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("category_expansion_shell_missing", "Category Expansion Shell", "Category Expansion Shell 仍需复核", "warning")];
  }
  function buildGlobalShoppingFinalAuditRowsForView(input) {
    const summary = resolveSummary(input, "finalOfflineBetaAuditSummary", "WeishanGlobalShoppingFinalOfflineBetaAudit", "buildGlobalShoppingFinalOfflineBetaAudit");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("final_offline_beta_audit_missing", "Final Offline Beta Audit", "Final Offline Beta Audit 仍需复核", "warning")];
  }
  function buildGlobalShoppingAcceptanceBoardRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaAcceptanceBoardSummary", "WeishanGlobalShoppingPublicBetaAcceptanceBoard", "buildGlobalShoppingPublicBetaAcceptanceBoard");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_acceptance_board_missing", "Public Beta Acceptance Board", "Public Beta Acceptance Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaOperatorCards(input) {
    const safe = obj(input);
    const consoleSummary = resolveSummary(safe, "publicBetaOperatorConsoleSummary", "WeishanGlobalShoppingPublicBetaOperatorConsole", "buildGlobalShoppingPublicBetaOperatorConsole");
    const shellSummary = resolveSummary(safe, "categoryExpansionShellSummary", "WeishanGlobalShoppingCategoryExpansionShell", "buildGlobalShoppingCategoryExpansionShell");
    const auditSummary = resolveSummary(safe, "finalOfflineBetaAuditSummary", "WeishanGlobalShoppingFinalOfflineBetaAudit", "buildGlobalShoppingFinalOfflineBetaAudit");
    const boardSummary = resolveSummary(safe, "publicBetaAcceptanceBoardSummary", "WeishanGlobalShoppingPublicBetaAcceptanceBoard", "buildGlobalShoppingPublicBetaAcceptanceBoard");
    return clone([
      card("operator_console", "Public Beta Operator Console", labelOf(consoleSummary, "Public Beta Operator Console 仍需复核")),
      card("category_expansion_shell", "Category Expansion Shell", labelOf(shellSummary, "Category Expansion Shell 仍需复核")),
      card("final_offline_beta_audit", "Final Offline Beta Audit", labelOf(auditSummary, "Final Offline Beta Audit 仍需复核")),
      card("public_beta_acceptance_board", "Public Beta Acceptance Board", labelOf(boardSummary, "Public Beta Acceptance Board 仍需复核")),
      card("manual_review_required", "Manual Review Required", "仍需人工复核后再决定是否进入下一阶段")
    ]);
  }

  function buildGlobalShoppingPublicBetaOperatorRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_operator_view_model_status", "Public Beta Operator View Model", safe.status === "ready" ? "Public Beta Operator View Model 已准备" : (safe.status === "blocked" ? "Public Beta Operator View Model 已阻断" : "Public Beta Operator View Model 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_operator_view_model_manual_review", "Manual Review Required", "仍需人工复核后再决定是否进入下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaOperatorViewModelAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_VERSION,
      status:safeStatus(safe.status),
      cardCount:toArray(safe.cards).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaOperatorViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaOperatorConsoleSummary = resolveSummary(safe, "publicBetaOperatorConsoleSummary", "WeishanGlobalShoppingPublicBetaOperatorConsole", "buildGlobalShoppingPublicBetaOperatorConsole");
    const categoryExpansionShellSummary = resolveSummary(safe, "categoryExpansionShellSummary", "WeishanGlobalShoppingCategoryExpansionShell", "buildGlobalShoppingCategoryExpansionShell");
    const finalOfflineBetaAuditSummary = resolveSummary(safe, "finalOfflineBetaAuditSummary", "WeishanGlobalShoppingFinalOfflineBetaAudit", "buildGlobalShoppingFinalOfflineBetaAudit");
    const publicBetaAcceptanceBoardSummary = resolveSummary(safe, "publicBetaAcceptanceBoardSummary", "WeishanGlobalShoppingPublicBetaAcceptanceBoard", "buildGlobalShoppingPublicBetaAcceptanceBoard");
    const statuses = [
      safeStatus(publicBetaOperatorConsoleSummary.status),
      safeStatus(categoryExpansionShellSummary.status),
      safeStatus(finalOfflineBetaAuditSummary.status),
      safeStatus(publicBetaAcceptanceBoardSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicBetaOperatorConsoleSummary) ||
      !present(categoryExpansionShellSummary) ||
      !present(finalOfflineBetaAuditSummary) ||
      !present(publicBetaAcceptanceBoardSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Operator Console",
      subtitle:"Category Expansion Shell",
      cards:buildGlobalShoppingPublicBetaOperatorCards({
        publicBetaOperatorConsoleSummary,
        categoryExpansionShellSummary,
        finalOfflineBetaAuditSummary,
        publicBetaAcceptanceBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaOperatorRows({ status }),
      operatorConsoleRows:buildGlobalShoppingOperatorConsoleRowsForView({ publicBetaOperatorConsoleSummary }),
      categoryExpansionRows:buildGlobalShoppingCategoryExpansionRowsForView({ categoryExpansionShellSummary }),
      finalAuditRows:buildGlobalShoppingFinalAuditRowsForView({ finalOfflineBetaAuditSummary }),
      acceptanceBoardRows:buildGlobalShoppingAcceptanceBoardRowsForView({ publicBetaAcceptanceBoardSummary }),
      publicBetaOperatorConsoleSummary,
      categoryExpansionShellSummary,
      finalOfflineBetaAuditSummary,
      publicBetaAcceptanceBoardSummary,
      userFacingSummary:{
        title:"Public Beta Operator View Model",
        resultLabel:status === "ready" ? "Public Beta Operator Console / Category Expansion Shell / Final Offline Beta Audit / Public Beta Acceptance Board 已准备" : (status === "blocked" ? "Public Beta Operator View Model 已阻断" : "Public Beta Operator View Model 仍需复核"),
        caveat:"仍需人工复核后再决定是否进入下一阶段。"
      },
      safeToProceedWithManualPublicBetaAcceptanceReview:status === "ready",
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

  function buildGlobalShoppingPublicBetaOperatorViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaOperatorViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaOperatorViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaOperatorViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaOperatorViewModel,
    buildGlobalShoppingPublicBetaOperatorCards,
    buildGlobalShoppingPublicBetaOperatorRows,
    buildGlobalShoppingOperatorConsoleRowsForView,
    buildGlobalShoppingCategoryExpansionRowsForView,
    buildGlobalShoppingFinalAuditRowsForView,
    buildGlobalShoppingAcceptanceBoardRowsForView,
    buildGlobalShoppingPublicBetaOperatorViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaOperatorViewModel
  };
})();
