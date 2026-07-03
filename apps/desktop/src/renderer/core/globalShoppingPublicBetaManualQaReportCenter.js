;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_VERSION = "4.1.3";
  const CENTER_NAME = "global_shopping_public_beta_manual_qa_report_center_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_qa_report_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeMode(value) {
    const mode = text(value || "manual_qa_report_only");
    return ALLOWED_MODES[mode] ? mode : "manual_qa_report_only";
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe|pass|warn|warning|manual_review_required)$/.test(status) ? status : "needs_review";
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
  function normalizeStatus(value, fallback) {
    const status = safeStatus(value || fallback);
    if (status === "pass" || status === "manual_review_required") return "ready";
    if (status === "warn" || status === "warning") return "needs_review";
    return status;
  }
  function sanitizeWarnings(value) {
    return toArray(value).map(function (item) { return text(item); }).filter(Boolean).filter(function (item) {
      return !SECRET_VALUE_RE.test(item);
    });
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.reportFile === true || safe.reportSaved === true || safe.writeFile === true || safe.fileWrite === true || safe.snapshotSaved === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.email === true || safe.sendMail === true) blocked.push("mail");
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
    ["status", "summary", "title", "subtitle", "validationSummary", "e2eSummary", "buildSummary", "appLaunchSummary"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaManualQaReportCenter(input) {
    const safe = obj(input);
    const stabilitySummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const handoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const handoffViewModelSummary = resolveSummary(safe, "manualLaunchHandoffViewModelSummary", "WeishanGlobalShoppingManualLaunchHandoffViewModel", "buildGlobalShoppingManualLaunchHandoffViewModel");
    const rcConsoleSummary = resolveSummary(safe, "publicBetaRcConsoleSummary", "WeishanGlobalShoppingPublicBetaRcConsole", "buildGlobalShoppingPublicBetaRcConsole");
    const offlineGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const warnings = sanitizeWarnings(safe.knownWarnings);
    const blocked = blockedReasons(safe);
    const missingRequired = [stabilitySummary, handoffPackSummary, handoffViewModelSummary, rcConsoleSummary, offlineGateSummary].some(function (summary) {
      return !present(summary);
    });
    const upstreamStatuses = [stabilitySummary, handoffPackSummary, handoffViewModelSummary, rcConsoleSummary, offlineGateSummary].map(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).rcStatus || "", "needs_review");
    });
    const upstreamBlocked = upstreamStatuses.some(function (status) { return status === "blocked" || status === "failed_safe"; });
    const upstreamNeedsReview = upstreamStatuses.some(function (status) { return status !== "ready"; });
    const warningLeak = warnings.some(function (item) { return /token|secret|api[_ -]?key|password/i.test(item) && !/existing secret scan warn|既有 secret scan warn/i.test(item); });
    const validationSummary = text(safe.validationSummary || (missingRequired ? "上游 QA/交接摘要仍待补齐" : "人工 QA 结果待确认"));
    const e2eSummary = text(safe.e2eSummary || "E2E smoke 结果待人工确认");
    const buildSummary = text(safe.buildSummary || "Build 结果待人工确认");
    const appLaunchSummary = text(safe.appLaunchSummary || "App 启动结果待人工确认");
    const status = blocked.length || upstreamBlocked || warningLeak
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_VERSION,
      centerMode:safeMode(safe.centerMode),
      status,
      qaReportStatus:status,
      title:"Public Beta Manual QA Report Center",
      validationSummary:validationSummary,
      e2eSummary:e2eSummary,
      buildSummary:buildSummary,
      appLaunchSummary:appLaunchSummary,
      knownWarnings:warnings,
      lockedCapabilities:[
        "no report export",
        "no snapshot file",
        "no feedback upload",
        "no provider",
        "no network",
        "no transaction",
        "no push"
      ].concat(blocked).filter(function (value, index, array) { return array.indexOf(value) === index; }),
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaStabilityAuditSummary:stabilitySummary,
      manualLaunchHandoffPackSummary:handoffPackSummary,
      manualLaunchHandoffViewModelSummary:handoffViewModelSummary,
      publicBetaRcConsoleSummary:rcConsoleSummary,
      offlineTrialReleaseGateSummary:offlineGateSummary,
      userFacingSummary:{
        title:"Public Beta Manual QA Report Center",
        resultLabel:status === "ready" ? "Public Beta Manual QA Report Center 已准备" : (status === "blocked" ? "Public Beta Manual QA Report Center 已阻断" : "Public Beta Manual QA Report Center 仍需复核"),
        caveat:"不生成真实报告文件，不导出，不下载，不上传，不发邮件。"
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

  function buildGlobalShoppingPublicBetaManualQaReportRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaManualQaReportCenter(input || {});
    return clone([
      row("public_beta_manual_qa_center", "Public Beta Manual QA Report Center", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_manual_qa_validation", "QA Evidence", safe.validationSummary, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_manual_qa_e2e", "E2E Summary", safe.e2eSummary, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_manual_qa_build", "Build Summary", safe.buildSummary, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_manual_qa_launch", "App Launch Summary", safe.appLaunchSummary, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_manual_qa_warning", "Known Warnings", safe.knownWarnings.length ? safe.knownWarnings.join(" / ") : "无新增警告", safe.knownWarnings.length ? "warning" : "pass"),
      row("public_beta_manual_qa_review", "Manual Review Required", "人工 QA 后再决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaManualQaReportSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaManualQaReportCenter(input || {});
    return clone([
      section("public_beta_manual_qa_evidence", "QA Evidence", safe.validationSummary),
      section("public_beta_manual_qa_locked", "Locked Capabilities", "不写文件、不导出、不下载、不上传"),
      section("public_beta_manual_qa_launch", "App Launch Summary", safe.appLaunchSummary)
    ]);
  }

  function buildGlobalShoppingPublicBetaManualQaReportCenterAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaManualQaReportCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaManualQaReportCenter(center) {
    const safe = evaluateGlobalShoppingPublicBetaManualQaReportCenter(center || {});
    safe.rows = buildGlobalShoppingPublicBetaManualQaReportRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaManualQaReportSections(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaManualQaReportCenter(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaManualQaReportCenter(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaManualQaReportCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaManualQaReportCenter = {
    GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_REPORT_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingPublicBetaManualQaReportCenter,
    evaluateGlobalShoppingPublicBetaManualQaReportCenter,
    buildGlobalShoppingPublicBetaManualQaReportRows,
    buildGlobalShoppingPublicBetaManualQaReportSections,
    buildGlobalShoppingPublicBetaManualQaReportCenterAuditDraft,
    sanitizeGlobalShoppingPublicBetaManualQaReportCenter
  };
})();
