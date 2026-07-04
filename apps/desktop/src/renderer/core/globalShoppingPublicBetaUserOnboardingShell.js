;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_VERSION = "4.2.0";
  const SHELL_NAME = "global_shopping_public_beta_user_onboarding_shell_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, onboarding_shell_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "onboarding_shell_only");
    return ALLOWED_MODES[mode] ? mode : "onboarding_shell_only";
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
  function blocked(input) {
    const safe = obj(input);
    return safe.provider === true
      || safe.network === true
      || safe.key === true
      || safe.endpoint === true
      || safe.externalOpen === true
      || safe.openExternal === true
      || safe.windowOpen === true
      || safe.payment === true
      || safe.order === true
      || safe.ticketing === true
      || safe.rawProviderPersistence === true
      || safe.rawResponsePersistence === true
      || safe.rawUserTextPersistence === true
      || safe.rawUserText === true
      || safe.externalUrl != null
      || safe.platformUrl != null
      || safe.providerUrl != null
      || safe.bookingUrl != null
      || safe.checkoutUrl != null
      || safe.paymentUrl != null
      || safe.orderUrl != null;
  }

  function buildGlobalShoppingPublicBetaUserOnboardingRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_user_onboarding_status", "Public Beta User Onboarding", status === "ready" ? "Public Beta User Onboarding 已准备" : (status === "blocked" ? "Public Beta User Onboarding 已阻断" : "Public Beta User Onboarding 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_user_onboarding_readonly_capabilities", "Readonly Capabilities", "你可以查看候选价、费用归一化和官方价锚点", "pass"),
      row("public_beta_user_onboarding_locked_capabilities", "Locked Capabilities", "当前不会付款、下单或出票", "warning"),
      row("public_beta_user_onboarding_privacy_boundary", "Privacy Boundary", "不会保存账号、证件或支付信息", "pass"),
      row("public_beta_user_onboarding_feedback_boundary", "Safe Feedback Draft", "反馈入口目前仅为草稿，不发送、不上传、不保存用户原文", "warning"),
      row("public_beta_user_onboarding_rc_boundary", "RC Candidate Boundary", "当前只是 RC 候选，不创建 release、不 push", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaUserOnboardingSections(input) {
    const safe = obj(input);
    return clone([
      { sectionId:"public_beta_user_onboarding_title", label:"Public Beta User Onboarding", value:text(safe.onboardingTitle || "Public Beta User Onboarding"), redacted:true },
      { sectionId:"public_beta_user_onboarding_value", label:"User Value Summary", value:"你可以查看候选价、费用归一化和官方价锚点", redacted:true },
      { sectionId:"public_beta_user_onboarding_locked", label:"Locked Capabilities", value:"当前不会付款、下单或出票", redacted:true },
      { sectionId:"public_beta_user_onboarding_privacy", label:"Privacy Boundary", value:"不会保存账号、证件或支付信息", redacted:true }
    ]);
  }

  function evaluateGlobalShoppingPublicBetaUserOnboardingShell(input) {
    const safe = obj(input);
    const visualQaSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const scenarioSummary = resolveSummary(safe, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    const guardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const qaViewModelSummary = resolveSummary(safe, "publicBetaQaViewModelSummary", "WeishanGlobalShoppingPublicBetaQaViewModel", "buildGlobalShoppingPublicBetaQaViewModel");
    const trialReadinessSummary = resolveSummary(safe, "publicBetaTrialReadinessPackSummary", "WeishanGlobalShoppingPublicBetaTrialReadinessPack", "buildGlobalShoppingPublicBetaTrialReadinessPack");
    const upstreamBlocked = [visualQaSummary, scenarioSummary, guardSummary, qaViewModelSummary, trialReadinessSummary].some(function (summary) {
      const status = safeStatus(obj(summary).status);
      return status === "blocked" || status === "failed_safe";
    });
    const missingUpstream = !present(safe.publicBetaVisualQaConsoleSummary)
      || !present(safe.publicBetaTrialScenarioChecklistSummary)
      || !present(safe.noTransactionRegressionGuardSummary)
      || !present(safe.publicBetaQaViewModelSummary)
      || !present(safe.publicBetaTrialReadinessPackSummary);
    const status = blocked(safe) || upstreamBlocked ? "blocked" : (missingUpstream ? "needs_review" : "ready");
    return clone({
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_VERSION,
      shellMode:safeMode(safe.shellMode),
      status,
      onboardingTitle:"Public Beta User Onboarding",
      userValueSummary:"你可以查看候选价、费用归一化和官方价锚点",
      readonlyCapabilities:["候选价", "费用归一化", "官方价锚点"],
      lockedCapabilities:["当前不会付款、下单或出票", "不打开外部平台", "不接真实 provider"],
      privacyBoundary:"不会保存账号、证件或支付信息",
      manualReviewRequired:true,
      publicBetaVisualQaConsoleSummary:visualQaSummary,
      publicBetaTrialScenarioChecklistSummary:scenarioSummary,
      noTransactionRegressionGuardSummary:guardSummary,
      publicBetaQaViewModelSummary:qaViewModelSummary,
      publicBetaTrialReadinessPackSummary:trialReadinessSummary,
      rows:buildGlobalShoppingPublicBetaUserOnboardingRows({ status }),
      sections:buildGlobalShoppingPublicBetaUserOnboardingSections(safe),
      userFacingSummary:{
        title:"Public Beta User Onboarding",
        resultLabel:status === "ready" ? "Public Beta User Onboarding 已准备" : (status === "blocked" ? "Public Beta User Onboarding 已阻断" : "Public Beta User Onboarding 仍需复核"),
        caveat:"当前只是 RC 候选，不创建 release、不 push；当前不会付款、下单或出票；反馈入口目前仅为草稿，不发送、不上传、不保存用户原文。"
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

  function buildGlobalShoppingPublicBetaUserOnboardingShellAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaUserOnboardingShell(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_AUDIT_DRAFT",
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      rowCount:toArray(safe.rows).length,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaUserOnboardingShell(shell) {
    return evaluateGlobalShoppingPublicBetaUserOnboardingShell(shell || {});
  }

  function buildGlobalShoppingPublicBetaUserOnboardingShell(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaUserOnboardingShell(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaUserOnboardingShell({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaUserOnboardingShell = {
    GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_VERSION,
    SHELL_NAME,
    buildGlobalShoppingPublicBetaUserOnboardingShell,
    evaluateGlobalShoppingPublicBetaUserOnboardingShell,
    buildGlobalShoppingPublicBetaUserOnboardingRows,
    buildGlobalShoppingPublicBetaUserOnboardingSections,
    buildGlobalShoppingPublicBetaUserOnboardingShellAuditDraft,
    sanitizeGlobalShoppingPublicBetaUserOnboardingShell
  };
})();
