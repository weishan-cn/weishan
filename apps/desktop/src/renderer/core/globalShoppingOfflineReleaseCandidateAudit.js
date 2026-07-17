;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_VERSION = "4.2.8";
  const AUDIT_NAME = "global_shopping_offline_release_candidate_audit_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_release_candidate_audit_only:true };
  const AUDIT_SCOPE = ["release", "tag", "push", "provider", "network", "payment", "order", "ticketing", "external_open", "feedback_submit", "upload", "rc_audit", "evidence_file"];
  const BLOCKED_AUDIT_ACTIONS = ["create_release", "create_release_draft", "publish_release", "push_tag", "enable_provider", "enable_payment", "enable_order", "persist_rc_audit", "export_file", "upload_file", "send_email"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /create_release|publish_release|push_tag|persist_rc_audit|export_file|upload_file|send_email|file write|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "offline_release_candidate_audit_only");
    return ALLOWED_MODES[mode] ? mode : "offline_release_candidate_audit_only";
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
    if (safe.releaseCandidateAuditPersistence === true || safe.persistRcAudit === true || safe.persistReleaseCandidateAudit === true) blocked.push("release candidate audit persistence");
    if (safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence file persistence");
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
    if (safe.release === true || safe.createRelease === true || safe.releaseDraft === true || safe.publishRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true || safe.pushTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle", "releaseCandidateAuditStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe release candidate audit language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineReleaseCandidateAudit(input) {
    const safe = obj(input);
    const publicBetaFinalAcceptanceLockSummary = resolveSummary(safe, "publicBetaFinalAcceptanceLockSummary", "WeishanGlobalShoppingPublicBetaFinalAcceptanceLock", "buildGlobalShoppingPublicBetaFinalAcceptanceLock");
    const publicBetaOfflineAcceptanceViewModelSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceViewModelSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceViewModel", "buildGlobalShoppingPublicBetaOfflineAcceptanceViewModel");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const summaries = [
      publicBetaFinalAcceptanceLockSummary,
      publicBetaOfflineAcceptanceViewModelSummary,
      offlineLaunchBlockerMatrixSummary,
      noProviderProductionBoundarySummary
    ];
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).finalAcceptanceLockStatus || obj(summary).offlineLaunchBlockerMatrixStatus || obj(summary).productionBoundaryStatus); });
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const releaseCandidateAuditStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_VERSION,
      auditMode:safeMode(safe.auditMode),
      releaseCandidateAuditStatus:releaseCandidateAuditStatus,
      status:releaseCandidateAuditStatus,
      auditScope:AUDIT_SCOPE.slice(),
      auditRows:[
        row("offline_release_candidate_audit", "Offline Release Candidate Audit", releaseCandidateAuditStatus === "blocked" ? "Offline Release Candidate Audit 已阻断" : (releaseCandidateAuditStatus === "needs_review" ? "Offline Release Candidate Audit 仍需复核" : "Offline Release Candidate Audit 需人工复核"), releaseCandidateAuditStatus === "blocked" ? "blocked" : "warning"),
        row("release_candidate_audit", "Release Candidate Audit", "离线 RC 审计不创建 release、不生成审计文件", "warning"),
        row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      releaseBlocked:true,
      launchBlocked:true,
      providerBlocked:true,
      transactionBlocked:true,
      persistenceBlocked:true,
      blockedAuditActions:BLOCKED_AUDIT_ACTIONS.slice(),
      manualReviewRequired:true,
      blockedReasons:blocked,
      releaseCandidateAuditPersistence:false,
      publicBetaFinalAcceptanceLockSummary:publicBetaFinalAcceptanceLockSummary,
      publicBetaOfflineAcceptanceViewModelSummary:publicBetaOfflineAcceptanceViewModelSummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      userFacingSummary:{
        title:"Offline Release Candidate Audit",
        resultLabel:releaseCandidateAuditStatus === "blocked" ? "Offline Release Candidate Audit 已阻断" : (releaseCandidateAuditStatus === "needs_review" ? "Offline Release Candidate Audit 仍需复核" : "Offline Release Candidate Audit 需人工复核"),
        caveat:"离线 RC 审计不创建 release、不生成审计文件。"
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

  function buildGlobalShoppingOfflineReleaseCandidateAuditRows(input) {
    return clone(evaluateGlobalShoppingOfflineReleaseCandidateAudit(input || {}).auditRows || []);
  }

  function buildGlobalShoppingOfflineReleaseCandidateAuditRules(input) {
    const safe = evaluateGlobalShoppingOfflineReleaseCandidateAudit(input || {});
    return clone([
      rule("release_blocked", "releaseBlocked 必须 true", safe.releaseBlocked === true),
      rule("launch_blocked", "launchBlocked 必须 true", safe.launchBlocked === true),
      rule("provider_blocked", "providerBlocked 必须 true", safe.providerBlocked === true),
      rule("transaction_blocked", "transactionBlocked 必须 true", safe.transactionBlocked === true),
      rule("persistence_blocked", "persistenceBlocked 必须 true", safe.persistenceBlocked === true),
      rule("rc_audit_persistence_disabled", "releaseCandidateAuditPersistence 必须 false", safe.releaseCandidateAuditPersistence === false)
    ]);
  }

  function buildGlobalShoppingOfflineReleaseCandidateAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineReleaseCandidateAudit(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_DRAFT",
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_VERSION,
      releaseCandidateAuditStatus:safe.releaseCandidateAuditStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineReleaseCandidateAudit(audit) {
    const safe = evaluateGlobalShoppingOfflineReleaseCandidateAudit(audit || {});
    safe.rows = buildGlobalShoppingOfflineReleaseCandidateAuditRows(safe);
    safe.rules = buildGlobalShoppingOfflineReleaseCandidateAuditRules(safe);
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
    safe.releaseCandidateAuditPersistence = false;
    return safe;
  }

  function buildGlobalShoppingOfflineReleaseCandidateAudit(input) {
    try {
      return sanitizeGlobalShoppingOfflineReleaseCandidateAudit(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineReleaseCandidateAudit({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineReleaseCandidateAudit = {
    GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_VERSION,
    AUDIT_NAME,
    buildGlobalShoppingOfflineReleaseCandidateAudit,
    evaluateGlobalShoppingOfflineReleaseCandidateAudit,
    buildGlobalShoppingOfflineReleaseCandidateAuditRows,
    buildGlobalShoppingOfflineReleaseCandidateAuditRules,
    buildGlobalShoppingOfflineReleaseCandidateAuditDraft,
    sanitizeGlobalShoppingOfflineReleaseCandidateAudit
  };
})();
