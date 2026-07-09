;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION = "4.2.7";
  const MATRIX_NAME = "global_shopping_offline_launch_blocker_matrix_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_launch_blocker_matrix_only:true };
  const BLOCKED_TEXT_RE = /launch|release|tag|push|enable_provider|enable_payment|enable_order|ready_to_publish|production_ready|auto_release|auto_launch|auto_publish/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, passed) {
    return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "offline_launch_blocker_matrix_only");
    return ALLOWED_MODES[mode] ? mode : "offline_launch_blocker_matrix_only";
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
    if (safe.launch === true || safe.autoLaunch === true) blocked.push("launch");
    if (safe.release === true || safe.createRelease === true || safe.autoRelease === true || safe.autoPublish === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("openExternal");
    if (safe.payment === true || safe.enablePayment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.enableOrder === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    ["status", "title", "summary", "subtitle", "blockerMatrixStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe launch language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineLaunchBlockerMatrix(input) {
    const safe = obj(input);
    const finalReadinessSummary = resolveSummary(safe, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const publicBetaQaFreezeGateSummary = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const missingRequired = [finalReadinessSummary, noLaunchAssuranceGateSummary, offlineTrialReleaseGateSummary, noTransactionRegressionGuardSummary, publicBetaQaFreezeGateSummary].some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(finalReadinessSummary).finalReadinessStatus || obj(finalReadinessSummary).status, "needs_review"),
      normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review"),
      normalizeStatus(obj(offlineTrialReleaseGateSummary).status, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaQaFreezeGateSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const blockerMatrixStatus = blocked.length
      ? "blocked"
      : (missingRequired || statuses.some(function (status) { return status === "blocked" || status === "needs_review"; }) ? "blocked" : "blocked");

    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION,
      matrixMode:safeMode(safe.matrixMode),
      blockerMatrixStatus:blockerMatrixStatus,
      status:blockerMatrixStatus,
      launchBlocked:true,
      releaseBlocked:true,
      providerBlocked:true,
      networkBlocked:true,
      externalOpenBlocked:true,
      transactionBlocked:true,
      paymentBlocked:true,
      orderBlocked:true,
      ticketingBlocked:true,
      requiredManualChecks:[
        "确认发布、provider、联网、付款、下单、出票全部保持阻断",
        "确认不创建 release、不 push、不修改 runtime",
        "确认仅允许继续测试、优化文案、扩展离线场景或人工复核"
      ],
      manualReviewRequired:true,
      publicBetaFinalReadinessCommandCenterSummary:finalReadinessSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      publicBetaQaFreezeGateSummary:publicBetaQaFreezeGateSummary,
      blockedCapabilities:blocked,
      userFacingSummary:{
        title:"Offline Launch Blocker Matrix",
        resultLabel:"Offline Launch Blocker Matrix 已保持阻断",
        caveat:"发布、provider、联网、付款、下单、出票全部保持阻断。"
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

  function buildGlobalShoppingOfflineLaunchBlockerRows(input) {
    const safe = evaluateGlobalShoppingOfflineLaunchBlockerMatrix(input || {});
    return clone([
      row("offline_launch_blocker_matrix", "Offline Launch Blocker Matrix", safe.userFacingSummary.resultLabel, "blocked"),
      row("offline_launch_blocker_launch", "Launch Blockers", "发布、provider、联网、付款、下单、出票全部保持阻断", "blocked"),
      row("offline_launch_blocker_release", "Release Blocked", String(safe.releaseBlocked), "blocked"),
      row("offline_launch_blocker_provider", "Provider Blocked", String(safe.providerBlocked), "blocked"),
      row("offline_launch_blocker_transaction", "Transaction Blocked", String(safe.transactionBlocked), "blocked")
    ]);
  }

  function buildGlobalShoppingOfflineLaunchBlockerRules(input) {
    const safe = evaluateGlobalShoppingOfflineLaunchBlockerMatrix(input || {});
    return clone([
      rule("launch_blocked", "launchBlocked 必须 true", safe.launchBlocked === true),
      rule("release_blocked", "releaseBlocked 必须 true", safe.releaseBlocked === true),
      rule("provider_blocked", "providerBlocked 必须 true", safe.providerBlocked === true),
      rule("network_blocked", "networkBlocked 必须 true", safe.networkBlocked === true),
      rule("external_blocked", "externalOpenBlocked 必须 true", safe.externalOpenBlocked === true),
      rule("transaction_blocked", "transactionBlocked 必须 true", safe.transactionBlocked === true),
      rule("payment_blocked", "paymentBlocked 必须 true", safe.paymentBlocked === true),
      rule("order_blocked", "orderBlocked 必须 true", safe.orderBlocked === true),
      rule("ticketing_blocked", "ticketingBlocked 必须 true", safe.ticketingBlocked === true)
    ]);
  }

  function buildGlobalShoppingOfflineLaunchBlockerMatrixAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineLaunchBlockerMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION,
      blockerMatrixStatus:safe.blockerMatrixStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineLaunchBlockerMatrix(matrix) {
    const safe = evaluateGlobalShoppingOfflineLaunchBlockerMatrix(matrix || {});
    safe.rows = buildGlobalShoppingOfflineLaunchBlockerRows(safe);
    safe.rules = buildGlobalShoppingOfflineLaunchBlockerRules(safe);
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

  function buildGlobalShoppingOfflineLaunchBlockerMatrix(input) {
    try {
      return sanitizeGlobalShoppingOfflineLaunchBlockerMatrix(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineLaunchBlockerMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineLaunchBlockerMatrix = {
    GLOBAL_SHOPPING_OFFLINE_LAUNCH_BLOCKER_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingOfflineLaunchBlockerMatrix,
    evaluateGlobalShoppingOfflineLaunchBlockerMatrix,
    buildGlobalShoppingOfflineLaunchBlockerRows,
    buildGlobalShoppingOfflineLaunchBlockerRules,
    buildGlobalShoppingOfflineLaunchBlockerMatrixAuditDraft,
    sanitizeGlobalShoppingOfflineLaunchBlockerMatrix
  };
})();
