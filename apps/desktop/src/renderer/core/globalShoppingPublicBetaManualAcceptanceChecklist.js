;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION = "4.2.8";
  const CHECKLIST_NAME = "global_shopping_public_beta_manual_acceptance_checklist_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_acceptance_checklist_only:true };
  const CHECKLIST_SCOPE = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create", "data_retention", "evidence_file"];
  const REQUIRED_MANUAL_CHECKS = ["copy_review", "safety_boundary_review", "no_provider_review", "no_payment_review", "no_order_review", "no_feedback_persistence_review", "no_raw_user_text_review", "no_external_open_review"];
  const BLOCKED_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready", "submit_feedback", "upload_feedback", "create_issue", "create_task", "persist_acceptance_record", "persist_evidence_file"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_acceptance_record|boundaryExpanded|safetyBoundaryRelaxed|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order|submit_feedback|upload_feedback|create_issue|create_task/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function section(sectionId, label, value) { return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "manual_acceptance_checklist_only");
    return ALLOWED_MODES[mode] ? mode : "manual_acceptance_checklist_only";
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
    if (safe.acceptanceRecordPersistence === true || safe.persistAcceptanceRecord === true || safe.acceptanceRecordSaved === true) blocked.push("acceptance record persistence");
    if (safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence file persistence");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.feedbackPersistence === true || safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback persistence");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    ["status", "summary", "title", "subtitle", "acceptanceChecklistStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe checklist language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist(input) {
    const safe = obj(input);
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const publicBetaReadinessReviewViewModelSummary = resolveSummary(safe, "publicBetaReadinessReviewViewModelSummary", "WeishanGlobalShoppingPublicBetaReadinessReviewViewModel", "buildGlobalShoppingPublicBetaReadinessReviewViewModel");
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const summaries = [
      publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary,
      offlineIssueTriageBoardSummary,
      publicBetaReadinessReviewViewModelSummary,
      publicBetaCandidateQaFreezeSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review"),
      normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review"),
      normalizeStatus(obj(offlineIssueTriageBoardSummary).status || obj(offlineIssueTriageBoardSummary).triageStatus, "needs_review"),
      normalizeStatus(obj(publicBetaReadinessReviewViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const acceptanceChecklistStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique([].concat(
      Array.isArray(safe.knownWarnings) ? safe.knownWarnings : [],
      Array.isArray(obj(publicBetaReadinessSnapshotSummary).knownWarnings) ? obj(publicBetaReadinessSnapshotSummary).knownWarnings : [],
      Array.isArray(obj(publicBetaCandidateQaFreezeSummary).knownWarnings) ? obj(publicBetaCandidateQaFreezeSummary).knownWarnings : []
    ).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));

    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION,
      checklistMode:safeMode(safe.checklistMode),
      acceptanceChecklistStatus:acceptanceChecklistStatus,
      status:acceptanceChecklistStatus,
      checklistScope:CHECKLIST_SCOPE.slice(),
      manualAcceptanceRows:[
        row("manual_acceptance_checklist", "Public Beta Manual Acceptance Checklist", acceptanceChecklistStatus === "blocked" ? "Public Beta Manual Acceptance Checklist 已阻断" : (acceptanceChecklistStatus === "needs_review" ? "Public Beta Manual Acceptance Checklist 仍需复核" : "Public Beta Manual Acceptance Checklist 需人工复核"), acceptanceChecklistStatus === "blocked" ? "blocked" : "warning"),
        row("manual_acceptance", "Manual Acceptance", "人工验收清单仅为只读展示，不保存验收记录", "warning"),
        row("safety_boundary_review", "Safety Boundary Review", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning"),
        row("known_warnings", "Known Warnings", knownWarnings.length ? knownWarnings.join(" / ") : "既有 secret scan WARN 仅作为已知警告展示", "warning")
      ],
      requiredManualChecks:REQUIRED_MANUAL_CHECKS.slice(),
      blockedActions:BLOCKED_ACTIONS.slice(),
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      acceptanceRecordPersistence:false,
      scenarioInputPersistence:false,
      blockedCapabilities:blocked,
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
      publicBetaReadinessReviewViewModelSummary:publicBetaReadinessReviewViewModelSummary,
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      userFacingSummary:{
        title:"Public Beta Manual Acceptance Checklist",
        resultLabel:acceptanceChecklistStatus === "blocked" ? "Public Beta Manual Acceptance Checklist 已阻断" : (acceptanceChecklistStatus === "needs_review" ? "Public Beta Manual Acceptance Checklist 仍需复核" : "Public Beta Manual Acceptance Checklist 需人工复核"),
        caveat:"人工验收清单仅为只读展示，不保存验收记录"
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

  function buildGlobalShoppingPublicBetaManualAcceptanceChecklistRows(input) {
    return clone(evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist(input || {}).manualAcceptanceRows || []);
  }

  function buildGlobalShoppingPublicBetaManualAcceptanceChecklistSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist(input || {});
    return clone([
      section("manual_acceptance_checklist", "Public Beta Manual Acceptance Checklist", safe.userFacingSummary.resultLabel),
      section("manual_acceptance", "Manual Acceptance", "人工验收清单仅为只读展示，不保存验收记录"),
      section("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaManualAcceptanceChecklistAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION,
      acceptanceChecklistStatus:safe.acceptanceChecklistStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaManualAcceptanceChecklist(checklist) {
    const safe = evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist(checklist || {});
    safe.rows = buildGlobalShoppingPublicBetaManualAcceptanceChecklistRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaManualAcceptanceChecklistSections(safe);
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
    safe.dataRetentionEnabled = false;
    safe.rawUserTextPersistence = false;
    safe.acceptanceRecordPersistence = false;
    safe.scenarioInputPersistence = false;
    return safe;
  }

  function buildGlobalShoppingPublicBetaManualAcceptanceChecklist(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaManualAcceptanceChecklist(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaManualAcceptanceChecklist({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist = {
    GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingPublicBetaManualAcceptanceChecklist,
    evaluateGlobalShoppingPublicBetaManualAcceptanceChecklist,
    buildGlobalShoppingPublicBetaManualAcceptanceChecklistRows,
    buildGlobalShoppingPublicBetaManualAcceptanceChecklistSections,
    buildGlobalShoppingPublicBetaManualAcceptanceChecklistAuditDraft,
    sanitizeGlobalShoppingPublicBetaManualAcceptanceChecklist
  };
})();
