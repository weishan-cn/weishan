;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION = "4.2.6";
  const SNAPSHOT_NAME = "global_shopping_public_beta_readiness_snapshot_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, public_beta_readiness_snapshot_only:true };
  const SNAPSHOT_SCOPE = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create"];
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
    const mode = text(value || "public_beta_readiness_snapshot_only");
    return ALLOWED_MODES[mode] ? mode : "public_beta_readiness_snapshot_only";
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
    if (safe.snapshotPersistence === true || safe.snapshotStored === true) blocked.push("snapshot persistence");
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
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.feedbackPersistence === true || safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback persistence");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle", "readinessSnapshotStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe snapshot language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaReadinessSnapshot(input) {
    const safe = obj(input);
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const offlineRegressionEvidenceBoardSummary = resolveSummary(safe, "offlineRegressionEvidenceBoardSummary", "WeishanGlobalShoppingOfflineRegressionEvidenceBoard", "buildGlobalShoppingOfflineRegressionEvidenceBoard");
    const publicBetaQaFreezeViewModelSummary = resolveSummary(safe, "publicBetaQaFreezeViewModelSummary", "WeishanGlobalShoppingPublicBetaQaFreezeViewModel", "buildGlobalShoppingPublicBetaQaFreezeViewModel");
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const offlineSafetyDeltaBoardSummary = resolveSummary(safe, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    const summaries = [
      publicBetaCandidateQaFreezeSummary,
      trialFeedbackIntakeMockSummary,
      offlineRegressionEvidenceBoardSummary,
      publicBetaQaFreezeViewModelSummary,
      publicBetaCandidateEvidenceReviewSummary,
      offlineSafetyDeltaBoardSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review"),
      normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review"),
      normalizeStatus(obj(offlineRegressionEvidenceBoardSummary).status || obj(offlineRegressionEvidenceBoardSummary).regressionEvidenceStatus, "needs_review"),
      normalizeStatus(obj(publicBetaQaFreezeViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).status || obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus, "needs_review"),
      normalizeStatus(obj(offlineSafetyDeltaBoardSummary).status || obj(offlineSafetyDeltaBoardSummary).deltaStatus, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required" && status !== "ready"; });
    const readinessSnapshotStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique([].concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : []).concat(
      Array.isArray(obj(publicBetaCandidateQaFreezeSummary).knownWarnings) ? obj(publicBetaCandidateQaFreezeSummary).knownWarnings : [],
      Array.isArray(obj(offlineRegressionEvidenceBoardSummary).knownWarnings) ? obj(offlineRegressionEvidenceBoardSummary).knownWarnings : []
    ).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));

    return clone({
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION,
      snapshotMode:safeMode(safe.snapshotMode),
      readinessSnapshotStatus:readinessSnapshotStatus,
      status:readinessSnapshotStatus,
      snapshotScope:SNAPSHOT_SCOPE.slice(),
      readinessRows:[
        row("public_beta_readiness_snapshot", "Public Beta Readiness Snapshot", readinessSnapshotStatus === "blocked" ? "Public Beta Readiness Snapshot 已阻断" : (readinessSnapshotStatus === "needs_review" ? "Public Beta Readiness Snapshot 仍需复核" : "Public Beta Readiness Snapshot 需人工复核"), readinessSnapshotStatus === "blocked" ? "blocked" : "warning"),
        row("readiness_snapshot", "Readiness Snapshot", "准备快照仅为只读展示，不生成文件", "warning"),
        row("feedback_review_queue", "Feedback Review Queue", "反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task", "warning"),
        row("issue_triage", "Issue Triage", "问题分级仅为离线展示，不创建真实任务", "warning")
      ],
      frozenSafetyBoundaries:SNAPSHOT_SCOPE.slice(),
      knownWarnings:knownWarnings,
      allowedManualActions:(readinessSnapshotStatus === "blocked" ? ["blocked"] : ALLOWED_MANUAL_ACTIONS.slice(0, 4)).slice(),
      blockedActions:BLOCKED_ACTIONS.slice(),
      manualReviewRequired:true,
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      offlineRegressionEvidenceBoardSummary:offlineRegressionEvidenceBoardSummary,
      publicBetaQaFreezeViewModelSummary:publicBetaQaFreezeViewModelSummary,
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary,
      blockedCapabilities:blocked,
      userFacingSummary:{
        title:"Public Beta Readiness Snapshot",
        resultLabel:readinessSnapshotStatus === "blocked" ? "Public Beta Readiness Snapshot 已阻断" : (readinessSnapshotStatus === "needs_review" ? "Public Beta Readiness Snapshot 仍需复核" : "Public Beta Readiness Snapshot 需人工复核"),
        caveat:"准备快照仅为只读展示，不生成文件"
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

  function buildGlobalShoppingPublicBetaReadinessSnapshotRows(input) {
    return clone(evaluateGlobalShoppingPublicBetaReadinessSnapshot(input || {}).readinessRows || []);
  }

  function buildGlobalShoppingPublicBetaReadinessSnapshotSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaReadinessSnapshot(input || {});
    return clone([
      section("public_beta_readiness_snapshot", "Public Beta Readiness Snapshot", safe.userFacingSummary.resultLabel),
      section("readiness_snapshot", "Readiness Snapshot", "准备快照仅为只读展示，不生成文件"),
      section("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaReadinessSnapshotAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaReadinessSnapshot(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_AUDIT_DRAFT",
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION,
      readinessSnapshotStatus:safe.readinessSnapshotStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaReadinessSnapshot(snapshot) {
    const safe = evaluateGlobalShoppingPublicBetaReadinessSnapshot(snapshot || {});
    safe.rows = buildGlobalShoppingPublicBetaReadinessSnapshotRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaReadinessSnapshotSections(safe);
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

  function buildGlobalShoppingPublicBetaReadinessSnapshot(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaReadinessSnapshot(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaReadinessSnapshot({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaReadinessSnapshot = {
    GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildGlobalShoppingPublicBetaReadinessSnapshot,
    evaluateGlobalShoppingPublicBetaReadinessSnapshot,
    buildGlobalShoppingPublicBetaReadinessSnapshotRows,
    buildGlobalShoppingPublicBetaReadinessSnapshotSections,
    buildGlobalShoppingPublicBetaReadinessSnapshotAuditDraft,
    sanitizeGlobalShoppingPublicBetaReadinessSnapshot
  };
})();
