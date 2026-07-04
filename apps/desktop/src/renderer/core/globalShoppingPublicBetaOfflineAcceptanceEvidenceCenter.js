;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION = "4.2.6";
  const CENTER_NAME = "global_shopping_public_beta_offline_acceptance_evidence_center_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_acceptance_evidence_center_only:true };
  const EVIDENCE_SCOPE = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create", "data_retention", "evidence_file"];
  const BLOCKED_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready", "submit_feedback", "upload_feedback", "create_issue", "create_task", "persist_acceptance_record", "persist_evidence_file"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_acceptance_record|persist_evidence_file|file write|export|download|upload|send_email|create_issue|create_task|enable_provider|enable_payment|enable_order|auto_publish|auto_launch|ready_to_publish|production_ready/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function section(sectionId, label, value) { return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "offline_acceptance_evidence_center_only");
    return ALLOWED_MODES[mode] ? mode : "offline_acceptance_evidence_center_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
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
    if (safe.evidencePersistence === true || safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence file persistence");
    if (safe.acceptanceRecordPersistence === true || safe.persistAcceptanceRecord === true) blocked.push("acceptance record persistence");
    if (safe.feedbackPersistence === true || safe.persistFeedback === true || safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback persistence");
    if (safe.scenarioInputPersistence === true || safe.persistScenarioInput === true) blocked.push("scenario input persistence");
    if (safe.scenarioReviewPersistence === true || safe.persistScenarioReview === true) blocked.push("scenario review persistence");
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle", "evidenceCenterStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe evidence center language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input) {
    const safe = obj(input);
    const publicBetaManualAcceptanceChecklistSummary = resolveSummary(safe, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const offlineUserScenarioPackSummary = resolveSummary(safe, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    const noDataRetentionGuardSummary = resolveSummary(safe, "noDataRetentionGuardSummary", "WeishanGlobalShoppingNoDataRetentionGuard", "buildGlobalShoppingNoDataRetentionGuard");
    const publicBetaAcceptanceReviewViewModelSummary = resolveSummary(safe, "publicBetaAcceptanceReviewViewModelSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewViewModel", "buildGlobalShoppingPublicBetaAcceptanceReviewViewModel");
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const summaries = [
      publicBetaManualAcceptanceChecklistSummary,
      offlineUserScenarioPackSummary,
      noDataRetentionGuardSummary,
      publicBetaAcceptanceReviewViewModelSummary,
      publicBetaReadinessSnapshotSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaManualAcceptanceChecklistSummary).status || obj(publicBetaManualAcceptanceChecklistSummary).acceptanceChecklistStatus, "needs_review"),
      normalizeStatus(obj(offlineUserScenarioPackSummary).status || obj(offlineUserScenarioPackSummary).scenarioPackStatus, "needs_review"),
      normalizeStatus(obj(noDataRetentionGuardSummary).status || obj(noDataRetentionGuardSummary).noDataRetentionStatus, "needs_review"),
      normalizeStatus(obj(publicBetaAcceptanceReviewViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const knownWarnings = unique([].concat(
      Array.isArray(safe.knownWarnings) ? safe.knownWarnings : [],
      Array.isArray(obj(publicBetaManualAcceptanceChecklistSummary).knownWarnings) ? obj(publicBetaManualAcceptanceChecklistSummary).knownWarnings : [],
      Array.isArray(obj(publicBetaReadinessSnapshotSummary).knownWarnings) ? obj(publicBetaReadinessSnapshotSummary).knownWarnings : []
    ).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));
    const evidenceCenterStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION,
      centerMode:safeMode(safe.centerMode),
      evidenceCenterStatus:evidenceCenterStatus,
      status:evidenceCenterStatus,
      evidenceScope:EVIDENCE_SCOPE.slice(),
      acceptanceEvidenceRows:[
        row("public_beta_manual_acceptance_checklist", "Public Beta Manual Acceptance Checklist", text(obj(publicBetaManualAcceptanceChecklistSummary.userFacingSummary).resultLabel || "Public Beta Manual Acceptance Checklist 仍需复核"), evidenceCenterStatus === "blocked" ? "blocked" : "warning"),
        row("manual_acceptance", "Offline Acceptance Evidence", "离线验收证据中心仅为只读展示，不生成证据文件", "warning")
      ],
      scenarioEvidenceRows:[
        row("offline_user_scenario_pack", "Offline User Scenario Pack", text(obj(offlineUserScenarioPackSummary.userFacingSummary).resultLabel || "Offline User Scenario Pack 仍需复核"), evidenceCenterStatus === "blocked" ? "blocked" : "warning"),
        row("scenario_review", "Scenario Review", "人工场景复核板仅为样例复核，不保存场景输入或复核结果", "warning")
      ],
      noRetentionEvidenceRows:[
        row("no_data_retention_guard", "No-Data-Retention Guard", text(obj(noDataRetentionGuardSummary.userFacingSummary).resultLabel || "No-Data-Retention Guard 仍需复核"), evidenceCenterStatus === "blocked" ? "blocked" : "warning"),
        row("zero_persistence", "Zero Persistence", "零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件", "warning")
      ],
      blockedActions:BLOCKED_ACTIONS.slice(),
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
      offlineUserScenarioPackSummary:offlineUserScenarioPackSummary,
      noDataRetentionGuardSummary:noDataRetentionGuardSummary,
      publicBetaAcceptanceReviewViewModelSummary:publicBetaAcceptanceReviewViewModelSummary,
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      userFacingSummary:{
        title:"Public Beta Offline Acceptance Evidence Center",
        resultLabel:evidenceCenterStatus === "blocked" ? "Public Beta Offline Acceptance Evidence Center 已阻断" : (evidenceCenterStatus === "needs_review" ? "Public Beta Offline Acceptance Evidence Center 仍需复核" : "Public Beta Offline Acceptance Evidence Center 需人工复核"),
        caveat:"Evidence Center 只表示只读证据汇总，不生成真实证据文件。"
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
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      acceptanceRecordPersistence:false,
      scenarioInputPersistence:false,
      evidenceFilePersistence:false,
      scenarioReviewPersistence:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input || {});
    return clone([].concat(safe.acceptanceEvidenceRows || [], safe.scenarioEvidenceRows || [], safe.noRetentionEvidenceRows || []));
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input || {});
    return clone([
      section("offline_acceptance_evidence", "Offline Acceptance Evidence", text(obj(safe.userFacingSummary).resultLabel || "Public Beta Offline Acceptance Evidence Center 仍需复核")),
      section("scenario_review", "Scenario Review", "人工场景复核板仅为样例复核，不保存场景输入或复核结果"),
      section("zero_persistence", "Zero Persistence", "零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件")
    ]);
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenterAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION,
      evidenceCenterStatus:safe.evidenceCenterStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(center) {
    const safe = evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(center || {});
    safe.rows = buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceSections(safe);
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
    safe.evidenceFilePersistence = false;
    safe.scenarioReviewPersistence = false;
    return safe;
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter = {
    GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter,
    evaluateGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter,
    buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceRows,
    buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceSections,
    buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenterAuditDraft,
    sanitizeGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter
  };
})();
