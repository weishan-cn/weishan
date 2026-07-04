;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_VERSION = "4.2.2";
  const GUARD_NAME = "global_shopping_no_transaction_regression_guard_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, no_transaction_regression_guard_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "no_transaction_regression_guard_only");
    return ALLOWED_MODES[mode] ? mode : "no_transaction_regression_guard_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function fieldRules(safe) {
    return [
      ["buyButtonEnabled", safe.buyButtonEnabled !== true],
      ["checkoutButtonEnabled", safe.checkoutButtonEnabled !== true],
      ["paymentButtonEnabled", safe.paymentButtonEnabled !== true],
      ["bookingUrl", safe.bookingUrl == null],
      ["checkoutUrl", safe.checkoutUrl == null],
      ["paymentUrl", safe.paymentUrl == null],
      ["orderUrl", safe.orderUrl == null],
      ["externalUrl", safe.externalUrl == null],
      ["platformUrl", safe.platformUrl == null],
      ["providerUrl", safe.providerUrl == null],
      ["createOrder", safe.createOrder !== true],
      ["authorizePayment", safe.authorizePayment !== true],
      ["issueTicket", safe.issueTicket !== true],
      ["submitBooking", safe.submitBooking !== true]
    ];
  }

  function buildGlobalShoppingNoTransactionRegressionRules(input) {
    const safe = obj(input);
    return clone(fieldRules(safe).map(function (entry) {
      return { ruleId:entry[0], label:entry[0], passed:entry[1] === true, redacted:true };
    }));
  }

  function buildGlobalShoppingNoTransactionRegressionRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    const rows = [
      row("no_transaction_regression_guard_status", "No-Transaction Regression Guard", status === "ready" ? "No-Transaction Regression Guard 已准备" : (status === "blocked" ? "No-Transaction Regression Guard 已阻断" : "No-Transaction Regression Guard 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("no_transaction_regression_transaction_boundary", "Transaction Boundary", "未生成 booking / payment / order / checkout URL", safe.buyButtonEnabled === false && safe.checkoutButtonEnabled === false && safe.paymentButtonEnabled === false ? "pass" : "blocked"),
      row("no_transaction_regression_external_boundary", "External Boundary", "未打开外部平台", safe.externalUrl == null && safe.platformUrl == null && safe.providerUrl == null ? "pass" : "blocked"),
      row("no_transaction_regression_manual_review", "Manual Review Required", "仍需人工视觉验收", "warning")
    ];
    fieldRules(safe).forEach(function (entry) {
      rows.push(row("guard_" + entry[0], entry[0], entry[1] ? "safe" : "unsafe", entry[1] ? "pass" : "blocked"));
    });
    return clone(rows);
  }

  function evaluateGlobalShoppingNoTransactionRegressionGuard(input) {
    const safe = obj(input);
    const hasExplicitVisualQaSummary = present(safe.publicBetaVisualQaConsoleSummary);
    const hasExplicitScenarioChecklistSummary = present(safe.publicBetaTrialScenarioChecklistSummary);
    const hasExplicitFeedbackPlaceholderSummary = present(safe.publicBetaFeedbackPlaceholderSummary);
    const hasExplicitFinalOfflineBetaAuditSummary = present(safe.finalOfflineBetaAuditSummary);
    const hasExplicitAcceptanceBoardSummary = present(safe.publicBetaAcceptanceBoardSummary);
    const visualQaSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const scenarioChecklistSummary = resolveSummary(safe, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    const feedbackPlaceholderSummary = resolveSummary(safe, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    const finalOfflineBetaAuditSummary = resolveSummary(safe, "finalOfflineBetaAuditSummary", "WeishanGlobalShoppingFinalOfflineBetaAudit", "buildGlobalShoppingFinalOfflineBetaAudit");
    const publicBetaAcceptanceBoardSummary = resolveSummary(safe, "publicBetaAcceptanceBoardSummary", "WeishanGlobalShoppingPublicBetaAcceptanceBoard", "buildGlobalShoppingPublicBetaAcceptanceBoard");
    const missingUpstream = !hasExplicitVisualQaSummary || !hasExplicitScenarioChecklistSummary || !hasExplicitFeedbackPlaceholderSummary || !hasExplicitFinalOfflineBetaAuditSummary || !hasExplicitAcceptanceBoardSummary;
    const blockedUpstream = [visualQaSummary, scenarioChecklistSummary, feedbackPlaceholderSummary, finalOfflineBetaAuditSummary, publicBetaAcceptanceBoardSummary].some(function (summary) {
      return safeStatus(obj(summary).status) === "blocked" || safeStatus(obj(summary).status) === "failed_safe";
    });
    const providerBoundaryBlocked = safe.provider === true || safe.network === true || safe.key === true || safe.endpoint === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true;
    const failedRules = fieldRules(safe).some(function (entry) { return entry[1] !== true; });
    const status = blockedUpstream || providerBoundaryBlocked || failedRules ? "blocked" : (missingUpstream ? "needs_review" : "ready");
    return clone({
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_VERSION,
      guardMode:safeMode(safe.guardMode),
      status,
      title:"No-Transaction Regression Guard",
      publicBetaVisualQaConsoleSummary:visualQaSummary,
      publicBetaTrialScenarioChecklistSummary:scenarioChecklistSummary,
      publicBetaFeedbackPlaceholderSummary:feedbackPlaceholderSummary,
      finalOfflineBetaAuditSummary:finalOfflineBetaAuditSummary,
      publicBetaAcceptanceBoardSummary:publicBetaAcceptanceBoardSummary,
      buyButtonEnabled:safe.buyButtonEnabled === true,
      checkoutButtonEnabled:safe.checkoutButtonEnabled === true,
      paymentButtonEnabled:safe.paymentButtonEnabled === true,
      bookingUrl:safe.bookingUrl == null ? null : safe.bookingUrl,
      checkoutUrl:safe.checkoutUrl == null ? null : safe.checkoutUrl,
      paymentUrl:safe.paymentUrl == null ? null : safe.paymentUrl,
      orderUrl:safe.orderUrl == null ? null : safe.orderUrl,
      externalUrl:safe.externalUrl == null ? null : safe.externalUrl,
      platformUrl:safe.platformUrl == null ? null : safe.platformUrl,
      providerUrl:safe.providerUrl == null ? null : safe.providerUrl,
      createOrder:safe.createOrder === true,
      authorizePayment:safe.authorizePayment === true,
      issueTicket:safe.issueTicket === true,
      submitBooking:safe.submitBooking === true,
      manualReviewRequired:true,
      rules:buildGlobalShoppingNoTransactionRegressionRules(safe),
      rows:buildGlobalShoppingNoTransactionRegressionRows(Object.assign({ status }, safe)),
      userFacingSummary:{
        title:"No-Transaction Regression Guard",
        resultLabel:status === "ready" ? "No-Transaction Regression Guard 已准备" : (status === "blocked" ? "No-Transaction Regression Guard 已阻断" : "No-Transaction Regression Guard 仍需复核"),
        caveat:"交易按钮保持关闭，未生成 booking / payment / order / checkout URL；当前只是 RC 候选，不创建 release、不 push。"
      },
      redacted:true
    });
  }

  function buildGlobalShoppingNoTransactionRegressionGuardAuditDraft(input) {
    const safe = evaluateGlobalShoppingNoTransactionRegressionGuard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_AUDIT_DRAFT",
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_VERSION,
      status:safe.status,
      ruleCount:toArray(safe.rules).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoTransactionRegressionGuard(guard) {
    return evaluateGlobalShoppingNoTransactionRegressionGuard(guard || {});
  }

  function buildGlobalShoppingNoTransactionRegressionGuard(input) {
    try {
      return sanitizeGlobalShoppingNoTransactionRegressionGuard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingNoTransactionRegressionGuard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoTransactionRegressionGuard = {
    GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_VERSION,
    GUARD_NAME,
    buildGlobalShoppingNoTransactionRegressionGuard,
    evaluateGlobalShoppingNoTransactionRegressionGuard,
    buildGlobalShoppingNoTransactionRegressionRows,
    buildGlobalShoppingNoTransactionRegressionRules,
    buildGlobalShoppingNoTransactionRegressionGuardAuditDraft,
    sanitizeGlobalShoppingNoTransactionRegressionGuard
  };
})();
