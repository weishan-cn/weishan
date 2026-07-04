;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_VERSION = "4.2.4";
  const MATRIX_NAME = "global_shopping_public_beta_qa_decision_matrix_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, qa_decision_matrix_only:true };
  const FORBIDDEN_DECISIONS = ["production_ready", "auto_launch", "auto_publish", "ready_to_publish", "enable_provider", "enable_payment", "enable_order"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "qa_decision_matrix_only");
    return ALLOWED_MODES[mode] ? mode : "qa_decision_matrix_only";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaQaDecisionMatrix(input) {
    const safe = obj(input);
    const publicBetaTrialEvidenceLedgerSummary = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const publicBetaTrialOperationsConsoleSummary = resolveSummary(safe, "publicBetaTrialOperationsConsoleSummary", "WeishanGlobalShoppingPublicBetaTrialOperationsConsole", "buildGlobalShoppingPublicBetaTrialOperationsConsole");
    const manualLaunchHandoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const publicBetaManualQaReportCenterSummary = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const blocked = blockedReasons(safe);
    const summaries = [
      publicBetaTrialEvidenceLedgerSummary,
      publicBetaTrialOperationsConsoleSummary,
      manualLaunchHandoffPackSummary,
      publicBetaManualQaReportCenterSummary,
      noTransactionRegressionGuardSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).decisionStatus || "", "needs_review"); });
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked" || status === "failed_safe"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready"; });
    const status = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    const allowedDecisions = status === "blocked" ? ["blocked"] : ["continue_testing", "manual_review_required"];
    const blockedDecisions = FORBIDDEN_DECISIONS.slice();
    const requiredManualChecks = [
      "Public Beta Trial Evidence Ledger",
      "Public Beta Trial Operations Console",
      "Manual Launch Handoff Pack",
      "Public Beta Manual QA Report Center",
      "No-Transaction Regression Guard"
    ];
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_VERSION,
      matrixMode:safeMode(safe.matrixMode),
      status:status,
      decisionStatus:status,
      allowedDecisions:allowedDecisions,
      blockedDecisions:blockedDecisions,
      requiredManualChecks:requiredManualChecks,
      nextAction:status === "blocked" ? "blocked" : (status === "ready" ? "manual_review_required" : "continue_testing"),
      manualReviewRequired:true,
      publicBetaTrialEvidenceLedgerSummary:publicBetaTrialEvidenceLedgerSummary,
      publicBetaTrialOperationsConsoleSummary:publicBetaTrialOperationsConsoleSummary,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary,
      publicBetaManualQaReportCenterSummary:publicBetaManualQaReportCenterSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      userFacingSummary:{
        title:"QA Decision Matrix",
        resultLabel:status === "ready" ? "QA Decision Matrix 已准备" : (status === "blocked" ? "QA Decision Matrix 已阻断" : "QA Decision Matrix 仍需复核"),
        caveat:"只允许继续测试、人工复核或阻断。"
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

  function buildGlobalShoppingPublicBetaQaDecisionRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaDecisionMatrix(input || {});
    return clone([
      row("public_beta_qa_decision_matrix", "QA Decision Matrix", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_qa_allowed_decisions", "Allowed Decisions", safe.allowedDecisions.join(" / "), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_qa_blocked_decisions", "Blocked Decisions", safe.blockedDecisions.join(" / "), "warning"),
      row("public_beta_qa_manual_checks", "Manual Review Items", safe.requiredManualChecks.join(" / "), "warning"),
      row("public_beta_qa_next_action", "Continue Testing", safe.nextAction, safe.status === "blocked" ? "blocked" : "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaQaDecisionRules(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaDecisionMatrix(input || {});
    return clone([
      { ruleId:"allowed_decisions", label:"Allowed Decisions", value:safe.allowedDecisions.join(" / "), redacted:true },
      { ruleId:"blocked_decisions", label:"Blocked Decisions", value:safe.blockedDecisions.join(" / "), redacted:true },
      { ruleId:"manual_checks", label:"Manual Review Items", value:safe.requiredManualChecks.join(" / "), redacted:true }
    ]);
  }

  function buildGlobalShoppingPublicBetaQaDecisionMatrixAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaDecisionMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaQaDecisionMatrix(matrix) {
    const safe = evaluateGlobalShoppingPublicBetaQaDecisionMatrix(matrix || {});
    safe.rows = buildGlobalShoppingPublicBetaQaDecisionRows(safe);
    safe.rules = buildGlobalShoppingPublicBetaQaDecisionRules(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaQaDecisionMatrix(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaQaDecisionMatrix(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaQaDecisionMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaQaDecisionMatrix = {
    GLOBAL_SHOPPING_PUBLIC_BETA_QA_DECISION_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingPublicBetaQaDecisionMatrix,
    evaluateGlobalShoppingPublicBetaQaDecisionMatrix,
    buildGlobalShoppingPublicBetaQaDecisionRows,
    buildGlobalShoppingPublicBetaQaDecisionRules,
    buildGlobalShoppingPublicBetaQaDecisionMatrixAuditDraft,
    sanitizeGlobalShoppingPublicBetaQaDecisionMatrix
  };
})();
