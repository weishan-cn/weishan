;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_VERSION = "4.1.1";
  const CONSOLE_NAME = "global_shopping_public_beta_rc_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, rc_console_only:true };
  const BLOCKED_STATUS_RE = /ready_to_publish|production_ready|auto_release/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeMode(value) {
    const mode = text(value || "rc_console_only");
    return ALLOWED_MODES[mode] ? mode : "rc_console_only";
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function hasBlockedStatus(summary) {
    const safe = obj(summary);
    const status = safeStatus(safe.status);
    const label = summaryLabel(safe, "");
    return status === "blocked" || status === "failed_safe" || BLOCKED_STATUS_RE.test(status) || BLOCKED_STATUS_RE.test(label);
  }
  function detectBlockedCapabilities(input) {
    const safe = obj(input);
    const blockedCapabilities = [];
    if (safe.release === true || safe.releaseMutation === true || safe.releaseCreated === true || safe.createRelease === true) blockedCapabilities.push("release mutation");
    if (safe.tag === true || safe.tagMutation === true || safe.createTag === true) blockedCapabilities.push("tag mutation");
    if (safe.push === true || safe.pushEnabled === true) blockedCapabilities.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blockedCapabilities.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blockedCapabilities.push("file write");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.providerActivation === true) blockedCapabilities.push("provider activation");
    if (safe.network === true || safe.fetch === true || safe.request === true) blockedCapabilities.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blockedCapabilities.push("credential access");
    if (safe.endpoint === true || safe.generateEndpoint === true) blockedCapabilities.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blockedCapabilities.push("external open");
    if (safe.payment === true || safe.checkout === true || safe.authorizePayment === true) blockedCapabilities.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blockedCapabilities.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blockedCapabilities.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawResponsePersistence === true) blockedCapabilities.push("raw provider persistence");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blockedCapabilities.push("raw user text persistence");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) blockedCapabilities.push("external url");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) blockedCapabilities.push("transaction url");
    if (safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true) blockedCapabilities.push("transaction button");
    ["status", "rcStatus", "summary", "copy", "title", "subtitle"].forEach(function (key) {
      if (BLOCKED_STATUS_RE.test(text(safe[key]))) blockedCapabilities.push("auto release language");
    });
    return blockedCapabilities;
  }
  function requiredChecks() {
    return [
      "onboarding view model",
      "visual QA",
      "trial scenario checklist",
      "no-transaction guard",
      "final manual acceptance console",
      "manual review required"
    ];
  }
  function knownLimitations() {
    return [
      "当前只是 RC 候选，不创建 release、不 push",
      "人工复核通过后才能进入下一阶段",
      "仍然不接真实 provider、不联网、不启用交易"
    ];
  }

  function evaluateGlobalShoppingPublicBetaRcConsole(input) {
    const safe = obj(input);
    const onboardingViewModelSummary = resolveSummary(safe, "publicBetaOnboardingViewModelSummary", "WeishanGlobalShoppingPublicBetaOnboardingViewModel", "buildGlobalShoppingPublicBetaOnboardingViewModel");
    const visualQaSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const scenarioChecklistSummary = resolveSummary(safe, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    const noTransactionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const finalManualAcceptanceConsoleSummary = resolveSummary(safe, "finalManualAcceptanceConsoleSummary", "WeishanGlobalShoppingFinalManualAcceptanceConsole", "buildGlobalShoppingFinalManualAcceptanceConsole");

    const summaries = [
      ["onboarding view model", onboardingViewModelSummary],
      ["visual QA", visualQaSummary],
      ["trial scenario checklist", scenarioChecklistSummary],
      ["no-transaction guard", noTransactionGuardSummary],
      ["final manual acceptance console", finalManualAcceptanceConsoleSummary]
    ];
    const missingRequired = summaries.some(function (entry) { return !present(entry[1]); });
    const blockedBySummary = summaries.some(function (entry) { return hasBlockedStatus(entry[1]); });
    const blockedCapabilities = detectBlockedCapabilities(safe);
    const passedChecks = summaries.filter(function (entry) {
      const status = safeStatus(obj(entry[1]).status);
      return present(entry[1]) && status !== "needs_review" && status !== "blocked" && status !== "failed_safe";
    }).map(function (entry) { return entry[0]; });
    if (safe.manualReviewRequired === true || safe.manualReviewRequired == null) passedChecks.push("manual review required");

    const rcStatus = blockedCapabilities.length || blockedBySummary
      ? "blocked"
      : (missingRequired || summaries.some(function (entry) { return safeStatus(obj(entry[1]).status) === "needs_review"; }) ? "needs_review" : "manual_review_required");

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_VERSION,
      rcMode:safeMode(safe.rcMode),
      rcStatus,
      status:rcStatus,
      title:"Public Beta RC Console",
      requiredChecks:requiredChecks(),
      passedChecks:passedChecks.filter(function (value, index, array) { return array.indexOf(value) === index; }),
      blockedCapabilities:blockedCapabilities.filter(function (value, index, array) { return array.indexOf(value) === index; }),
      knownLimitations:knownLimitations(),
      publicBetaOnboardingViewModelSummary:onboardingViewModelSummary,
      publicBetaVisualQaConsoleSummary:visualQaSummary,
      publicBetaTrialScenarioChecklistSummary:scenarioChecklistSummary,
      noTransactionRegressionGuardSummary:noTransactionGuardSummary,
      finalManualAcceptanceConsoleSummary:finalManualAcceptanceConsoleSummary,
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Public Beta RC Console",
        resultLabel:rcStatus === "blocked" ? "Public Beta RC Console 已阻断" : (rcStatus === "manual_review_required" ? "Public Beta RC Console 进入人工复核" : "Public Beta RC Console 仍需复核"),
        caveat:"当前只是 RC 候选，不创建 release、不 push。"
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

  function buildGlobalShoppingPublicBetaRcRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcConsole(input || {});
    return clone([
      row("public_beta_rc_console_status", "Public Beta RC Console", safe.rcStatus === "blocked" ? "Public Beta RC Console 已阻断" : (safe.rcStatus === "manual_review_required" ? "Public Beta RC Console 进入人工复核" : "Public Beta RC Console 仍需复核"), safe.rcStatus === "blocked" ? "blocked" : (safe.rcStatus === "manual_review_required" ? "pass" : "warning")),
      row("public_beta_rc_console_checks", "Required Checks", safe.requiredChecks.join(" / "), "pass"),
      row("public_beta_rc_console_limitations", "Known Limitations", safe.knownLimitations.join(" / "), "warning"),
      row("public_beta_rc_console_manual_review", "Manual Review Required", "人工复核通过后才能进入下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaRcSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcConsole(input || {});
    return clone([
      { sectionId:"public_beta_rc_console_title", label:"Public Beta RC Console", value:"当前只是 RC 候选，不创建 release、不 push", redacted:true },
      { sectionId:"public_beta_rc_console_boundary", label:"Readonly Boundary", value:"仍然不接真实 provider、不联网、不启用交易", redacted:true },
      { sectionId:"public_beta_rc_console_status", label:"RC Status", value:safe.userFacingSummary.resultLabel, redacted:true }
    ]);
  }

  function buildGlobalShoppingPublicBetaRcConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaRcConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_VERSION,
      rcStatus:safe.rcStatus,
      requiredCheckCount:toArray(safe.requiredChecks).length,
      blockedCapabilityCount:toArray(safe.blockedCapabilities).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaRcConsole(consoleState) {
    return evaluateGlobalShoppingPublicBetaRcConsole(consoleState || {});
  }

  function buildGlobalShoppingPublicBetaRcConsole(input) {
    try {
      const safe = evaluateGlobalShoppingPublicBetaRcConsole(input || {});
      safe.rows = buildGlobalShoppingPublicBetaRcRows(safe);
      safe.sections = buildGlobalShoppingPublicBetaRcSections(safe);
      return safe;
    } catch (_) {
      const safe = evaluateGlobalShoppingPublicBetaRcConsole({ status:"failed_safe" });
      safe.rows = buildGlobalShoppingPublicBetaRcRows(safe);
      safe.sections = buildGlobalShoppingPublicBetaRcSections(safe);
      return safe;
    }
  }

  window.WeishanGlobalShoppingPublicBetaRcConsole = {
    GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicBetaRcConsole,
    evaluateGlobalShoppingPublicBetaRcConsole,
    buildGlobalShoppingPublicBetaRcRows,
    buildGlobalShoppingPublicBetaRcSections,
    buildGlobalShoppingPublicBetaRcConsoleAuditDraft,
    sanitizeGlobalShoppingPublicBetaRcConsole
  };
})();
