;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION = "4.1.0";
  const SHELL_NAME = "global_shopping_public_beta_user_journey_shell_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, user_journey_only:true };
  const REQUIRED_KEYS = [
    "operatorConsoleSummary",
    "categoryExpansionShellSummary",
    "finalOfflineBetaAuditSummary",
    "publicBetaAcceptanceBoardSummary",
    "categoryResultSimulatorSummary"
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse|rawUserText/ig, "redacted")
      .trim();
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "user_journey_only");
    return ALLOWED_MODES[mode] ? mode : "user_journey_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function step(stepId, title, summary, status) {
    return { stepId:text(stepId), title:text(title), summary:text(summary), status:safeStatus(status), redacted:true };
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION) reasons.push("app_version_mismatch");
    if (safe.provider === true || safe.enableProvider === true || safe.productionProvider === true || safe.noRealProvider === false) reasons.push("provider_detected");
    if (safe.network === true || safe.noNetwork === false) reasons.push("network_detected");
    if (safe.readApiKey === true || safe.key === true || safe.secret === true || safe.noSecretRisk === false) reasons.push("secret_detected");
    if (safe.endpoint === true || safe.providerClient === true) reasons.push("endpoint_detected");
    if (safe.external === true || safe.openExternal === true || safe.windowOpen === true || safe.noExternalOpen === false) reasons.push("external_open_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true || safe.booking === true || safe.checkout === true) reasons.push("transaction_detected");
    if (safe.persistRawProviderData === true || safe.persistRawUserText === true || safe.rawPersistence === true || safe.noRawPersistence === false || safe.noRawResponsePersistence === false) reasons.push("raw_persistence_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null || safe.noTransactionUrl === false) reasons.push("transaction_url_detected");
    if (safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true) reasons.push("transaction_button_enabled");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaUserJourneySteps(input) {
    const safe = obj(input);
    return clone([
      step("readonly_search_plan", "只读搜索计划", text(safe.readonlySearchPlan || "只读搜索计划仍需复核"), safe.readonlySearchPlan ? "ready" : "needs_review"),
      step("candidate_evidence_step", "候选价整理", text(safe.candidateEvidenceStep || "候选价整理仍需复核"), safe.candidateEvidenceStep ? "ready" : "needs_review"),
      step("fee_normalization_step", "费用归一化步骤", text(safe.feeNormalizationStep || "费用归一化步骤仍需复核"), safe.feeNormalizationStep ? "ready" : "needs_review"),
      step("official_anchor_step", "官方价锚点步骤", text(safe.officialAnchorStep || "官方价锚点步骤仍需复核"), safe.officialAnchorStep ? "ready" : "needs_review"),
      step("category_result_step", "Category Result Simulator", text(safe.categoryResultStep || "Category Result Simulator 仍需复核"), safe.categoryResultStep ? "ready" : "needs_review"),
      step("user_boundary_step", "用户边界确认", text(safe.userBoundaryStep || "用户边界确认仍需复核"), safe.userBoundaryStep ? "ready" : "needs_review")
    ]);
  }

  function buildGlobalShoppingPublicBetaUserJourneyRows(input) {
    const safe = obj(input);
    const steps = Array.isArray(safe.steps) ? safe.steps : [];
    return clone([
      row("public_beta_user_journey_shell_status", "Public Beta User Journey", safe.status === "ready" ? "Public Beta User Journey 已准备" : (safe.status === "blocked" ? "Public Beta User Journey 已阻断" : "Public Beta User Journey 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_user_journey_user_intent", "User Intent", text(safe.userIntent || "global shopping readonly intent"), "pass"),
      row("public_beta_user_journey_category", "Normalized Category", text(safe.normalizedCategory || "flight"), "pass"),
      row("public_beta_user_journey_boundary", "Manual Review Required", safe.manualReviewRequired === true ? "仍需人工复核后再决定是否进入下一阶段" : "缺少人工复核边界", safe.manualReviewRequired === true ? "warning" : "blocked")
    ].concat(steps.map(function (item) {
      return row(item.stepId, item.title, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingPublicBetaUserJourneyShellAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_AUDIT_DRAFT",
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION,
      status:safeStatus(safe.status),
      stepCount:Array.isArray(safe.steps) ? safe.steps.length : 0,
      manualReviewRequired:true,
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

  function evaluateGlobalShoppingPublicBetaUserJourneyShell(input) {
    const safe = obj(input);
    const steps = buildGlobalShoppingPublicBetaUserJourneySteps(safe);
    const directBlockedReasons = blockedReasons(safe);
    const missingUpstream = REQUIRED_KEYS.some(function (key) { return !present(safe[key]); });
    const stepsNeedReview = steps.some(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length ? "blocked" : ((missingUpstream || stepsNeedReview) ? "needs_review" : "ready");
    return clone({
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION,
      status,
      shellMode:safeMode(safe.shellMode),
      title:"Public Beta User Journey",
      userIntent:text(safe.userIntent || "只读全球购意图"),
      normalizedCategory:text(safe.normalizedCategory || "flight"),
      readonlySearchPlan:text(safe.readonlySearchPlan || "只读搜索计划仍需复核"),
      candidateEvidenceStep:text(safe.candidateEvidenceStep || "候选价整理仍需复核"),
      feeNormalizationStep:text(safe.feeNormalizationStep || "费用归一化步骤仍需复核"),
      officialAnchorStep:text(safe.officialAnchorStep || "官方价锚点步骤仍需复核"),
      userBoundaryStep:text(safe.userBoundaryStep || "用户边界确认仍需复核"),
      steps,
      rows:buildGlobalShoppingPublicBetaUserJourneyRows({
        status,
        userIntent:safe.userIntent,
        normalizedCategory:safe.normalizedCategory,
        manualReviewRequired:true,
        steps
      }),
      manualReviewRequired:true,
      blockedReasons:directBlockedReasons,
      auditDraft:buildGlobalShoppingPublicBetaUserJourneyShellAuditDraft({ status, steps }),
      userFacingSummary:{
        title:"Public Beta User Journey",
        resultLabel:status === "ready" ? "Public Beta User Journey 已准备" : (status === "blocked" ? "Public Beta User Journey 已阻断" : "Public Beta User Journey 仍需复核"),
        caveat:"当前只整理只读搜索计划与候选价证据，不付款、不下单、不出票。"
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

  function sanitizeGlobalShoppingPublicBetaUserJourneyShell(summary) {
    return evaluateGlobalShoppingPublicBetaUserJourneyShell(summary || {});
  }

  function buildGlobalShoppingPublicBetaUserJourneyShell(input) {
    try {
      return evaluateGlobalShoppingPublicBetaUserJourneyShell(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaUserJourneyShell({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaUserJourneyShell = {
    GLOBAL_SHOPPING_PUBLIC_BETA_USER_JOURNEY_SHELL_VERSION,
    SHELL_NAME,
    buildGlobalShoppingPublicBetaUserJourneyShell,
    evaluateGlobalShoppingPublicBetaUserJourneyShell,
    buildGlobalShoppingPublicBetaUserJourneyRows,
    buildGlobalShoppingPublicBetaUserJourneySteps,
    buildGlobalShoppingPublicBetaUserJourneyShellAuditDraft,
    sanitizeGlobalShoppingPublicBetaUserJourneyShell
  };
})();
