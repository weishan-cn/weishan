;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION = "4.2.0";
  const BOUNDARY_NAME = "global_shopping_no_provider_production_boundary_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, no_provider_production_boundary_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_release|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;
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
    const mode = text(value || "no_provider_production_boundary_only");
    return ALLOWED_MODES[mode] ? mode : "no_provider_production_boundary_only";
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
    if (safe.productionProvider === true || safe.provider === true || safe.realProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.launch === true || safe.autoLaunch === true || safe.releaseLaunch === true) blocked.push("launch");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    ["status", "summary", "title", "subtitle", "boundaryStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingNoProviderProductionBoundary(input) {
    const safe = obj(input);
    const publicBetaCandidateLockSummary = resolveSummary(safe, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [
      publicBetaCandidateLockSummary,
      offlineLaunchBlockerMatrixSummary,
      noLaunchAssuranceGateSummary,
      offlineTrialReleaseGateSummary,
      noTransactionRegressionGuardSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateLockSummary).candidateLockStatus || obj(publicBetaCandidateLockSummary).status, "needs_review"),
      normalizeStatus(obj(offlineLaunchBlockerMatrixSummary).blockerMatrixStatus || obj(offlineLaunchBlockerMatrixSummary).status, "needs_review"),
      normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review"),
      normalizeStatus(obj(offlineTrialReleaseGateSummary).status, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const noProvider = !(safe.provider === true || safe.realProvider === true || safe.enableProvider === true);
    const noProductionProvider = !(safe.productionProvider === true || safe.productionReady === true);
    const noNetwork = !(safe.network === true || safe.fetch === true || safe.request === true);
    const noExternalOpen = !(safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true || hasTruthyUrl(safe.externalUrl) || hasTruthyUrl(safe.platformUrl) || hasTruthyUrl(safe.providerUrl));
    const noPayment = !(safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true || hasTruthyUrl(safe.paymentUrl));
    const noOrder = !(safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true || hasTruthyUrl(safe.orderUrl) || hasTruthyUrl(safe.bookingUrl) || hasTruthyUrl(safe.checkoutUrl));
    const noTicketing = !(safe.ticketing === true || safe.issueTicket === true);
    const noReleaseMutation = !(safe.release === true || safe.createRelease === true || safe.tag === true || safe.createTag === true || safe.gitMutation === true || safe.gitWrite === true || safe.fileWrite === true || safe.writeFile === true);
    const noPush = !(safe.push === true || safe.pushEnabled === true);
    const boundaryStatus = blocked.length || statuses.some(function (status) { return status === "blocked"; }) || !noProvider || !noProductionProvider || !noNetwork || !noExternalOpen || !noPayment || !noOrder || !noTicketing || !noReleaseMutation || !noPush
      ? "blocked"
      : (missingRequired || statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; }) ? "needs_review" : "manual_review_required");

    return clone({
      boundaryName:BOUNDARY_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION,
      boundaryMode:safeMode(safe.boundaryMode),
      boundaryStatus:boundaryStatus,
      status:boundaryStatus,
      noProvider:noProvider,
      noProductionProvider:noProductionProvider,
      noNetwork:noNetwork,
      noExternalOpen:noExternalOpen,
      noPayment:noPayment,
      noOrder:noOrder,
      noTicketing:noTicketing,
      noReleaseMutation:noReleaseMutation,
      noPush:noPush,
      manualReviewRequired:true,
      publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      userFacingSummary:{
        title:"No-Provider Production Boundary",
        resultLabel:boundaryStatus === "blocked" ? "No-Provider Production Boundary 已阻断" : (boundaryStatus === "needs_review" ? "No-Provider Production Boundary 仍需复核" : "No-Provider Production Boundary 需人工复核"),
        caveat:"当前不是 production provider 版本"
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

  function buildGlobalShoppingNoProviderProductionBoundaryRows(input) {
    const safe = evaluateGlobalShoppingNoProviderProductionBoundary(input || {});
    return clone([
      row("no_provider_production_boundary", "No-Provider Production Boundary", safe.userFacingSummary.resultLabel, safe.boundaryStatus === "blocked" ? "blocked" : "warning"),
      row("no_provider_production_boundary_scope", "Production Boundary", "当前不是 production provider 版本", "warning"),
      row("no_provider_production_boundary_locked", "Locked Capabilities", "provider / network / external_open / payment / order / ticketing / release / push / launch", "warning"),
      row("no_provider_production_boundary_manual", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push 全部保持关闭", "warning")
    ]);
  }

  function buildGlobalShoppingNoProviderProductionBoundaryRules(input) {
    const safe = evaluateGlobalShoppingNoProviderProductionBoundary(input || {});
    return clone([
      rule("no_provider", "No Provider", safe.noProvider),
      rule("no_production_provider", "No Production Provider", safe.noProductionProvider),
      rule("no_network", "No Network", safe.noNetwork),
      rule("no_external_open", "No External Open", safe.noExternalOpen),
      rule("no_payment", "No Payment", safe.noPayment),
      rule("no_order", "No Order", safe.noOrder),
      rule("no_ticketing", "No Ticketing", safe.noTicketing),
      rule("no_release_mutation", "No Release Mutation", safe.noReleaseMutation),
      rule("no_push", "No Push", safe.noPush),
      rule("manual_review_required", "Manual Review Required", true)
    ]);
  }

  function buildGlobalShoppingNoProviderProductionBoundaryAuditDraft(input) {
    const safe = evaluateGlobalShoppingNoProviderProductionBoundary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_AUDIT_DRAFT",
      boundaryName:BOUNDARY_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION,
      boundaryStatus:safe.boundaryStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoProviderProductionBoundary(boundary) {
    const safe = evaluateGlobalShoppingNoProviderProductionBoundary(boundary || {});
    safe.rows = buildGlobalShoppingNoProviderProductionBoundaryRows(safe);
    safe.rules = buildGlobalShoppingNoProviderProductionBoundaryRules(safe);
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

  function buildGlobalShoppingNoProviderProductionBoundary(input) {
    try {
      return sanitizeGlobalShoppingNoProviderProductionBoundary(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingNoProviderProductionBoundary({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoProviderProductionBoundary = {
    GLOBAL_SHOPPING_NO_PROVIDER_PRODUCTION_BOUNDARY_VERSION,
    BOUNDARY_NAME,
    buildGlobalShoppingNoProviderProductionBoundary,
    evaluateGlobalShoppingNoProviderProductionBoundary,
    buildGlobalShoppingNoProviderProductionBoundaryRows,
    buildGlobalShoppingNoProviderProductionBoundaryRules,
    buildGlobalShoppingNoProviderProductionBoundaryAuditDraft,
    sanitizeGlobalShoppingNoProviderProductionBoundary
  };
})();
