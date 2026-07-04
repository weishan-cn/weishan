;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION = "4.2.6";
  const QUEUE_NAME = "global_shopping_manual_feedback_review_queue_mock_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_feedback_review_queue_mock_only:true };
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage"];
  const BLOCKED_QUEUE_ACTIONS = ["submit_feedback", "upload_feedback", "create_issue", "create_task", "persist_raw_feedback", "send_email"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /submit_feedback|upload_feedback|create_issue|create_task|persist_raw_feedback|send_email|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "manual_feedback_review_queue_mock_only");
    return ALLOWED_MODES[mode] ? mode : "manual_feedback_review_queue_mock_only";
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
    if (safe.feedbackPersistence === true || safe.queuePersistence === true || safe.persisted === true) blocked.push("feedback persistence");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true || safe.emailEnabled === true) blocked.push("mail");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    ["status", "summary", "title", "subtitle", "queueStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe queue language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingManualFeedbackReviewQueueMock(input) {
    const safe = obj(input);
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const trialOperatorNotesPanelSummary = resolveSummary(safe, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const summaries = [publicBetaReadinessSnapshotSummary, trialFeedbackIntakeMockSummary, trialOperatorNotesPanelSummary, publicBetaCandidateQaFreezeSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review"),
      normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review"),
      normalizeStatus(obj(trialOperatorNotesPanelSummary).status || obj(trialOperatorNotesPanelSummary).notesStatus, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required" && status !== "ready"; });
    const queueStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      queueName:QUEUE_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION,
      queueMode:safeMode(safe.queueMode),
      queueStatus:queueStatus,
      status:queueStatus,
      mockQueueRows:[
        row("manual_feedback_review_queue_mock", "Manual Feedback Review Queue Mock", queueStatus === "blocked" ? "Manual Feedback Review Queue Mock 已阻断" : (queueStatus === "needs_review" ? "Manual Feedback Review Queue Mock 仍需复核" : "Manual Feedback Review Queue Mock 需人工复核"), queueStatus === "blocked" ? "blocked" : "warning"),
        row("feedback_review_queue", "Feedback Review Queue", "反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task", "warning"),
        row("issue_triage", "Issue Triage", "问题分级仅为离线展示，不创建真实任务", "warning")
      ],
      feedbackCategories:["bug_report", "copy_feedback", "comparison_gap", "boundary_question", "offline_scenario_request"],
      redactionRules:REDACTION_RULES.slice(),
      reviewerChecklist:[
        "确认反馈已脱敏",
        "确认不保存用户原文",
        "确认不创建真实 issue/task",
        "确认只做人工复核"
      ],
      blockedQueueActions:BLOCKED_QUEUE_ACTIONS.slice(),
      manualReviewRequired:true,
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      rawUserTextPersistence:false,
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Manual Feedback Review Queue Mock",
        resultLabel:queueStatus === "blocked" ? "Manual Feedback Review Queue Mock 已阻断" : (queueStatus === "needs_review" ? "Manual Feedback Review Queue Mock 仍需复核" : "Manual Feedback Review Queue Mock 需人工复核"),
        caveat:"反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task"
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

  function buildGlobalShoppingManualFeedbackReviewQueueRows(input) {
    return clone(evaluateGlobalShoppingManualFeedbackReviewQueueMock(input || {}).mockQueueRows || []);
  }

  function buildGlobalShoppingManualFeedbackReviewQueueRules(input) {
    const safe = evaluateGlobalShoppingManualFeedbackReviewQueueMock(input || {});
    return clone([
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", safe.feedbackSubmitEnabled === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false),
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false)
    ]);
  }

  function buildGlobalShoppingManualFeedbackReviewQueueMockAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualFeedbackReviewQueueMock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_AUDIT_DRAFT",
      queueName:QUEUE_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION,
      queueStatus:safe.queueStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualFeedbackReviewQueueMock(queue) {
    const safe = evaluateGlobalShoppingManualFeedbackReviewQueueMock(queue || {});
    safe.rows = buildGlobalShoppingManualFeedbackReviewQueueRows(safe);
    safe.rules = buildGlobalShoppingManualFeedbackReviewQueueRules(safe);
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
    safe.rawUserTextPersistence = false;
    return safe;
  }

  function buildGlobalShoppingManualFeedbackReviewQueueMock(input) {
    try {
      return sanitizeGlobalShoppingManualFeedbackReviewQueueMock(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualFeedbackReviewQueueMock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualFeedbackReviewQueueMock = {
    GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION,
    QUEUE_NAME,
    buildGlobalShoppingManualFeedbackReviewQueueMock,
    evaluateGlobalShoppingManualFeedbackReviewQueueMock,
    buildGlobalShoppingManualFeedbackReviewQueueRows,
    buildGlobalShoppingManualFeedbackReviewQueueRules,
    buildGlobalShoppingManualFeedbackReviewQueueMockAuditDraft,
    sanitizeGlobalShoppingManualFeedbackReviewQueueMock
  };
})();
