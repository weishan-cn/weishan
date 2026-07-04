;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION = "4.1.8";
  const BOARD_NAME = "global_shopping_offline_issue_triage_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_issue_triage_only:true };
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "offline_issue_triage_only");
    return ALLOWED_MODES[mode] ? mode : "offline_issue_triage_only";
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
    if (safe.issueCreated === true || safe.createIssue === true || safe.feedbackTaskCreated === true) blocked.push("issue created");
    if (safe.uploadEnabled === true || safe.upload === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.rawUserText === true) blocked.push("raw user text");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingOfflineIssueTriageBoard(input) {
    const safe = obj(input);
    const publicBetaTrialEvidenceLedgerSummary = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const publicBetaQaDecisionMatrixSummary = resolveSummary(safe, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const offlineFeedbackReviewBoardSummary = resolveSummary(safe, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    const trialFeedbackSafetyGateSummary = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const blocked = blockedReasons(safe);
    const summaries = [
      publicBetaTrialEvidenceLedgerSummary,
      publicBetaQaDecisionMatrixSummary,
      offlineFeedbackReviewBoardSummary,
      trialFeedbackSafetyGateSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || "", "needs_review"); });
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked" || status === "failed_safe"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready"; });
    const status = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      status:status,
      triageStatus:status,
      allowedDecisions:["continue_testing", "manual_review_required", "blocked"],
      blockedDecisions:["issue_created", "upload_feedback", "send_feedback"],
      manualReviewItems:[
        "Public Beta Trial Evidence Ledger",
        "QA Decision Matrix",
        "Offline Feedback Review Board",
        "Trial Feedback Safety Gate"
      ],
      manualReviewRequired:true,
      publicBetaTrialEvidenceLedgerSummary:publicBetaTrialEvidenceLedgerSummary,
      publicBetaQaDecisionMatrixSummary:publicBetaQaDecisionMatrixSummary,
      offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary,
      trialFeedbackSafetyGateSummary:trialFeedbackSafetyGateSummary,
      userFacingSummary:{
        title:"Offline Issue Triage Board",
        resultLabel:status === "ready" ? "Offline Issue Triage Board 已准备" : (status === "blocked" ? "Offline Issue Triage Board 已阻断" : "Offline Issue Triage Board 仍需复核"),
        caveat:"问题分流仅为离线视图，不创建真实 issue。"
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

  function buildGlobalShoppingOfflineIssueTriageRows(input) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(input || {});
    return clone([
      row("offline_issue_triage_board", "Offline Issue Triage Board", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_issue_triage_allowed", "Allowed Decisions", safe.allowedDecisions.join(" / "), safe.status === "blocked" ? "blocked" : "warning"),
      row("offline_issue_triage_blocked", "Blocked Decisions", safe.blockedDecisions.join(" / "), "warning"),
      row("offline_issue_triage_manual_items", "Manual Review Items", safe.manualReviewItems.join(" / "), "warning"),
      row("offline_issue_triage_review", "Manual Review Required", "问题分流仅为离线视图，不创建真实 issue", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineIssueTriageSections(input) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(input || {});
    return clone([
      { sectionId:"offline_issue_triage_status", label:"Offline Issue Triage Board", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"offline_issue_triage_boundary", label:"Manual Review Items", value:"只允许继续测试、人工复核或阻断", redacted:true },
      { sectionId:"offline_issue_triage_locked", label:"Locked Capabilities", value:"不自动发布、不启用 provider、不启用交易", redacted:true }
    ]);
  }

  function buildGlobalShoppingOfflineIssueTriageBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineIssueTriageBoard(board) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineIssueTriageRows(safe);
    safe.sections = buildGlobalShoppingOfflineIssueTriageSections(safe);
    return safe;
  }

  function buildGlobalShoppingOfflineIssueTriageBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineIssueTriageBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineIssueTriageBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineIssueTriageBoard = {
    GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineIssueTriageBoard,
    evaluateGlobalShoppingOfflineIssueTriageBoard,
    buildGlobalShoppingOfflineIssueTriageRows,
    buildGlobalShoppingOfflineIssueTriageSections,
    buildGlobalShoppingOfflineIssueTriageBoardAuditDraft,
    sanitizeGlobalShoppingOfflineIssueTriageBoard
  };
})();
