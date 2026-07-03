;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_VERSION = "4.1.6";
  const AUDIT_NAME = "global_shopping_public_beta_stability_audit_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, stability_audit_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_WARNING_RE = /(token|password|credential|auth|secret|api[\s_-]*key|private[\s_-]*key)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeMode(value) {
    const mode = text(value || "stability_audit_only");
    return ALLOWED_MODES[mode] ? mode : "stability_audit_only";
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required|pass|warn|warning)$/.test(status) ? status : "needs_review";
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
  function summaryStatus(summary) {
    const safe = obj(summary);
    return safeStatus(safe.status || safe.rcStatus || "");
  }
  function blockedByCapability(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw provider persistence");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.email === true || safe.sendMail === true) blocked.push("mail");
    ["status", "summary", "copy", "title", "subtitle"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function sanitizeWarnings(value) {
    return toArray(value).map(function (item) { return text(item); }).filter(Boolean).filter(function (item) {
      return !/token[:=]|secret[:=]|api[_ -]?key[:=]|password[:=]/i.test(item);
    });
  }
  function warningHasNewSecretLeak(warnings) {
    return warnings.some(function (item) {
      return SECRET_WARNING_RE.test(item) && !/existing secret scan warn|既有 secret scan warn/i.test(item);
    });
  }
  function normalizeOutcome(value, fallback) {
    const outcome = safeStatus(value || fallback);
    if (outcome === "pass" || outcome === "manual_review_required") return "ready";
    if (outcome === "warn" || outcome === "warning") return "needs_review";
    return outcome;
  }

  function evaluateGlobalShoppingPublicBetaStabilityAudit(input) {
    const safe = obj(input);
    const hasRcConsoleSummary = present(safe.publicBetaRcConsoleSummary);
    const hasOfflineGateSummary = present(safe.offlineTrialReleaseGateSummary);
    const hasVisualQaSummary = present(safe.publicBetaVisualQaConsoleSummary);
    const hasNoTransactionSummary = present(safe.noTransactionRegressionGuardSummary);
    const hasSmokeSummary = present(safe.commerceAgentSmokeSummary);
    const publicBetaRcConsoleSummary = resolveSummary(safe, "publicBetaRcConsoleSummary", "WeishanGlobalShoppingPublicBetaRcConsole", "buildGlobalShoppingPublicBetaRcConsole");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const publicBetaVisualQaConsoleSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const smokeSummary = hasSmokeSummary ? obj(safe.commerceAgentSmokeSummary) : {};
    const validationStatus = normalizeOutcome(safe.validationStatus || safe.validationSummaryStatus, "needs_review");
    const e2eStatus = normalizeOutcome(safe.e2eStatus || smokeSummary.status || "needs_review");
    const buildStatus = normalizeOutcome(safe.buildStatus, "needs_review");
    const appLaunchStatus = normalizeOutcome(safe.appLaunchStatus, "needs_review");
    const knownWarnings = sanitizeWarnings(safe.knownWarnings);
    const blockedCapabilities = blockedByCapability(safe);
    const upstreamBlocked = [
      publicBetaRcConsoleSummary,
      offlineTrialReleaseGateSummary,
      publicBetaVisualQaConsoleSummary,
      noTransactionRegressionGuardSummary
    ].some(function (summary) { return summaryStatus(summary) === "blocked" || summaryStatus(summary) === "failed_safe"; });
    const missingRequired = !hasRcConsoleSummary || !hasOfflineGateSummary || !hasVisualQaSummary || !hasNoTransactionSummary || !hasSmokeSummary;
    const hasNeedsReviewUpstream = [
      publicBetaRcConsoleSummary,
      offlineTrialReleaseGateSummary,
      publicBetaVisualQaConsoleSummary,
      noTransactionRegressionGuardSummary
    ].some(function (summary) { return summaryStatus(summary) === "needs_review"; });
    const smokePassedCount = Number.isFinite(Number(safe.smokePassedCount)) ? Number(safe.smokePassedCount) : Number(smokeSummary.passedCount || 0);
    const smokeTotalCount = Number.isFinite(Number(safe.smokeTotalCount)) ? Number(safe.smokeTotalCount) : Number(smokeSummary.totalCount || 0);
    const warningHasLeak = warningHasNewSecretLeak(knownWarnings);
    const status = blockedCapabilities.length || upstreamBlocked || warningHasLeak || BLOCKED_TEXT_RE.test(text(safe.validationStatusLabel || ""))
      ? "blocked"
      : (missingRequired || hasNeedsReviewUpstream || [validationStatus, e2eStatus, buildStatus, appLaunchStatus].some(function (value) { return value !== "ready"; }) ? "needs_review" : "ready");
    const lockedCapabilities = [
      "no provider",
      "no network",
      "no API key read",
      "no endpoint generation",
      "no release",
      "no push",
      "no transaction",
      "no external open"
    ];

    return clone({
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_VERSION,
      auditMode:safeMode(safe.auditMode),
      status,
      title:"Public Beta Stability Audit",
      validationStatus:status === "blocked" ? "blocked" : validationStatus,
      e2eStatus:status === "blocked" ? "blocked" : e2eStatus,
      buildStatus:status === "blocked" ? "blocked" : buildStatus,
      appLaunchStatus:status === "blocked" ? "blocked" : appLaunchStatus,
      smokePassedCount:smokePassedCount,
      smokeTotalCount:smokeTotalCount,
      knownWarnings:knownWarnings,
      lockedCapabilities:lockedCapabilities.concat(blockedCapabilities).filter(function (value, index, array) { return array.indexOf(value) === index; }),
      blockedCapabilities:blockedCapabilities,
      manualReviewRequired:true,
      publicBetaRcConsoleSummary:publicBetaRcConsoleSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      publicBetaVisualQaConsoleSummary:publicBetaVisualQaConsoleSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      commerceAgentSmokeSummary:smokeSummary,
      userFacingSummary:{
        title:"Public Beta Stability Audit",
        resultLabel:status === "ready" ? "Public Beta Stability Audit 已准备" : (status === "blocked" ? "Public Beta Stability Audit 已阻断" : "Public Beta Stability Audit 仍需复核"),
        caveat:"当前仍为只读 Public Beta 候选；既有 secret scan WARN 仅作为已知警告展示。"
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

  function buildGlobalShoppingPublicBetaStabilityRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaStabilityAudit(input || {});
    return clone([
      row("public_beta_stability_status", "Public Beta Stability Audit", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_stability_validation", "Validation Status", safe.validationStatus, safe.validationStatus === "ready" ? "pass" : (safe.validationStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_stability_e2e", "E2E Status", safe.e2eStatus + (safe.smokeTotalCount ? " (" + safe.smokePassedCount + "/" + safe.smokeTotalCount + ")" : ""), safe.e2eStatus === "ready" ? "pass" : (safe.e2eStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_stability_build", "Build Status", safe.buildStatus, safe.buildStatus === "ready" ? "pass" : (safe.buildStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_stability_launch", "App Launch Status", safe.appLaunchStatus, safe.appLaunchStatus === "ready" ? "pass" : (safe.appLaunchStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_stability_warning", "Known Warnings", safe.knownWarnings.length ? safe.knownWarnings.join(" / ") : "无新增警告", safe.knownWarnings.length ? "warning" : "pass"),
      row("public_beta_stability_manual_review", "Manual Review Required", "当前仍为只读 Public Beta 候选", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaStabilitySections(input) {
    const safe = evaluateGlobalShoppingPublicBetaStabilityAudit(input || {});
    return clone([
      section("public_beta_stability_title", "Public Beta Stability Audit", safe.userFacingSummary.resultLabel),
      section("public_beta_stability_boundary", "Locked Capabilities", "不自动发布、不接 provider、不启用交易"),
      section("public_beta_stability_warning", "Known Warnings", safe.knownWarnings.length ? safe.knownWarnings.join(" / ") : "既有 secret scan WARN 仅作为已知警告展示")
    ]);
  }

  function buildGlobalShoppingPublicBetaStabilityAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaStabilityAudit(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_DRAFT",
      auditName:AUDIT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_VERSION,
      status:safe.status,
      validationStatus:safe.validationStatus,
      e2eStatus:safe.e2eStatus,
      buildStatus:safe.buildStatus,
      appLaunchStatus:safe.appLaunchStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaStabilityAudit(audit) {
    const safe = evaluateGlobalShoppingPublicBetaStabilityAudit(audit || {});
    safe.rows = buildGlobalShoppingPublicBetaStabilityRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaStabilitySections(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaStabilityAudit(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaStabilityAudit(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaStabilityAudit({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaStabilityAudit = {
    GLOBAL_SHOPPING_PUBLIC_BETA_STABILITY_AUDIT_VERSION,
    AUDIT_NAME,
    buildGlobalShoppingPublicBetaStabilityAudit,
    evaluateGlobalShoppingPublicBetaStabilityAudit,
    buildGlobalShoppingPublicBetaStabilityRows,
    buildGlobalShoppingPublicBetaStabilitySections,
    buildGlobalShoppingPublicBetaStabilityAuditDraft,
    sanitizeGlobalShoppingPublicBetaStabilityAudit
  };
})();
