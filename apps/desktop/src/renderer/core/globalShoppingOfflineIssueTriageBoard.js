;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION = "4.2.6";
  const BOARD_NAME = "global_shopping_offline_issue_triage_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, issue_triage_board_only:true };
  const SEVERITY_BUCKETS = ["critical", "high", "medium", "low", "info", "blocked"];
  const BLOCKED_TRIAGE_ACTIONS = ["create_issue", "create_task", "upload_feedback", "send_email", "open_external", "persist_raw_feedback"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /boundaryExpanded|safetyBoundaryRelaxed|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order|submit_feedback|upload_feedback|create_issue|create_task|send_email|open_external|persist_raw_feedback/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "issue_triage_board_only");
    return ALLOWED_MODES[mode] ? mode : "issue_triage_board_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
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
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.feedbackPersistence === true || safe.queuePersistence === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    ["status", "summary", "title", "subtitle", "triageStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe triage language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineIssueTriageBoard(input) {
    const safe = obj(input);
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const offlineRegressionEvidenceBoardSummary = resolveSummary(safe, "offlineRegressionEvidenceBoardSummary", "WeishanGlobalShoppingOfflineRegressionEvidenceBoard", "buildGlobalShoppingOfflineRegressionEvidenceBoard");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const summaries = [
      publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary,
      offlineRegressionEvidenceBoardSummary,
      noTransactionRegressionGuardSummary,
      noProviderProductionBoundarySummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review"),
      normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review"),
      normalizeStatus(obj(offlineRegressionEvidenceBoardSummary).status || obj(offlineRegressionEvidenceBoardSummary).regressionEvidenceStatus, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review"),
      normalizeStatus(obj(noProviderProductionBoundarySummary).status || obj(noProviderProductionBoundarySummary).boundaryStatus, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required" && status !== "ready"; });
    const triageStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      triageStatus:triageStatus,
      status:triageStatus,
      severityBuckets:SEVERITY_BUCKETS.slice(),
      triageRows:[
        row("offline_issue_triage_board", "Offline Issue Triage Board", triageStatus === "blocked" ? "Offline Issue Triage Board 已阻断" : (triageStatus === "needs_review" ? "Offline Issue Triage Board 仍需复核" : "Offline Issue Triage Board 需人工复核"), triageStatus === "blocked" ? "blocked" : "warning"),
        row("issue_triage", "Issue Triage", "问题分级仅为离线展示，不创建真实任务", "warning"),
        row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      blockedCapabilities:["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create"],
      blockedTriageActions:BLOCKED_TRIAGE_ACTIONS.slice(),
      manualReviewRequired:true,
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      offlineRegressionEvidenceBoardSummary:offlineRegressionEvidenceBoardSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Offline Issue Triage Board",
        resultLabel:triageStatus === "blocked" ? "Offline Issue Triage Board 已阻断" : (triageStatus === "needs_review" ? "Offline Issue Triage Board 仍需复核" : "Offline Issue Triage Board 需人工复核"),
        caveat:"问题分级仅为离线展示，不创建真实任务"
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

  function buildGlobalShoppingOfflineIssueTriageRows(input) {
    return clone(evaluateGlobalShoppingOfflineIssueTriageBoard(input || {}).triageRows || []);
  }

  function buildGlobalShoppingOfflineIssueTriageRules(input) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(input || {});
    return clone([
      rule("severity_buckets_allowed", "severityBuckets 只能包含 critical / high / medium / low / info / blocked", Array.isArray(safe.severityBuckets) && safe.severityBuckets.every(function (item) { return SEVERITY_BUCKETS.indexOf(item) >= 0; })),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", safe.feedbackSubmitEnabled === false)
    ]);
  }

  function buildGlobalShoppingOfflineIssueTriageBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION,
      triageStatus:safe.triageStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineIssueTriageBoard(board) {
    const safe = evaluateGlobalShoppingOfflineIssueTriageBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineIssueTriageRows(safe);
    safe.rules = buildGlobalShoppingOfflineIssueTriageRules(safe);
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
    safe.feedbackSubmitEnabled = false;
    safe.uploadEnabled = false;
    safe.issueCreateEnabled = false;
    safe.taskCreateEnabled = false;
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
    buildGlobalShoppingOfflineIssueTriageRules,
    buildGlobalShoppingOfflineIssueTriageBoardAuditDraft,
    sanitizeGlobalShoppingOfflineIssueTriageBoard
  };
})();
