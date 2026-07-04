;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION = "4.2.4";
  const FREEZE_NAME = "global_shopping_public_beta_candidate_qa_freeze_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, candidate_qa_freeze_only:true };
  const FROZEN_SCOPE = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create"];
  const ALLOWED_MANUAL_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready", "submit_feedback", "upload_feedback", "create_issue", "create_task"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /boundaryExpanded|safetyBoundaryRelaxed|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order|submit_feedback|upload_feedback|create_issue|create_task/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "candidate_qa_freeze_only");
    return ALLOWED_MODES[mode] ? mode : "candidate_qa_freeze_only";
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
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.feedbackPersistence === true || safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback persistence");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    ["status", "summary", "title", "subtitle", "qaFreezeStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe freeze language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaCandidateQaFreeze(input) {
    const safe = obj(input);
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const trialOperatorNotesPanelSummary = resolveSummary(safe, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const offlineSafetyDeltaBoardSummary = resolveSummary(safe, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    const publicBetaCandidateReviewViewModelSummary = resolveSummary(safe, "publicBetaCandidateReviewViewModelSummary", "WeishanGlobalShoppingPublicBetaCandidateReviewViewModel", "buildGlobalShoppingPublicBetaCandidateReviewViewModel");
    const publicBetaCandidateLockSummary = resolveSummary(safe, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const summaries = [publicBetaCandidateEvidenceReviewSummary, trialOperatorNotesPanelSummary, offlineSafetyDeltaBoardSummary, publicBetaCandidateReviewViewModelSummary, publicBetaCandidateLockSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).status || obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus, "needs_review"),
      normalizeStatus(obj(trialOperatorNotesPanelSummary).status || obj(trialOperatorNotesPanelSummary).notesStatus, "needs_review"),
      normalizeStatus(obj(offlineSafetyDeltaBoardSummary).status || obj(offlineSafetyDeltaBoardSummary).deltaStatus, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateReviewViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateLockSummary).status || obj(publicBetaCandidateLockSummary).candidateLockStatus, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required"; });
    const qaFreezeStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique([].concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : []).concat(Array.isArray(obj(publicBetaCandidateEvidenceReviewSummary).knownWarnings) ? obj(publicBetaCandidateEvidenceReviewSummary).knownWarnings : []).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));

    return clone({
      freezeName:FREEZE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION,
      freezeMode:safeMode(safe.freezeMode),
      qaFreezeStatus:qaFreezeStatus,
      status:qaFreezeStatus,
      frozenScope:FROZEN_SCOPE.slice(),
      frozenChecks:[
        "candidate evidence / operator notes / safety delta / candidate review / candidate lock 仅做只读 QA 冻结",
        "不修改 runtime config、不创建 release、不 push",
        "反馈提交、上传、issue/task 创建保持关闭"
      ],
      allowedManualActions:(qaFreezeStatus === "blocked" ? ["blocked"] : ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"]).slice(),
      blockedActions:BLOCKED_ACTIONS.slice(),
      blockedCapabilities:blocked,
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
      offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary,
      publicBetaCandidateReviewViewModelSummary:publicBetaCandidateReviewViewModelSummary,
      publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
      userFacingSummary:{
        title:"Public Beta Candidate QA Freeze",
        resultLabel:qaFreezeStatus === "blocked" ? "Public Beta Candidate QA Freeze 已阻断" : (qaFreezeStatus === "needs_review" ? "Public Beta Candidate QA Freeze 仍需复核" : "Public Beta Candidate QA Freeze 需人工复核"),
        caveat:"QA 冻结仅为只读范围，不修改配置"
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

  function buildGlobalShoppingPublicBetaCandidateQaFreezeRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateQaFreeze(input || {});
    return clone([
      row("public_beta_candidate_qa_freeze", "Public Beta Candidate QA Freeze", safe.userFacingSummary.resultLabel, safe.qaFreezeStatus === "blocked" ? "blocked" : "warning"),
      row("qa_freeze_scope", "QA Freeze", safe.frozenScope.join(" / "), "warning"),
      row("qa_freeze_checks", "Frozen Checks", safe.frozenChecks.join(" / "), "warning"),
      row("qa_freeze_actions", "Manual Review Required", "QA 冻结仅为只读范围，不修改配置", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateQaFreezeSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateQaFreeze(input || {});
    return clone([
      section("public_beta_candidate_qa_freeze", "Public Beta Candidate QA Freeze", safe.userFacingSummary.resultLabel),
      section("qa_freeze", "QA Freeze", safe.frozenScope.join(" / ")),
      section("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateQaFreezeAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateQaFreeze(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_AUDIT_DRAFT",
      freezeName:FREEZE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION,
      qaFreezeStatus:safe.qaFreezeStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaCandidateQaFreeze(freeze) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateQaFreeze(freeze || {});
    safe.rows = buildGlobalShoppingPublicBetaCandidateQaFreezeRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaCandidateQaFreezeSections(safe);
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

  function buildGlobalShoppingPublicBetaCandidateQaFreeze(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaCandidateQaFreeze(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaCandidateQaFreeze({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaCandidateQaFreeze = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION,
    FREEZE_NAME,
    buildGlobalShoppingPublicBetaCandidateQaFreeze,
    evaluateGlobalShoppingPublicBetaCandidateQaFreeze,
    buildGlobalShoppingPublicBetaCandidateQaFreezeRows,
    buildGlobalShoppingPublicBetaCandidateQaFreezeSections,
    buildGlobalShoppingPublicBetaCandidateQaFreezeAuditDraft,
    sanitizeGlobalShoppingPublicBetaCandidateQaFreeze
  };
})();
