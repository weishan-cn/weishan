;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_VERSION = "4.1.5";
  const LEDGER_NAME = "global_shopping_public_beta_trial_evidence_ledger_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, trial_evidence_ledger_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "trial_evidence_ledger_only");
    return ALLOWED_MODES[mode] ? mode : "trial_evidence_ledger_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function sanitizeWarnings(value) {
    return toArray(value).map(function (item) { return text(item); }).filter(Boolean).filter(function (item) {
      return !SECRET_VALUE_RE.test(item);
    });
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
    if (safe.ledgerPersistence === true || safe.reportSaved === true || safe.writeFile === true || safe.fileWrite === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw provider persistence");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    ["status", "summary", "title", "subtitle", "ledgerStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaTrialEvidenceLedger(input) {
    const safe = obj(input);
    const publicBetaTrialOperationsConsoleSummary = resolveSummary(safe, "publicBetaTrialOperationsConsoleSummary", "WeishanGlobalShoppingPublicBetaTrialOperationsConsole", "buildGlobalShoppingPublicBetaTrialOperationsConsole");
    const manualQaScenarioRunnerSummary = resolveSummary(safe, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    const offlineFeedbackReviewBoardSummary = resolveSummary(safe, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    const publicBetaManualQaReportCenterSummary = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const publicBetaRcEvidenceSnapshotSummary = resolveSummary(safe, "publicBetaRcEvidenceSnapshotSummary", "WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot", "buildGlobalShoppingPublicBetaRcEvidenceSnapshot");
    const warnings = sanitizeWarnings(safe.knownWarnings || obj(publicBetaManualQaReportCenterSummary).knownWarnings);
    const blocked = blockedReasons(safe);
    const summaries = [
      publicBetaTrialOperationsConsoleSummary,
      manualQaScenarioRunnerSummary,
      offlineFeedbackReviewBoardSummary,
      publicBetaManualQaReportCenterSummary,
      publicBetaRcEvidenceSnapshotSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).ledgerStatus || "", "needs_review"); });
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked" || status === "failed_safe"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready"; });
    const status = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");

    return clone({
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_VERSION,
      ledgerMode:safeMode(safe.ledgerMode),
      status:status,
      ledgerStatus:status,
      scenarioEvidence:text(obj(manualQaScenarioRunnerSummary.userFacingSummary).resultLabel || "Manual QA Scenario Runner 仍需复核"),
      feedbackEvidence:text(obj(offlineFeedbackReviewBoardSummary.userFacingSummary).resultLabel || "Offline Feedback Review Board 仍需复核"),
      noTransactionEvidence:text(obj(publicBetaTrialOperationsConsoleSummary.userFacingSummary).resultLabel || "Public Beta Trial Operations Console 仍需复核"),
      noProviderEvidence:text(obj(publicBetaRcEvidenceSnapshotSummary.userFacingSummary).resultLabel || "RC Evidence Snapshot 仍需复核"),
      qaEvidence:text(obj(publicBetaManualQaReportCenterSummary.userFacingSummary).resultLabel || "Public Beta Manual QA Report Center 仍需复核"),
      knownWarnings:warnings,
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaTrialOperationsConsoleSummary:publicBetaTrialOperationsConsoleSummary,
      manualQaScenarioRunnerSummary:manualQaScenarioRunnerSummary,
      offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary,
      publicBetaManualQaReportCenterSummary:publicBetaManualQaReportCenterSummary,
      publicBetaRcEvidenceSnapshotSummary:publicBetaRcEvidenceSnapshotSummary,
      userFacingSummary:{
        title:"Public Beta Trial Evidence Ledger",
        resultLabel:status === "ready" ? "Public Beta Trial Evidence Ledger 已准备" : (status === "blocked" ? "Public Beta Trial Evidence Ledger 已阻断" : "Public Beta Trial Evidence Ledger 仍需复核"),
        caveat:"只读证据台账仅用于人工复核，不创建真实 issue、不写文件、不导出。"
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

  function buildGlobalShoppingPublicBetaTrialEvidenceRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialEvidenceLedger(input || {});
    return clone([
      row("public_beta_trial_evidence_ledger", "Public Beta Trial Evidence Ledger", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_trial_evidence_scenario", "Scenario Evidence", safe.scenarioEvidence, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_evidence_feedback", "Feedback Evidence", safe.feedbackEvidence, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_evidence_no_transaction", "No-Transaction Evidence", safe.noTransactionEvidence, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_evidence_no_provider", "No-Provider Evidence", safe.noProviderEvidence, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_evidence_qa", "QA Evidence", safe.qaEvidence, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_evidence_review", "Manual Review Required", "只允许继续测试、人工复核或阻断", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialEvidenceSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialEvidenceLedger(input || {});
    return clone([
      section("public_beta_trial_evidence_coverage", "Public Beta Trial Evidence Ledger", safe.userFacingSummary.resultLabel),
      section("public_beta_trial_evidence_boundary", "Manual Review Items", "问题分流仅为离线视图，不创建真实 issue"),
      section("public_beta_trial_evidence_locked", "Locked Capabilities", "不自动发布、不启用 provider、不启用交易")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialEvidenceLedgerAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialEvidenceLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaTrialEvidenceLedger(ledger) {
    const safe = evaluateGlobalShoppingPublicBetaTrialEvidenceLedger(ledger || {});
    safe.rows = buildGlobalShoppingPublicBetaTrialEvidenceRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaTrialEvidenceSections(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaTrialEvidenceLedger(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaTrialEvidenceLedger(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaTrialEvidenceLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaTrialEvidenceLedger = {
    GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_EVIDENCE_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingPublicBetaTrialEvidenceLedger,
    evaluateGlobalShoppingPublicBetaTrialEvidenceLedger,
    buildGlobalShoppingPublicBetaTrialEvidenceRows,
    buildGlobalShoppingPublicBetaTrialEvidenceSections,
    buildGlobalShoppingPublicBetaTrialEvidenceLedgerAuditDraft,
    sanitizeGlobalShoppingPublicBetaTrialEvidenceLedger
  };
})();
