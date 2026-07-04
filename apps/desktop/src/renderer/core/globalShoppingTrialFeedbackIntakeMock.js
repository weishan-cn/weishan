;(function () {
  "use strict";

  const GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION = "4.2.3";
  const MOCK_NAME = "global_shopping_trial_feedback_intake_mock_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, feedback_intake_mock_only:true };
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage"];
  const BLOCKED_INTAKE_ACTIONS = ["submit_feedback", "upload_feedback", "create_issue", "create_task", "send_mail"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /submit_feedback|upload_feedback|create_issue|create_task|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "feedback_intake_mock_only");
    return ALLOWED_MODES[mode] ? mode : "feedback_intake_mock_only";
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
    if (safe.feedbackPersistence === true || safe.persisted === true) blocked.push("feedback persistence");
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
    ["status", "summary", "title", "subtitle", "intakeStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe intake language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingTrialFeedbackIntakeMock(input) {
    const safe = obj(input);
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const trialOperatorNotesPanelSummary = resolveSummary(safe, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const manualNextPhaseDossierSummary = resolveSummary(safe, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    const summaries = [publicBetaCandidateQaFreezeSummary, trialOperatorNotesPanelSummary, publicBetaCandidateEvidenceReviewSummary, manualNextPhaseDossierSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review"),
      normalizeStatus(obj(trialOperatorNotesPanelSummary).status || obj(trialOperatorNotesPanelSummary).notesStatus, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).status || obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus, "needs_review"),
      normalizeStatus(obj(manualNextPhaseDossierSummary).status || obj(manualNextPhaseDossierSummary).dossierStatus, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required"; });
    const intakeStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      mockName:MOCK_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION,
      mockMode:safeMode(safe.mockMode),
      intakeStatus:intakeStatus,
      status:intakeStatus,
      feedbackCategories:["bug_report", "copy_feedback", "comparison_gap", "boundary_question", "offline_scenario_request"],
      mockFeedbackRows:[
        row("feedback_how_to_collect", "Feedback Intake", "反馈入口仅为 Mock，不保存、不上传、不创建任务", "warning"),
        row("feedback_privacy_boundary", "Privacy Boundary", "不收集真实联系方式、账号、订单、证件、支付信息", "warning")
      ],
      redactionRules:REDACTION_RULES.slice(),
      blockedIntakeActions:BLOCKED_INTAKE_ACTIONS.slice(),
      manualReviewRequired:true,
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      rawUserTextPersistence:false,
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      manualNextPhaseDossierSummary:manualNextPhaseDossierSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Trial Feedback Intake Mock",
        resultLabel:intakeStatus === "blocked" ? "Trial Feedback Intake Mock 已阻断" : (intakeStatus === "needs_review" ? "Trial Feedback Intake Mock 仍需复核" : "Trial Feedback Intake Mock 需人工复核"),
        caveat:"反馈入口仅为 Mock，不保存、不上传、不创建任务"
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

  function buildGlobalShoppingTrialFeedbackIntakeRows(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackIntakeMock(input || {});
    return clone([
      row("trial_feedback_intake_mock", "Trial Feedback Intake Mock", safe.userFacingSummary.resultLabel, safe.intakeStatus === "blocked" ? "blocked" : "warning"),
      row("feedback_intake", "Feedback Intake", "反馈入口仅为 Mock，不保存、不上传、不创建任务", "warning"),
      row("feedback_redaction", "Manual Review Required", "不收集真实联系方式、账号、订单、证件、支付信息", "warning")
    ]);
  }

  function buildGlobalShoppingTrialFeedbackIntakeRules(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackIntakeMock(input || {});
    return clone([
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", safe.feedbackSubmitEnabled === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false),
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false)
    ]);
  }

  function buildGlobalShoppingTrialFeedbackIntakeMockAuditDraft(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackIntakeMock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_AUDIT_DRAFT",
      mockName:MOCK_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION,
      intakeStatus:safe.intakeStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingTrialFeedbackIntakeMock(mock) {
    const safe = evaluateGlobalShoppingTrialFeedbackIntakeMock(mock || {});
    safe.rows = buildGlobalShoppingTrialFeedbackIntakeRows(safe);
    safe.rules = buildGlobalShoppingTrialFeedbackIntakeRules(safe);
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

  function buildGlobalShoppingTrialFeedbackIntakeMock(input) {
    try {
      return sanitizeGlobalShoppingTrialFeedbackIntakeMock(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingTrialFeedbackIntakeMock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingTrialFeedbackIntakeMock = {
    GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION,
    MOCK_NAME,
    buildGlobalShoppingTrialFeedbackIntakeMock,
    evaluateGlobalShoppingTrialFeedbackIntakeMock,
    buildGlobalShoppingTrialFeedbackIntakeRows,
    buildGlobalShoppingTrialFeedbackIntakeRules,
    buildGlobalShoppingTrialFeedbackIntakeMockAuditDraft,
    sanitizeGlobalShoppingTrialFeedbackIntakeMock
  };
})();
