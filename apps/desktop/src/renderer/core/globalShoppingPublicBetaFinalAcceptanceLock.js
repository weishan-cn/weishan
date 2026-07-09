;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_VERSION = "4.2.7";
  const LOCK_NAME = "global_shopping_public_beta_final_acceptance_lock_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_acceptance_lock_only:true };
  const LOCKED_ACCEPTANCE_SCOPE = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create", "data_retention", "evidence_file", "rc_audit"];
  const LOCKED_SAFETY_BOUNDARIES = ["no_real_provider", "no_network", "no_external_open", "no_payment", "no_order", "no_ticketing", "no_release_mutation", "no_push", "no_launch", "no_feedback_submit", "no_upload", "no_issue_task_creation", "no_acceptance_record_persistence", "no_evidence_file_persistence", "no_rc_audit_persistence"];
  const ALLOWED_MANUAL_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready", "submit_feedback", "upload_feedback", "create_issue", "create_task", "persist_acceptance_record", "persist_evidence_file", "persist_rc_audit"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_acceptance_record|persist_evidence_file|persist_rc_audit|file write|export|download|upload|send_email|enable_provider|enable_payment|enable_order|auto_publish|auto_launch|ready_to_publish|production_ready/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function section(sectionId, label, value) { return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "final_acceptance_lock_only");
    return ALLOWED_MODES[mode] ? mode : "final_acceptance_lock_only";
  }
  function normalizeStatus(value) {
    const status = text(value || "needs_review");
    return /^(manual_review_required|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
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
    if (safe.acceptanceRecordPersistence === true || safe.persistAcceptanceRecord === true) blocked.push("acceptance record persistence");
    if (safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence file persistence");
    if (safe.releaseCandidateAuditPersistence === true || safe.persistRcAudit === true || safe.persistReleaseCandidateAudit === true) blocked.push("release candidate audit persistence");
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
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
    ["status", "summary", "title", "subtitle", "finalAcceptanceLockStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe final acceptance lock language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaFinalAcceptanceLock(input) {
    const safe = obj(input);
    const publicBetaOfflineAcceptanceEvidenceCenterSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    const manualScenarioReviewBoardSummary = resolveSummary(safe, "manualScenarioReviewBoardSummary", "WeishanGlobalShoppingManualScenarioReviewBoard", "buildGlobalShoppingManualScenarioReviewBoard");
    const zeroPersistenceRegressionGateSummary = resolveSummary(safe, "zeroPersistenceRegressionGateSummary", "WeishanGlobalShoppingZeroPersistenceRegressionGate", "buildGlobalShoppingZeroPersistenceRegressionGate");
    const publicBetaOfflineAcceptanceViewModelSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceViewModelSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceViewModel", "buildGlobalShoppingPublicBetaOfflineAcceptanceViewModel");
    const summaries = [
      publicBetaOfflineAcceptanceEvidenceCenterSummary,
      manualScenarioReviewBoardSummary,
      zeroPersistenceRegressionGateSummary,
      publicBetaOfflineAcceptanceViewModelSummary
    ];
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).evidenceCenterStatus || obj(summary).scenarioReviewStatus || obj(summary).zeroPersistenceStatus); });
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const finalAcceptanceLockStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique([].concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : []).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));

    return clone({
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_VERSION,
      lockMode:safeMode(safe.lockMode),
      finalAcceptanceLockStatus:finalAcceptanceLockStatus,
      status:finalAcceptanceLockStatus,
      lockedAcceptanceScope:LOCKED_ACCEPTANCE_SCOPE.slice(),
      lockedSafetyBoundaries:LOCKED_SAFETY_BOUNDARIES.slice(),
      allowedManualActions:ALLOWED_MANUAL_ACTIONS.slice(),
      blockedActions:BLOCKED_ACTIONS.slice(),
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary,
      manualScenarioReviewBoardSummary:manualScenarioReviewBoardSummary,
      zeroPersistenceRegressionGateSummary:zeroPersistenceRegressionGateSummary,
      publicBetaOfflineAcceptanceViewModelSummary:publicBetaOfflineAcceptanceViewModelSummary,
      userFacingSummary:{
        title:"Public Beta Final Acceptance Lock",
        resultLabel:finalAcceptanceLockStatus === "blocked" ? "Public Beta Final Acceptance Lock 已阻断" : (finalAcceptanceLockStatus === "needs_review" ? "Public Beta Final Acceptance Lock 仍需复核" : "Public Beta Final Acceptance Lock 需人工复核"),
        caveat:"最终人工验收锁定仅为只读展示，不保存验收记录。"
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
      acceptanceRecordPersistence:false,
      evidenceFilePersistence:false,
      releaseCandidateAuditPersistence:false,
      rawUserTextPersistence:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceLockRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalAcceptanceLock(input || {});
    return clone([
      row("public_beta_final_acceptance_lock", "Public Beta Final Acceptance Lock", text(obj(safe.userFacingSummary).resultLabel || "Public Beta Final Acceptance Lock 仍需复核"), safe.finalAcceptanceLockStatus === "blocked" ? "blocked" : "warning"),
      row("final_acceptance", "Final Acceptance", "最终人工验收锁定仅为只读展示，不保存验收记录", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceLockSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalAcceptanceLock(input || {});
    return clone([
      section("final_acceptance", "Final Acceptance", text(obj(safe.userFacingSummary).resultLabel || "Public Beta Final Acceptance Lock 仍需复核")),
      section("locked_scope", "Locked Acceptance Scope", safe.lockedAcceptanceScope.join(" / ")),
      section("locked_boundaries", "Locked Safety Boundaries", safe.lockedSafetyBoundaries.join(" / "))
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceLockAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalAcceptanceLock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_AUDIT_DRAFT",
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_VERSION,
      finalAcceptanceLockStatus:safe.finalAcceptanceLockStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaFinalAcceptanceLock(lock) {
    const safe = evaluateGlobalShoppingPublicBetaFinalAcceptanceLock(lock || {});
    safe.rows = buildGlobalShoppingPublicBetaFinalAcceptanceLockRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaFinalAcceptanceLockSections(safe);
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
    safe.acceptanceRecordPersistence = false;
    safe.evidenceFilePersistence = false;
    safe.releaseCandidateAuditPersistence = false;
    safe.rawUserTextPersistence = false;
    return safe;
  }

  function buildGlobalShoppingPublicBetaFinalAcceptanceLock(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalAcceptanceLock(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalAcceptanceLock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalAcceptanceLock = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_VERSION,
    LOCK_NAME,
    buildGlobalShoppingPublicBetaFinalAcceptanceLock,
    evaluateGlobalShoppingPublicBetaFinalAcceptanceLock,
    buildGlobalShoppingPublicBetaFinalAcceptanceLockRows,
    buildGlobalShoppingPublicBetaFinalAcceptanceLockSections,
    buildGlobalShoppingPublicBetaFinalAcceptanceLockAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalAcceptanceLock
  };
})();
