;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_VERSION = "4.2.5";
  const BOARD_NAME = "global_shopping_manual_trial_issue_review_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_issue_review_only:true };
  const ALLOWED_BUCKETS = ["ui_copy", "visual_layout", "scenario_gap", "safety_copy", "no_transaction_guard", "feedback_placeholder", "blocked"];
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "manual_issue_review_only");
    return ALLOWED_MODES[mode] ? mode : "manual_issue_review_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
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
    if (safe.issueCreate === true || safe.issueCreated === true || safe.createIssue === true || safe.issueUpload === true) blocked.push("issue create");
    if (safe.upload === true || safe.uploadEnabled === true || safe.uploadIssue === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true || text(safe.externalIssueUrl)) blocked.push("external");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function normalizeBucket(value) {
    const bucket = text(value);
    return ALLOWED_BUCKETS.indexOf(bucket) >= 0 ? bucket : "";
  }
  function deriveBuckets(issueTriage, qaDecision, feedbackReview) {
    const direct = []
      .concat(toArray(obj(issueTriage).issueBuckets))
      .concat(toArray(obj(qaDecision).issueBuckets))
      .concat(toArray(obj(feedbackReview).issueBuckets))
      .map(normalizeBucket)
      .filter(Boolean);
    if (direct.length) {
      return direct.filter(function (value, index, array) { return array.indexOf(value) === index; });
    }
    return ["ui_copy", "visual_layout", "scenario_gap", "safety_copy", "no_transaction_guard", "feedback_placeholder"];
  }

  function evaluateGlobalShoppingManualTrialIssueReviewBoard(input) {
    const safe = obj(input);
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const manualTrialSummaryBoardSummary = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const publicBetaQaDecisionMatrixSummary = resolveSummary(safe, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const offlineFeedbackReviewBoardSummary = resolveSummary(safe, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    const trialFeedbackSafetyGateSummary = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const summaries = [
      offlineIssueTriageBoardSummary,
      manualTrialSummaryBoardSummary,
      publicBetaQaDecisionMatrixSummary,
      offlineFeedbackReviewBoardSummary,
      trialFeedbackSafetyGateSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).triageStatus || obj(summary).trialSummaryStatus || "", "needs_review") === "blocked";
    });
    const upstreamNeedsReview = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).triageStatus || obj(summary).trialSummaryStatus || "", "needs_review") !== "ready";
    });
    const blocked = blockedReasons(safe);
    const issueBuckets = deriveBuckets(offlineIssueTriageBoardSummary, publicBetaQaDecisionMatrixSummary, offlineFeedbackReviewBoardSummary);
    const reviewedItems = issueBuckets.filter(function (item) { return item !== "blocked"; });
    const unresolvedItems = missingRequired || upstreamNeedsReview ? issueBuckets.slice(0, Math.max(1, issueBuckets.length - 1)) : [];
    const feedbackSafetyItems = [
      text(obj(trialFeedbackSafetyGateSummary.userFacingSummary).resultLabel || "Trial Feedback Safety Gate 仍需复核"),
      "问题复核仅为离线视图，不创建真实 issue"
    ];
    const issueReviewStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      issueReviewStatus:issueReviewStatus,
      status:issueReviewStatus,
      issueBuckets:issueBuckets,
      reviewedItems:reviewedItems,
      unresolvedItems:unresolvedItems,
      feedbackSafetyItems:feedbackSafetyItems,
      blockedCapabilities:blocked,
      nextManualAction:issueReviewStatus === "blocked" ? "blocked" : (issueReviewStatus === "ready" ? "manual_review_required" : "continue_testing"),
      manualReviewRequired:true,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary,
      publicBetaQaDecisionMatrixSummary:publicBetaQaDecisionMatrixSummary,
      offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary,
      trialFeedbackSafetyGateSummary:trialFeedbackSafetyGateSummary,
      userFacingSummary:{
        title:"Manual Trial Issue Review Board",
        resultLabel:issueReviewStatus === "ready" ? "Manual Trial Issue Review Board 已准备" : (issueReviewStatus === "blocked" ? "Manual Trial Issue Review Board 已阻断" : "Manual Trial Issue Review Board 仍需复核"),
        caveat:"问题复核仅为离线视图，不创建真实 issue。"
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

  function buildGlobalShoppingManualTrialIssueReviewRows(input) {
    const safe = evaluateGlobalShoppingManualTrialIssueReviewBoard(input || {});
    return clone([
      row("manual_trial_issue_review_board", "Manual Trial Issue Review Board", safe.userFacingSummary.resultLabel, safe.issueReviewStatus === "ready" ? "pass" : (safe.issueReviewStatus === "blocked" ? "blocked" : "warning")),
      row("manual_trial_issue_buckets", "Issue Review", safe.issueBuckets.join(" / "), safe.issueReviewStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_issue_feedback", "Feedback Safety Items", safe.feedbackSafetyItems.join(" / "), safe.issueReviewStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_issue_unresolved", "Unresolved Items", safe.unresolvedItems.length ? safe.unresolvedItems.join(" / ") : "无未解决项", safe.unresolvedItems.length ? "warning" : "pass"),
      row("manual_trial_issue_manual", "Manual Review Required", "问题复核仅为离线视图，不创建真实 issue", "warning")
    ]);
  }

  function buildGlobalShoppingManualTrialIssueReviewSections(input) {
    const safe = evaluateGlobalShoppingManualTrialIssueReviewBoard(input || {});
    return clone([
      { sectionId:"manual_trial_issue_review_board", label:"Manual Trial Issue Review Board", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"manual_trial_issue_review_buckets", label:"Issue Review", value:safe.issueBuckets.join(" / "), redacted:true },
      { sectionId:"manual_trial_issue_review_manual", label:"Manual Review Required", value:"仍需人工复核后再决定下一阶段", redacted:true }
    ]);
  }

  function buildGlobalShoppingManualTrialIssueReviewBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualTrialIssueReviewBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_VERSION,
      issueReviewStatus:safe.issueReviewStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualTrialIssueReviewBoard(board) {
    const safe = evaluateGlobalShoppingManualTrialIssueReviewBoard(board || {});
    safe.rows = buildGlobalShoppingManualTrialIssueReviewRows(safe);
    safe.sections = buildGlobalShoppingManualTrialIssueReviewSections(safe);
    return safe;
  }

  function buildGlobalShoppingManualTrialIssueReviewBoard(input) {
    try {
      return sanitizeGlobalShoppingManualTrialIssueReviewBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualTrialIssueReviewBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualTrialIssueReviewBoard = {
    GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingManualTrialIssueReviewBoard,
    evaluateGlobalShoppingManualTrialIssueReviewBoard,
    buildGlobalShoppingManualTrialIssueReviewRows,
    buildGlobalShoppingManualTrialIssueReviewSections,
    buildGlobalShoppingManualTrialIssueReviewBoardAuditDraft,
    sanitizeGlobalShoppingManualTrialIssueReviewBoard
  };
})();
