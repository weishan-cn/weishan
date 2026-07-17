;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_VERSION = "4.2.8";
  const CONSOLE_NAME = "global_shopping_provider_distribution_freeze_console_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|distribution_freeze_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "distribution_freeze_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function panel(panelId, label, status, summary, caveat) {
    return { panelId:text(panelId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.createRealDistributionPackage === true ? "real_distribution_package_detected" : "",
      safe.freezeRuntimeConfig === true ? "runtime_config_freeze_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.switchProductionProvider === true ? "production_provider_switch_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderDistributionFreezePanels(input) {
    const safe = obj(input);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const providerSafetyDistributionMatrixSummary = resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    const providerDistributionReadinessViewModelSummary = resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel");
    return clone([
      panel("offline_distribution_readiness_center", "Offline Distribution Readiness Center", present(offlineDistributionReadinessCenterSummary) ? offlineDistributionReadinessCenterSummary.status : "needs_review", labelOf(offlineDistributionReadinessCenterSummary, "Offline Distribution Readiness Center 仍需复核"), "Distribution Freeze 不创建真实分发包、不冻结配置。"),
      panel("no_activation_enforcement_ledger", "No-Activation Enforcement Ledger", present(noActivationEnforcementLedgerSummary) ? noActivationEnforcementLedgerSummary.status : "needs_review", labelOf(noActivationEnforcementLedgerSummary, "No-Activation Enforcement Ledger 仍需复核"), "No-Activation Enforcement 不执行真实阻断。"),
      panel("final_user_trust_summary", "Final User Trust Summary", present(finalUserTrustSummarySummary) ? finalUserTrustSummarySummary.status : "needs_review", labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      panel("provider_safety_distribution_matrix", "Provider Safety Distribution Matrix", present(providerSafetyDistributionMatrixSummary) ? providerSafetyDistributionMatrixSummary.status : "needs_review", labelOf(providerSafetyDistributionMatrixSummary, "Provider Safety Distribution Matrix 仍需复核"), "No-Production Guarantee 不切换 production provider。"),
      panel("provider_distribution_readiness_view_model", "Provider Distribution Readiness Review", present(providerDistributionReadinessViewModelSummary) ? providerDistributionReadinessViewModelSummary.status : "needs_review", labelOf(providerDistributionReadinessViewModelSummary, "Provider Distribution Readiness Review 仍需复核"), "Human distribution closure review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingProviderDistributionFreezeConsoleRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.freezePanels).length ? toArray(safe.freezePanels) : buildGlobalShoppingProviderDistributionFreezePanels(safe);
    return clone([
      row("provider_distribution_freeze_console_status", "Provider Distribution Freeze Console", obj(safe.userFacingSummary).resultLabel || "Provider Distribution Freeze Console 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_distribution_freeze_console_boundary", "Distribution Freeze 边界", "Distribution Freeze 不创建真实分发包、不冻结配置。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderDistributionFreezeConsole(input) {
    const safe = obj(input);
    const freezePanels = buildGlobalShoppingProviderDistributionFreezePanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = freezePanels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewPanels = freezePanels.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_VERSION,
      status:status,
      consoleMode:safeMode(safe.consoleMode),
      freezeBoundary:{
        distributionFreezeOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRealDistributionPackage:false,
        canFreezeRuntimeConfig:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canSwitchProductionProvider:false,
        canActivateSandbox:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      freezeSummary:{
        hasOfflineDistributionReadinessCenter:present(resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter")),
        hasNoActivationEnforcementLedger:present(resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasProviderSafetyDistributionMatrix:present(resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix")),
        hasDistributionReadinessReview:present(resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel")),
        freezePanelCount:freezePanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        blockedPanelCount:directBlockedReasons.length + blockedPanels.length,
        readyForUserFacingSafetyReceipt:status === "ready",
        humanDistributionClosureReviewRequired:true
      },
      freezePanels:freezePanels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Distribution Freeze Console",
        resultLabel:status === "ready" ? "Provider Distribution Freeze Console 已准备" : (status === "blocked" ? "Provider Distribution Freeze Console 已阻断" : "Provider Distribution Freeze Console 仍需复核"),
        caveat:"Distribution Freeze 不创建真实分发包、不冻结配置。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderDistributionFreezeConsoleRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderDistributionFreezeConsoleAuditDraft(input) {
    const consoleModel = buildGlobalShoppingProviderDistributionFreezeConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_VERSION,
      status:consoleModel.status,
      freezePanelCount:obj(consoleModel.freezeSummary).freezePanelCount || 0,
      blockedPanelCount:obj(consoleModel.freezeSummary).blockedPanelCount || 0,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderDistributionFreezeConsole(consoleModel) {
    return evaluateGlobalShoppingProviderDistributionFreezeConsole(consoleModel || {});
  }

  function buildGlobalShoppingProviderDistributionFreezeConsole(input) {
    try {
      return evaluateGlobalShoppingProviderDistributionFreezeConsole(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderDistributionFreezeConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderDistributionFreezeConsole = {
    GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingProviderDistributionFreezeConsole,
    evaluateGlobalShoppingProviderDistributionFreezeConsole,
    buildGlobalShoppingProviderDistributionFreezeConsoleRows,
    buildGlobalShoppingProviderDistributionFreezePanels,
    buildGlobalShoppingProviderDistributionFreezeConsoleAuditDraft,
    sanitizeGlobalShoppingProviderDistributionFreezeConsole
  };
})();
