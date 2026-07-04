;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_VERSION = "4.1.9";
  const SUMMARY_NAME = "global_shopping_public_beta_freeze_evidence_summary_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, freeze_evidence_summary_only:true };
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "freeze_evidence_summary_only");
    return ALLOWED_MODES[mode] ? mode : "freeze_evidence_summary_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function sanitizeWarnings(value) {
    return toArray(value).map(function (item) { return text(item); }).filter(Boolean).filter(function (item) {
      return !SECRET_VALUE_RE.test(item);
    });
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
    if (safe.realFreeze === true || safe.freezeConfig === true) blocked.push("real freeze");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true || safe.rawUserTextPersistence === true) blocked.push("raw persistence");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary(input) {
    const safe = obj(input);
    const publicBetaQaFreezeGateSummary = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const manualTrialSummaryBoardSummary = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const offlineReadinessReviewPanelSummary = resolveSummary(safe, "offlineReadinessReviewPanelSummary", "WeishanGlobalShoppingOfflineReadinessReviewPanel", "buildGlobalShoppingOfflineReadinessReviewPanel");
    const publicBetaFreezeReviewViewModelSummary = resolveSummary(safe, "publicBetaFreezeReviewViewModelSummary", "WeishanGlobalShoppingPublicBetaFreezeReviewViewModel", "buildGlobalShoppingPublicBetaFreezeReviewViewModel");
    const publicBetaTrialEvidenceLedgerSummary = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const summaries = [
      publicBetaQaFreezeGateSummary,
      manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary,
      publicBetaFreezeReviewViewModelSummary,
      publicBetaTrialEvidenceLedgerSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).freezeStatus || obj(summary).trialSummaryStatus || obj(summary).readinessStatus || "", "needs_review") === "blocked";
    });
    const upstreamNeedsReview = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).freezeStatus || obj(summary).trialSummaryStatus || obj(summary).readinessStatus || "", "needs_review") !== "ready";
    });
    const warnings = sanitizeWarnings(safe.knownWarnings || obj(publicBetaQaFreezeGateSummary).knownWarnings || ["既有 secret scan WARN 仅作为已知警告展示"]);
    const blocked = blockedReasons(safe);
    const freezeEvidenceStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    return clone({
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_VERSION,
      summaryMode:safeMode(safe.summaryMode),
      freezeEvidenceStatus:freezeEvidenceStatus,
      status:freezeEvidenceStatus,
      frozenScopeEvidence:"只读 QA 范围 / 冻结证据仅为只读摘要，不修改配置",
      lockedCapabilityEvidence:"不执行真实 freeze / 不启用 provider / 不付款 / 不下单 / 不发布",
      allowedActionEvidence:"continue_testing / manual_review_required / blocked",
      blockedActionEvidence:"enable_provider / enable_payment / enable_order / auto_publish / ready_to_publish",
      readinessEvidence:text(obj(publicBetaFreezeReviewViewModelSummary.userFacingSummary).resultLabel || "Public Beta Freeze Review View Model 仍需复核"),
      knownWarnings:warnings,
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaQaFreezeGateSummary:publicBetaQaFreezeGateSummary,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary,
      publicBetaFreezeReviewViewModelSummary:publicBetaFreezeReviewViewModelSummary,
      publicBetaTrialEvidenceLedgerSummary:publicBetaTrialEvidenceLedgerSummary,
      userFacingSummary:{
        title:"Public Beta Freeze Evidence Summary",
        resultLabel:freezeEvidenceStatus === "ready" ? "Public Beta Freeze Evidence Summary 已准备" : (freezeEvidenceStatus === "blocked" ? "Public Beta Freeze Evidence Summary 已阻断" : "Public Beta Freeze Evidence Summary 仍需复核"),
        caveat:"冻结证据仅为只读摘要，不修改配置。"
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

  function buildGlobalShoppingPublicBetaFreezeEvidenceRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary(input || {});
    return clone([
      row("public_beta_freeze_evidence_summary", "Public Beta Freeze Evidence Summary", safe.userFacingSummary.resultLabel, safe.freezeEvidenceStatus === "ready" ? "pass" : (safe.freezeEvidenceStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_freeze_evidence_scope", "Freeze Evidence", safe.frozenScopeEvidence, "warning"),
      row("public_beta_freeze_evidence_allowed", "Allowed Action Evidence", safe.allowedActionEvidence, safe.freezeEvidenceStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_freeze_evidence_blocked", "Blocked Action Evidence", safe.blockedActionEvidence, "warning"),
      row("public_beta_freeze_evidence_readiness", "Readiness Evidence", safe.readinessEvidence, safe.freezeEvidenceStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_freeze_evidence_manual", "Manual Review Required", "仍需人工复核后再决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaFreezeEvidenceSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary(input || {});
    return clone([
      { sectionId:"public_beta_freeze_evidence_summary", label:"Public Beta Freeze Evidence Summary", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"public_beta_freeze_evidence_scope", label:"Freeze Evidence", value:safe.frozenScopeEvidence, redacted:true },
      { sectionId:"public_beta_freeze_evidence_manual", label:"Manual Review Required", value:"仍需人工复核后再决定下一阶段", redacted:true }
    ]);
  }

  function buildGlobalShoppingPublicBetaFreezeEvidenceSummaryAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_AUDIT_DRAFT",
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_VERSION,
      freezeEvidenceStatus:safe.freezeEvidenceStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaFreezeEvidenceSummary(summary) {
    const safe = evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary(summary || {});
    safe.rows = buildGlobalShoppingPublicBetaFreezeEvidenceRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaFreezeEvidenceSections(safe);
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
    return safe;
  }

  function buildGlobalShoppingPublicBetaFreezeEvidenceSummary(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFreezeEvidenceSummary(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFreezeEvidenceSummary({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFreezeEvidenceSummary = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_EVIDENCE_SUMMARY_VERSION,
    SUMMARY_NAME,
    buildGlobalShoppingPublicBetaFreezeEvidenceSummary,
    evaluateGlobalShoppingPublicBetaFreezeEvidenceSummary,
    buildGlobalShoppingPublicBetaFreezeEvidenceRows,
    buildGlobalShoppingPublicBetaFreezeEvidenceSections,
    buildGlobalShoppingPublicBetaFreezeEvidenceSummaryAuditDraft,
    sanitizeGlobalShoppingPublicBetaFreezeEvidenceSummary
  };
})();
