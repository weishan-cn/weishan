;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION = "4.2.0";
  const LOCK_NAME = "global_shopping_public_beta_candidate_lock_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, candidate_lock_only:true };
  const ALLOWED_NEXT_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_NEXT_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready"];
  const LOCKED_CAPABILITIES = ["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch"];
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
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "candidate_lock_only");
    return ALLOWED_MODES[mode] ? mode : "candidate_lock_only";
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
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
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
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    ["status", "summary", "title", "subtitle", "candidateLockStatus", "lockedScope"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaCandidateLock(input) {
    const safe = obj(input);
    const publicBetaFinalReadinessCommandCenterSummary = resolveSummary(safe, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const manualNextPhaseDossierSummary = resolveSummary(safe, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    const publicBetaFinalReadinessViewModelSummary = resolveSummary(safe, "publicBetaFinalReadinessViewModelSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessViewModel", "buildGlobalShoppingPublicBetaFinalReadinessViewModel");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const summaries = [
      publicBetaFinalReadinessCommandCenterSummary,
      offlineLaunchBlockerMatrixSummary,
      manualNextPhaseDossierSummary,
      publicBetaFinalReadinessViewModelSummary,
      noLaunchAssuranceGateSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaFinalReadinessCommandCenterSummary).finalReadinessStatus || obj(publicBetaFinalReadinessCommandCenterSummary).status, "needs_review"),
      normalizeStatus(obj(offlineLaunchBlockerMatrixSummary).blockerMatrixStatus || obj(offlineLaunchBlockerMatrixSummary).status, "needs_review"),
      normalizeStatus(obj(manualNextPhaseDossierSummary).dossierStatus || obj(manualNextPhaseDossierSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaFinalReadinessViewModelSummary).status, "needs_review"),
      normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) {
      return status !== "ready" && status !== "manual_review_required";
    });
    const candidateLockStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const allowedNextActions = candidateLockStatus === "blocked"
      ? ["blocked"]
      : ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"];
    const knownWarnings = unique(
      []
        .concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : [])
        .concat(Array.isArray(obj(publicBetaFinalReadinessCommandCenterSummary).knownWarnings) ? obj(publicBetaFinalReadinessCommandCenterSummary).knownWarnings : [])
        .filter(function (item) { return /secret scan WARN/i.test(text(item)); })
    );

    return clone({
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION,
      lockMode:safeMode(safe.lockMode),
      candidateLockStatus:candidateLockStatus,
      status:candidateLockStatus,
      lockedScope:"当前锁定的是只读 Public Beta 候选范围，不修改配置",
      lockedCapabilities:LOCKED_CAPABILITIES.slice(),
      unlockedCapabilities:["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"],
      allowedNextActions:allowedNextActions,
      blockedNextActions:BLOCKED_NEXT_ACTIONS.slice(),
      knownWarnings:knownWarnings,
      blockedCapabilities:unique(blocked.concat(BLOCKED_NEXT_ACTIONS)),
      manualReviewRequired:true,
      publicBetaFinalReadinessCommandCenterSummary:publicBetaFinalReadinessCommandCenterSummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      manualNextPhaseDossierSummary:manualNextPhaseDossierSummary,
      publicBetaFinalReadinessViewModelSummary:publicBetaFinalReadinessViewModelSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      userFacingSummary:{
        title:"Public Beta Candidate Lock",
        resultLabel:candidateLockStatus === "blocked" ? "Public Beta Candidate Lock 已阻断" : (candidateLockStatus === "needs_review" ? "Public Beta Candidate Lock 仍需复核" : "Public Beta Candidate Lock 需人工复核"),
        caveat:"当前锁定的是只读 Public Beta 候选范围，不修改配置"
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

  function buildGlobalShoppingPublicBetaCandidateLockRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateLock(input || {});
    return clone([
      row("public_beta_candidate_lock", "Public Beta Candidate Lock", safe.userFacingSummary.resultLabel, safe.candidateLockStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_candidate_scope", "Candidate Scope", safe.lockedScope, "warning"),
      row("public_beta_candidate_locked", "Locked Capabilities", safe.lockedCapabilities.join(" / "), "warning"),
      row("public_beta_candidate_next_actions", "Allowed Next Actions", safe.allowedNextActions.join(" / "), safe.candidateLockStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_candidate_manual", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push 全部保持关闭", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateLockSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateLock(input || {});
    return clone([
      section("public_beta_candidate_lock", "Public Beta Candidate Lock", safe.userFacingSummary.resultLabel),
      section("public_beta_candidate_scope", "Candidate Scope", safe.lockedScope),
      section("public_beta_candidate_boundary", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push 全部保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateLockAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateLock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_AUDIT_DRAFT",
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION,
      candidateLockStatus:safe.candidateLockStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaCandidateLock(lock) {
    const safe = evaluateGlobalShoppingPublicBetaCandidateLock(lock || {});
    safe.rows = buildGlobalShoppingPublicBetaCandidateLockRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaCandidateLockSections(safe);
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

  function buildGlobalShoppingPublicBetaCandidateLock(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaCandidateLock(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaCandidateLock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaCandidateLock = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_LOCK_VERSION,
    LOCK_NAME,
    buildGlobalShoppingPublicBetaCandidateLock,
    evaluateGlobalShoppingPublicBetaCandidateLock,
    buildGlobalShoppingPublicBetaCandidateLockRows,
    buildGlobalShoppingPublicBetaCandidateLockSections,
    buildGlobalShoppingPublicBetaCandidateLockAuditDraft,
    sanitizeGlobalShoppingPublicBetaCandidateLock
  };
})();
