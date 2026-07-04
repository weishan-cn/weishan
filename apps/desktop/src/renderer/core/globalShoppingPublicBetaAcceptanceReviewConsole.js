;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_VERSION = "4.2.1";
  const CONSOLE_NAME = "global_shopping_public_beta_acceptance_review_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, acceptance_review_console_only:true };
  const ALLOWED_ACTIONS = ["continue_testing", "manual_review_required", "blocked"];
  const BLOCKED_NEXT_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "ready_to_publish", "production_ready"];
  const BLOCKED_TEXT_RE = /ready_to_publish|production_ready|auto_release|auto_launch|auto_publish|enable_provider|enable_payment|enable_order/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function safeMode(value) {
    const mode = text(value || "acceptance_review_console_only");
    return ALLOWED_MODES[mode] ? mode : "acceptance_review_console_only";
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
    if (safe.release === true || safe.createRelease === true || safe.autoRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true || safe.rawUserTextPersistence === true) blocked.push("raw persistence");
    ["status", "title", "summary", "subtitle", "acceptanceReviewStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole(input) {
    const safe = obj(input);
    const freezeEvidenceSummary = resolveSummary(safe, "publicBetaFreezeEvidenceSummary", "WeishanGlobalShoppingPublicBetaFreezeEvidenceSummary", "buildGlobalShoppingPublicBetaFreezeEvidenceSummary");
    const issueReviewSummary = resolveSummary(safe, "manualTrialIssueReviewBoardSummary", "WeishanGlobalShoppingManualTrialIssueReviewBoard", "buildGlobalShoppingManualTrialIssueReviewBoard");
    const acceptanceSnapshotSummary = resolveSummary(safe, "offlineAcceptanceSnapshotSummary", "WeishanGlobalShoppingOfflineAcceptanceSnapshot", "buildGlobalShoppingOfflineAcceptanceSnapshot");
    const acceptanceSnapshotViewModelSummary = resolveSummary(safe, "publicBetaAcceptanceSnapshotViewModelSummary", "WeishanGlobalShoppingPublicBetaAcceptanceSnapshotViewModel", "buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel");
    const qaFreezeGateSummary = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const summaries = [freezeEvidenceSummary, issueReviewSummary, acceptanceSnapshotSummary, acceptanceSnapshotViewModelSummary, qaFreezeGateSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const freezeEvidenceStatus = normalizeStatus(obj(freezeEvidenceSummary).freezeEvidenceStatus || obj(freezeEvidenceSummary).status, "needs_review");
    const issueReviewStatus = normalizeStatus(obj(issueReviewSummary).issueReviewStatus || obj(issueReviewSummary).status, "needs_review");
    const acceptanceSnapshotStatus = normalizeStatus(obj(acceptanceSnapshotSummary).acceptanceSnapshotStatus || obj(acceptanceSnapshotSummary).status, "needs_review");
    const acceptanceSnapshotViewModelStatus = normalizeStatus(obj(acceptanceSnapshotViewModelSummary).status, "needs_review");
    const qaFreezeGateStatus = normalizeStatus(obj(qaFreezeGateSummary).freezeStatus || obj(qaFreezeGateSummary).status, "needs_review");
    const blocked = blockedReasons(safe);
    const upstreamStatuses = [freezeEvidenceStatus, issueReviewStatus, acceptanceSnapshotStatus, acceptanceSnapshotViewModelStatus, qaFreezeGateStatus];
    const upstreamBlocked = upstreamStatuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = upstreamStatuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const acceptanceReviewStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const allowedNextActions = acceptanceReviewStatus === "blocked" ? ["blocked"] : unique(["continue_testing", "manual_review_required"]);

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      acceptanceReviewStatus:acceptanceReviewStatus,
      status:acceptanceReviewStatus,
      freezeEvidenceStatus:freezeEvidenceStatus,
      issueReviewStatus:issueReviewStatus,
      acceptanceSnapshotStatus:acceptanceSnapshotStatus,
      qaFreezeGateStatus:qaFreezeGateStatus,
      blockedCapabilities:blocked,
      allowedNextActions:allowedNextActions,
      blockedNextActions:BLOCKED_NEXT_ACTIONS.slice(),
      manualReviewRequired:true,
      publicBetaFreezeEvidenceSummary:freezeEvidenceSummary,
      manualTrialIssueReviewBoardSummary:issueReviewSummary,
      offlineAcceptanceSnapshotSummary:acceptanceSnapshotSummary,
      publicBetaAcceptanceSnapshotViewModelSummary:acceptanceSnapshotViewModelSummary,
      publicBetaQaFreezeGateSummary:qaFreezeGateSummary,
      userFacingSummary:{
        title:"Public Beta Acceptance Review Console",
        resultLabel:acceptanceReviewStatus === "blocked" ? "Public Beta Acceptance Review Console 已阻断" : (acceptanceReviewStatus === "needs_review" ? "Public Beta Acceptance Review Console 仍需复核" : "Public Beta Acceptance Review Console 需人工复核"),
        caveat:"当前不发布、不创建 release、不 push。"
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

  function buildGlobalShoppingPublicBetaAcceptanceReviewRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole(input || {});
    return clone([
      row("public_beta_acceptance_review_console", "Public Beta Acceptance Review Console", safe.userFacingSummary.resultLabel, safe.acceptanceReviewStatus === "blocked" ? "blocked" : (safe.acceptanceReviewStatus === "manual_review_required" ? "pass" : "warning")),
      row("public_beta_acceptance_review_freeze", "Acceptance Review", text(obj(safe.publicBetaFreezeEvidenceSummary.userFacingSummary).resultLabel || "Public Beta Freeze Evidence Summary 仍需复核"), safe.freezeEvidenceStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_review_issue", "Trial Closure", text(obj(safe.manualTrialIssueReviewBoardSummary.userFacingSummary).resultLabel || "Manual Trial Issue Review Board 仍需复核"), safe.issueReviewStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_review_no_launch", "No Launch", "当前不发布、不创建 release、不 push", safe.acceptanceReviewStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_review_allowed", "Allowed Next Actions", safe.allowedNextActions.join(" / "), safe.acceptanceReviewStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_review_blocked", "Blocked Next Actions", safe.blockedNextActions.join(" / "), "warning"),
      row("public_beta_acceptance_review_manual", "Manual Review Required", "验收复核后仍需人工决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaAcceptanceReviewSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole(input || {});
    return clone([
      section("public_beta_acceptance_review_console", "Public Beta Acceptance Review Console", safe.userFacingSummary.resultLabel),
      section("public_beta_acceptance_review_scope", "Acceptance Review", "当前不发布、不创建 release、不 push"),
      section("public_beta_acceptance_review_manual", "Manual Review Required", "验收复核后仍需人工决定下一阶段")
    ]);
  }

  function buildGlobalShoppingPublicBetaAcceptanceReviewConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_VERSION,
      acceptanceReviewStatus:safe.acceptanceReviewStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaAcceptanceReviewConsole(consoleModel) {
    const safe = evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole(consoleModel || {});
    safe.rows = buildGlobalShoppingPublicBetaAcceptanceReviewRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaAcceptanceReviewSections(safe);
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

  function buildGlobalShoppingPublicBetaAcceptanceReviewConsole(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaAcceptanceReviewConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaAcceptanceReviewConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole = {
    GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicBetaAcceptanceReviewConsole,
    evaluateGlobalShoppingPublicBetaAcceptanceReviewConsole,
    buildGlobalShoppingPublicBetaAcceptanceReviewRows,
    buildGlobalShoppingPublicBetaAcceptanceReviewSections,
    buildGlobalShoppingPublicBetaAcceptanceReviewConsoleAuditDraft,
    sanitizeGlobalShoppingPublicBetaAcceptanceReviewConsole
  };
})();
