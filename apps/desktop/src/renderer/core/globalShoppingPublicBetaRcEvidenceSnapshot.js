;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_VERSION = "4.1.7";
  const SNAPSHOT_NAME = "global_shopping_public_beta_rc_evidence_snapshot_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, rc_evidence_snapshot_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safeMode(value) {
    const mode = text(value || "rc_evidence_snapshot_only");
    return ALLOWED_MODES[mode] ? mode : "rc_evidence_snapshot_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
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
    if (safe.snapshotPersistence === true || safe.snapshotSaved === true || safe.fileWrite === true || safe.writeFile === true) blocked.push("snapshot persistence");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.email === true || safe.sendMail === true) blocked.push("mail");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot(input) {
    const safe = obj(input);
    const manualQaReportCenterSummary = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const trialFeedbackSafetyGateSummary = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const blocked = blockedReasons(safe);
    const missingRequired = [manualQaReportCenterSummary, trialFeedbackSafetyGateSummary, publicBetaStabilityAuditSummary, offlineTrialReleaseGateSummary, noTransactionRegressionGuardSummary].some(function (summary) {
      return !present(summary);
    });
    const upstreamBlocked = [manualQaReportCenterSummary, trialFeedbackSafetyGateSummary, publicBetaStabilityAuditSummary, offlineTrialReleaseGateSummary, noTransactionRegressionGuardSummary].some(function (summary) {
      return /^(blocked|failed_safe)$/.test(text(obj(summary).status || ""));
    });
    const status = blocked.length || upstreamBlocked ? "blocked" : (missingRequired ? "needs_review" : "ready");
    return clone({
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_VERSION,
      snapshotMode:safeMode(safe.snapshotMode),
      status,
      snapshotStatus:status,
      title:"RC Evidence Snapshot",
      qaEvidence:manualQaReportCenterSummary,
      safetyEvidence:publicBetaStabilityAuditSummary,
      noTransactionEvidence:noTransactionRegressionGuardSummary,
      feedbackEvidence:trialFeedbackSafetyGateSummary,
      manualReviewRequired:true,
      publicBetaManualQaReportCenterSummary:manualQaReportCenterSummary,
      trialFeedbackSafetyGateSummary:trialFeedbackSafetyGateSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"RC Evidence Snapshot",
        resultLabel:status === "ready" ? "RC Evidence Snapshot 已准备" : (status === "blocked" ? "RC Evidence Snapshot 已阻断" : "RC Evidence Snapshot 仍需复核"),
        caveat:"RC 证据快照不写文件、不导出。"
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

  function buildGlobalShoppingPublicBetaRcEvidenceSnapshotRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot(input || {});
    return clone([
      row("public_beta_rc_evidence_snapshot", "RC Evidence Snapshot", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_rc_evidence_qa", "QA Evidence", text(obj(safe.qaEvidence.userFacingSummary).resultLabel || "Public Beta Manual QA Report Center 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_rc_evidence_feedback", "Feedback Safety", text(obj(safe.feedbackEvidence.userFacingSummary).resultLabel || "Trial Feedback Safety Gate 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_rc_evidence_no_transaction", "No-Transaction Evidence", text(obj(obj(safe.noTransactionEvidence).userFacingSummary).resultLabel || "No-Transaction Regression Guard 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_rc_evidence_manual_review", "Manual Review Required", "RC 证据快照不写文件、不导出", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaRcEvidenceSnapshotSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot(input || {});
    return clone([
      section("public_beta_rc_evidence_snapshot_title", "RC Evidence Snapshot", safe.userFacingSummary.resultLabel),
      section("public_beta_rc_evidence_feedback", "Feedback Safety", "反馈仍为草稿，不发送、不上传、不保存用户原文"),
      section("public_beta_rc_evidence_boundary", "No-Transaction Evidence", "不写文件、不导出、不上传")
    ]);
  }

  function buildGlobalShoppingPublicBetaRcEvidenceSnapshotAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_AUDIT_DRAFT",
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaRcEvidenceSnapshot(snapshot) {
    const safe = evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot(snapshot || {});
    safe.rows = buildGlobalShoppingPublicBetaRcEvidenceSnapshotRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaRcEvidenceSnapshotSections(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaRcEvidenceSnapshot(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaRcEvidenceSnapshot(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaRcEvidenceSnapshot({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot = {
    GLOBAL_SHOPPING_PUBLIC_BETA_RC_EVIDENCE_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildGlobalShoppingPublicBetaRcEvidenceSnapshot,
    evaluateGlobalShoppingPublicBetaRcEvidenceSnapshot,
    buildGlobalShoppingPublicBetaRcEvidenceSnapshotRows,
    buildGlobalShoppingPublicBetaRcEvidenceSnapshotSections,
    buildGlobalShoppingPublicBetaRcEvidenceSnapshotAuditDraft,
    sanitizeGlobalShoppingPublicBetaRcEvidenceSnapshot
  };
})();
