;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION = "4.2.1";
  const PACK_NAME = "global_shopping_public_beta_trial_readiness_pack_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, trial_readiness_pack_only:true };
  const BLOCKED_TEXT_RE = /provider|network|endpoint|payment|order|ticketing|release|tag|push|export|download|upload|mail|openExternal|window\.open|token|key|secret/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "trial_readiness_pack_only");
    return ALLOWED_MODES[mode] ? mode : "trial_readiness_pack_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, title, summary, status) {
    return { sectionId:text(sectionId), title:text(title), summary:text(summary), status:safeStatus(status), redacted:true };
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
  function hasBooleanRisk(value) {
    return value === true;
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    [
      "provider",
      "network",
      "key",
      "endpoint",
      "external",
      "payment",
      "order",
      "ticketing",
      "rawPersistence",
      "fileWrite",
      "export",
      "download",
      "upload",
      "mail",
      "openExternal",
      "release",
      "tag",
      "push"
    ].forEach(function (name) {
      if (hasBooleanRisk(safe[name])) reasons.push(name + "_enabled");
    });
    if (safe["window.open"] != null || safe.windowOpen != null) reasons.push("window_open_detected");
    if (BLOCKED_TEXT_RE.test(JSON.stringify(safe))) {
      if (text(safe.token || safe.key || safe.secret)) reasons.push("secret_detected");
      if (text(safe.runtimeSummary || safe.riskLabel || safe.nextStageDecision || safe.copy || safe.summary)) reasons.push("blocked_copy_detected");
    }
    return reasons;
  }

  function buildGlobalShoppingPublicBetaTrialReadinessRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_trial_readiness_pack_status", "Public Beta Trial Readiness Pack", status === "ready" ? "Public Beta Trial Readiness Pack 已准备" : (status === "blocked" ? "Public Beta Trial Readiness Pack 已阻断" : "Public Beta Trial Readiness Pack 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_trial_scope", "试用范围", "试用范围：只读候选价、费用归一化、官方价锚点", "pass"),
      row("public_beta_trial_locked_capabilities", "锁定能力", "锁定能力：provider、联网、付款、下单、出票", "warning"),
      row("public_beta_trial_manual_review", "Manual Review Required", "人工验收后再决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialReadinessSections(input) {
    const safe = obj(input);
    const publicBetaUserJourneyShellSummary = resolveSummary(safe, "publicBetaUserJourneyShellSummary", "WeishanGlobalShoppingPublicBetaUserJourneyShell", "buildGlobalShoppingPublicBetaUserJourneyShell");
    const categoryResultSimulatorSummary = resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator");
    const readOnlyComparisonBoardSummary = resolveSummary(safe, "readOnlyComparisonBoardSummary", "WeishanGlobalShoppingReadOnlyComparisonBoard", "buildGlobalShoppingReadOnlyComparisonBoard");
    const resultTrustBadgePanelSummary = resolveSummary(safe, "resultTrustBadgePanelSummary", "WeishanGlobalShoppingResultTrustBadgePanel", "buildGlobalShoppingResultTrustBadgePanel");
    const publicBetaOperatorConsoleSummary = resolveSummary(safe, "publicBetaOperatorConsoleSummary", "WeishanGlobalShoppingPublicBetaOperatorConsole", "buildGlobalShoppingPublicBetaOperatorConsole");
    const finalOfflineBetaAuditSummary = resolveSummary(safe, "finalOfflineBetaAuditSummary", "WeishanGlobalShoppingFinalOfflineBetaAudit", "buildGlobalShoppingFinalOfflineBetaAudit");
    return clone([
      section("trial_user_journey", "Public Beta User Journey", summaryLabel(publicBetaUserJourneyShellSummary, "Public Beta User Journey 仍需复核"), publicBetaUserJourneyShellSummary.status),
      section("trial_category_simulator", "Category Result Simulator", summaryLabel(categoryResultSimulatorSummary, "Category Result Simulator 仍需复核"), categoryResultSimulatorSummary.status),
      section("trial_comparison_board", "Read-Only Comparison Board", summaryLabel(readOnlyComparisonBoardSummary, "Read-Only Comparison Board 仍需复核"), readOnlyComparisonBoardSummary.status),
      section("trial_trust_badge", "Result Trust Badge", summaryLabel(resultTrustBadgePanelSummary, "Result Trust Badge 仍需复核"), resultTrustBadgePanelSummary.status),
      section("trial_operator_console", "Public Beta Operator Console", summaryLabel(publicBetaOperatorConsoleSummary, "Public Beta Operator Console 仍需复核"), publicBetaOperatorConsoleSummary.status),
      section("trial_final_audit", "Final Offline Beta Audit", summaryLabel(finalOfflineBetaAuditSummary, "Final Offline Beta Audit 仍需复核"), finalOfflineBetaAuditSummary.status)
    ]);
  }

  function evaluateGlobalShoppingPublicBetaTrialReadinessPack(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingPublicBetaTrialReadinessSections(safe);
    const statuses = sections.map(function (item) { return safeStatus(item.status); });
    const blockedReasons = detectBlockedReasons(safe);
    const missingUpstream = sections.some(function (item) { return !/已准备|通过|复核/.test(text(item.summary)); }) || sections.some(function (item) { return safeStatus(item.status) === "needs_review" && /仍需复核/.test(text(item.summary)); });
    const blocked = blockedReasons.length > 0 || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview = missingUpstream || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION,
      packMode:safeMode(safe.packMode),
      status,
      title:"Public Beta Trial Readiness Pack",
      trialScope:["只读候选价", "费用归一化", "官方价锚点"],
      supportedCategories:["flight", "hotel", "product"],
      lockedCapabilities:["provider", "联网", "付款", "下单", "出票"],
      manualReviewChecklist:["核对候选价文案", "确认 Provider-Zero", "确认无外部打开", "确认无支付/下单入口"],
      knownLimitations:["不代表真实最低价", "不代表最终成交价", "仅限只读 mock 信息"],
      readinessStatus:status,
      manualReviewRequired:true,
      rows:buildGlobalShoppingPublicBetaTrialReadinessRows({ status }),
      sections,
      blockedReasons,
      userFacingSummary:{
        title:"Public Beta Trial Readiness Pack",
        resultLabel:status === "ready" ? "Public Beta Trial Readiness Pack 已准备" : (status === "blocked" ? "Public Beta Trial Readiness Pack 已阻断" : "Public Beta Trial Readiness Pack 仍需复核"),
        caveat:"试用范围仅限只读候选价、费用归一化、官方价锚点，人工验收后再决定下一阶段。"
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

  function buildGlobalShoppingPublicBetaTrialReadinessPackAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialReadinessPack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION,
      status:safe.status,
      supportedCategoryCount:toArray(safe.supportedCategories).length,
      lockedCapabilityCount:toArray(safe.lockedCapabilities).length,
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

  function sanitizeGlobalShoppingPublicBetaTrialReadinessPack(pack) {
    return evaluateGlobalShoppingPublicBetaTrialReadinessPack(pack || {});
  }

  window.WeishanGlobalShoppingPublicBetaTrialReadinessPack = {
    GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_READINESS_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingPublicBetaTrialReadinessPack:sanitizeGlobalShoppingPublicBetaTrialReadinessPack,
    evaluateGlobalShoppingPublicBetaTrialReadinessPack,
    buildGlobalShoppingPublicBetaTrialReadinessRows,
    buildGlobalShoppingPublicBetaTrialReadinessSections,
    buildGlobalShoppingPublicBetaTrialReadinessPackAuditDraft,
    sanitizeGlobalShoppingPublicBetaTrialReadinessPack
  };
})();
