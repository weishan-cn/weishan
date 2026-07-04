;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_VERSION = "4.2.2";
  const BOARD_NAME = "global_shopping_manual_trial_summary_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_trial_summary_only:true };
  const REQUIRED_SCENARIOS = ["flight", "hotel", "product", "restricted", "feedback", "no_transaction", "no_provider"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "manual_trial_summary_only");
    return ALLOWED_MODES[mode] ? mode : "manual_trial_summary_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.reportExport === true || safe.export === true || safe.exportEnabled === true) blocked.push("report export");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.email === true || safe.sendMail === true) blocked.push("mail");
    if (safe.issueCreated === true || safe.createIssue === true) blocked.push("issue create");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function normalizeCoverage(summary) {
    const scenarioCoverage = toArray(obj(summary).scenarioCoverage).map(function (item) { return text(item); });
    const map = {
      flight_readonly_search:"flight",
      hotel_readonly_search:"hotel",
      product_readonly_search:"product",
      restricted_category_block:"restricted",
      feedback_draft_disabled:"feedback",
      no_transaction_boundary:"no_transaction",
      no_provider_boundary:"no_provider"
    };
    return scenarioCoverage.map(function (item) { return map[item] || item; }).filter(Boolean);
  }

  function evaluateGlobalShoppingManualTrialSummaryBoard(input) {
    const safe = obj(input);
    const qaFreezeGate = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const trialEvidence = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const qaScenarioRunner = resolveSummary(safe, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    const feedbackReviewBoard = resolveSummary(safe, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    const manualQaReport = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const coveredScenarios = normalizeCoverage(qaScenarioRunner);
    const unresolvedItems = REQUIRED_SCENARIOS.filter(function (item) { return coveredScenarios.indexOf(item) === -1; });
    const blocked = blockedReasons(safe);
    const summaries = [qaFreezeGate, trialEvidence, qaScenarioRunner, feedbackReviewBoard, manualQaReport];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).freezeStatus || "", "needs_review") === "blocked"; });
    const upstreamNeedsReview = summaries.some(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).freezeStatus || "", "needs_review") !== "ready"; });
    const trialSummaryStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || unresolvedItems.length || upstreamNeedsReview ? "needs_review" : "ready");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      trialSummaryStatus:trialSummaryStatus,
      status:trialSummaryStatus,
      coveredScenarios:coveredScenarios,
      unresolvedItems:unresolvedItems,
      blockedCapabilities:blocked,
      feedbackSafetySummary:text(obj(feedbackReviewBoard.userFacingSummary).resultLabel || "反馈安全摘要仍需复核"),
      nextManualAction:trialSummaryStatus === "blocked" ? "blocked" : (trialSummaryStatus === "ready" ? "manual_review_required" : "continue_testing"),
      manualReviewRequired:true,
      publicBetaQaFreezeGateSummary:qaFreezeGate,
      publicBetaTrialEvidenceLedgerSummary:trialEvidence,
      manualQaScenarioRunnerSummary:qaScenarioRunner,
      offlineFeedbackReviewBoardSummary:feedbackReviewBoard,
      publicBetaManualQaReportCenterSummary:manualQaReport,
      userFacingSummary:{
        title:"Manual Trial Summary Board",
        resultLabel:trialSummaryStatus === "ready" ? "Manual Trial Summary Board 已准备" : (trialSummaryStatus === "blocked" ? "Manual Trial Summary Board 已阻断" : "Manual Trial Summary Board 仍需复核"),
        caveat:"只读展示人工试用摘要，不导出报告、不上传、不发邮件。"
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

  function buildGlobalShoppingManualTrialSummaryRows(input) {
    const safe = evaluateGlobalShoppingManualTrialSummaryBoard(input || {});
    return clone([
      row("manual_trial_summary_board", "Manual Trial Summary Board", safe.userFacingSummary.resultLabel, safe.trialSummaryStatus === "ready" ? "pass" : (safe.trialSummaryStatus === "blocked" ? "blocked" : "warning")),
      row("manual_trial_summary_coverage", "Covered Scenarios", safe.coveredScenarios.join(" / "), safe.unresolvedItems.length ? "warning" : "pass"),
      row("manual_trial_summary_unresolved", "Unresolved Items", safe.unresolvedItems.length ? safe.unresolvedItems.join(" / ") : "无未覆盖项", safe.unresolvedItems.length ? "warning" : "pass"),
      row("manual_trial_summary_feedback", "Feedback Safety Summary", safe.feedbackSafetySummary, safe.trialSummaryStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_summary_next", "Next Manual Action", safe.nextManualAction, safe.trialSummaryStatus === "blocked" ? "blocked" : "warning")
    ]);
  }

  function buildGlobalShoppingManualTrialSummarySections(input) {
    const safe = evaluateGlobalShoppingManualTrialSummaryBoard(input || {});
    return clone([
      { sectionId:"manual_trial_summary_board", label:"Manual Trial Summary Board", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"manual_trial_summary_feedback", label:"Feedback Safety Summary", value:safe.feedbackSafetySummary, redacted:true },
      { sectionId:"manual_trial_summary_boundary", label:"Manual Review Required", value:"人工复核后再决定下一阶段", redacted:true }
    ]);
  }

  function buildGlobalShoppingManualTrialSummaryBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualTrialSummaryBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualTrialSummaryBoard(board) {
    const safe = evaluateGlobalShoppingManualTrialSummaryBoard(board || {});
    safe.rows = buildGlobalShoppingManualTrialSummaryRows(safe);
    safe.sections = buildGlobalShoppingManualTrialSummarySections(safe);
    safe.externalUrl = null;
    safe.platformUrl = null;
    safe.providerUrl = null;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.buyButtonEnabled = false;
    safe.checkoutButtonEnabled = false;
    safe.paymentButtonEnabled = false;
    return safe;
  }

  function buildGlobalShoppingManualTrialSummaryBoard(input) {
    try {
      return sanitizeGlobalShoppingManualTrialSummaryBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualTrialSummaryBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualTrialSummaryBoard = {
    GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingManualTrialSummaryBoard,
    evaluateGlobalShoppingManualTrialSummaryBoard,
    buildGlobalShoppingManualTrialSummaryRows,
    buildGlobalShoppingManualTrialSummarySections,
    buildGlobalShoppingManualTrialSummaryBoardAuditDraft,
    sanitizeGlobalShoppingManualTrialSummaryBoard
  };
})();
