;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION = "4.2.8";
  const ARCHIVE_NAME = "global_shopping_public_beta_closure_evidence_archive_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, closure_evidence_archive_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "closure_evidence_archive_only");
    return ALLOWED_MODES[mode] ? mode : "closure_evidence_archive_only";
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
    if (safe.archivePersistence === true || safe.persistArchive === true || safe.archiveWrite === true) blocked.push("archive persistence");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true || safe.reportExport === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    ["status", "title", "summary", "subtitle", "archiveStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaClosureEvidenceArchive(input) {
    const safe = obj(input);
    const acceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const offlineTrialClosureBoardSummary = resolveSummary(safe, "offlineTrialClosureBoardSummary", "WeishanGlobalShoppingOfflineTrialClosureBoard", "buildGlobalShoppingOfflineTrialClosureBoard");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const publicBetaClosureReviewViewModelSummary = resolveSummary(safe, "publicBetaClosureReviewViewModelSummary", "WeishanGlobalShoppingPublicBetaClosureReviewViewModel", "buildGlobalShoppingPublicBetaClosureReviewViewModel");
    const offlineAcceptanceSnapshotSummary = resolveSummary(safe, "offlineAcceptanceSnapshotSummary", "WeishanGlobalShoppingOfflineAcceptanceSnapshot", "buildGlobalShoppingOfflineAcceptanceSnapshot");
    const summaries = [
      acceptanceReviewConsoleSummary,
      offlineTrialClosureBoardSummary,
      noLaunchAssuranceGateSummary,
      publicBetaClosureReviewViewModelSummary,
      offlineAcceptanceSnapshotSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const acceptanceStatus = normalizeStatus(obj(acceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(acceptanceReviewConsoleSummary).status, "needs_review");
    const closureStatus = normalizeStatus(obj(offlineTrialClosureBoardSummary).closureStatus || obj(offlineTrialClosureBoardSummary).status, "needs_review");
    const noLaunchStatus = normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review");
    const closureViewStatus = normalizeStatus(obj(publicBetaClosureReviewViewModelSummary).status, "needs_review");
    const acceptanceSnapshotStatus = normalizeStatus(obj(offlineAcceptanceSnapshotSummary).acceptanceSnapshotStatus || obj(offlineAcceptanceSnapshotSummary).status, "needs_review");
    const statuses = [acceptanceStatus, closureStatus, noLaunchStatus, closureViewStatus, acceptanceSnapshotStatus];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const archiveStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique(
      toArray(safe.knownWarnings)
        .concat(toArray(obj(offlineAcceptanceSnapshotSummary).knownWarnings))
        .filter(function (item) { return /secret scan WARN/i.test(text(item)); })
    );

    return clone({
      archiveName:ARCHIVE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION,
      archiveMode:safeMode(safe.archiveMode),
      archiveStatus:archiveStatus,
      status:archiveStatus,
      acceptanceEvidence:text(obj(acceptanceReviewConsoleSummary.userFacingSummary).resultLabel || "Public Beta Acceptance Review Console 仍需复核"),
      closureEvidence:text(obj(offlineTrialClosureBoardSummary.userFacingSummary).resultLabel || "Offline Trial Closure Board 仍需复核"),
      noLaunchEvidence:text(obj(noLaunchAssuranceGateSummary.userFacingSummary).resultLabel || "No-Launch Assurance Gate 仍需复核"),
      noTransactionEvidence:"仍不允许启用 provider、付款、下单或发布",
      knownWarnings:knownWarnings,
      lockedCapabilities:[
        "不写文件、不保存、不导出",
        "不下载、不上传、不发邮件",
        "不创建 release、不 push",
        "不接 provider、不联网、不付款、不下单、不出票"
      ],
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaAcceptanceReviewConsoleSummary:acceptanceReviewConsoleSummary,
      offlineTrialClosureBoardSummary:offlineTrialClosureBoardSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      publicBetaClosureReviewViewModelSummary:publicBetaClosureReviewViewModelSummary,
      offlineAcceptanceSnapshotSummary:offlineAcceptanceSnapshotSummary,
      userFacingSummary:{
        title:"Public Beta Closure Evidence Archive",
        resultLabel:archiveStatus === "blocked" ? "Public Beta Closure Evidence Archive 已阻断" : (archiveStatus === "needs_review" ? "Public Beta Closure Evidence Archive 仍需复核" : "Public Beta Closure Evidence Archive 需人工复核"),
        caveat:"闭环证据仅为只读归档视图，不写文件。"
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

  function buildGlobalShoppingPublicBetaClosureEvidenceArchiveRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaClosureEvidenceArchive(input || {});
    return clone([
      row("public_beta_closure_evidence_archive", "Public Beta Closure Evidence Archive", safe.userFacingSummary.resultLabel, safe.archiveStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_closure_evidence", "Closure Evidence", safe.closureEvidence, safe.archiveStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_evidence", "Acceptance Evidence", safe.acceptanceEvidence, safe.archiveStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_no_launch_evidence", "No-Launch Evidence", safe.noLaunchEvidence, safe.archiveStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_no_transaction_evidence", "No-Transaction Evidence", safe.noTransactionEvidence, safe.archiveStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_archive_manual", "Manual Review Required", "闭环证据仅为只读归档视图，不写文件", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaClosureEvidenceArchiveSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaClosureEvidenceArchive(input || {});
    return clone([
      section("public_beta_closure_evidence_archive", "Public Beta Closure Evidence Archive", safe.userFacingSummary.resultLabel),
      section("public_beta_closure_evidence_archive_scope", "Closure Evidence", "闭环证据仅为只读归档视图，不写文件"),
      section("public_beta_closure_evidence_archive_manual", "Manual Review Required", "仍需人工复核后再决定下一阶段")
    ]);
  }

  function buildGlobalShoppingPublicBetaClosureEvidenceArchiveAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaClosureEvidenceArchive(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_AUDIT_DRAFT",
      archiveName:ARCHIVE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION,
      archiveStatus:safe.archiveStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaClosureEvidenceArchive(archive) {
    const safe = evaluateGlobalShoppingPublicBetaClosureEvidenceArchive(archive || {});
    safe.rows = buildGlobalShoppingPublicBetaClosureEvidenceArchiveRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaClosureEvidenceArchiveSections(safe);
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

  function buildGlobalShoppingPublicBetaClosureEvidenceArchive(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaClosureEvidenceArchive(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaClosureEvidenceArchive({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaClosureEvidenceArchive = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION,
    ARCHIVE_NAME,
    buildGlobalShoppingPublicBetaClosureEvidenceArchive,
    evaluateGlobalShoppingPublicBetaClosureEvidenceArchive,
    buildGlobalShoppingPublicBetaClosureEvidenceArchiveRows,
    buildGlobalShoppingPublicBetaClosureEvidenceArchiveSections,
    buildGlobalShoppingPublicBetaClosureEvidenceArchiveAuditDraft,
    sanitizeGlobalShoppingPublicBetaClosureEvidenceArchive
  };
})();
