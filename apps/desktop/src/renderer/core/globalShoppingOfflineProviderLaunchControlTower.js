;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_VERSION = "4.0.7";
  const TOWER_NAME = "global_shopping_offline_provider_launch_control_tower_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function panel(panelId, label, status, summary, caveat) {
    return { panelId:text(panelId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
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
      safe.persistLaunchDecision === true ? "launch_decision_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderLaunchControlPanels(input) {
    const safe = obj(input);
    const offlineLaunchDecisionSimulatorSummary = resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const providerOfflineLaunchChecklistSummary = resolveSummary(safe, "providerOfflineLaunchChecklistSummary", "WeishanGlobalShoppingProviderOfflineLaunchChecklist", "buildGlobalShoppingProviderOfflineLaunchChecklist");
    const providerOfflineLaunchViewModelSummary = resolveSummary(safe, "providerOfflineLaunchViewModelSummary", "WeishanGlobalShoppingProviderOfflineLaunchViewModel", "buildGlobalShoppingProviderOfflineLaunchViewModel");
    return clone([
      panel("launch_decision_simulator", "Offline Launch Decision Simulator", present(offlineLaunchDecisionSimulatorSummary) ? offlineLaunchDecisionSimulatorSummary.status : "needs_review", labelOf(offlineLaunchDecisionSimulatorSummary, "离线发布决策模拟器仍需复核"), "Launch Decision 不保存真实决策。"),
      panel("activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "Activation Receipt Ledger 不保存真实回执。"),
      panel("security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Adapter 安全回归仍需复核"), "Security Guard 不修改配置、不启用 provider。"),
      panel("offline_launch_checklist", "Provider Offline Launch Checklist", present(providerOfflineLaunchChecklistSummary) ? providerOfflineLaunchChecklistSummary.status : "needs_review", labelOf(providerOfflineLaunchChecklistSummary, "离线 Launch Checklist 仍需复核"), "Launch Checklist 不创建 release、不 push。"),
      panel("offline_launch_view_model", "Provider Offline Launch View Model", present(providerOfflineLaunchViewModelSummary) ? providerOfflineLaunchViewModelSummary.status : "needs_review", labelOf(providerOfflineLaunchViewModelSummary, "Provider 离线 Launch 决策与安全守卫仍需复核"), "当前只展示 provider 离线 launch 决策与安全守卫。")
    ]);
  }

  function buildGlobalShoppingOfflineProviderLaunchControlRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.controlPanels).length ? toArray(safe.controlPanels) : buildGlobalShoppingOfflineProviderLaunchControlPanels(safe);
    return clone([
      row("offline_provider_launch_control_tower_status", "Offline Provider Launch Control Tower 状态", obj(safe.userFacingSummary).resultLabel || "离线 Launch 控制仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_provider_launch_control_tower_boundary", "离线 Launch Control 边界", "该控制塔只展示离线 launch control，不保存真实决策，不创建 release，不 push，不接真实 provider。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineProviderLaunchControlTower(input) {
    const safe = obj(input);
    const panels = buildGlobalShoppingOfflineProviderLaunchControlPanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = panels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewPanels = panels.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      towerName:TOWER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_VERSION,
      status:status,
      controlBoundary:{
        towerId:"global-shopping-offline-provider-launch-control-tower",
        towerMode:"control_tower_only",
        controlTowerOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistLaunchDecision:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateProviderClient:false,
        canModifyRuntimeConfig:false
      },
      controlSummary:{
        hasLaunchDecisionSimulator:present(resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator")),
        hasActivationReceiptLedger:present(resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger")),
        hasSecurityRegressionGuard:present(resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard")),
        hasOfflineLaunchChecklist:present(resolveSummary(safe, "providerOfflineLaunchChecklistSummary", "WeishanGlobalShoppingProviderOfflineLaunchChecklist", "buildGlobalShoppingProviderOfflineLaunchChecklist")),
        hasOfflineLaunchViewModel:present(resolveSummary(safe, "providerOfflineLaunchViewModelSummary", "WeishanGlobalShoppingProviderOfflineLaunchViewModel", "buildGlobalShoppingProviderOfflineLaunchViewModel")),
        controlPanelCount:panels.length,
        hardBlockerCount:directBlockedReasons.length + blockedPanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        readyForAdapterPolicyEngine:status === "ready",
        humanLaunchControlReviewRequired:true
      },
      controlPanels:panels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Provider Launch Control Tower",
        resultLabel:status === "ready" ? "离线 Launch 控制塔已准备" : (status === "blocked" ? "离线 Launch 控制已阻断" : "离线 Launch 控制仍需复核"),
        caveat:"该控制塔只展示离线 launch control，不保存真实决策，不创建 release，不 push，不接真实 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineProviderLaunchControlRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineProviderLaunchControlTowerAuditDraft(input) {
    const tower = buildGlobalShoppingOfflineProviderLaunchControlTower(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_AUDIT_DRAFT",
      towerName:TOWER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_VERSION,
      status:tower.status,
      controlPanelCount:obj(tower.controlSummary).controlPanelCount || 0,
      hardBlockerCount:obj(tower.controlSummary).hardBlockerCount || 0,
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
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineProviderLaunchControlTower(tower) {
    return evaluateGlobalShoppingOfflineProviderLaunchControlTower(tower || {});
  }

  function buildGlobalShoppingOfflineProviderLaunchControlTower(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderLaunchControlTower(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderLaunchControlTower({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderLaunchControlTower = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_VERSION,
    TOWER_NAME,
    buildGlobalShoppingOfflineProviderLaunchControlTower,
    evaluateGlobalShoppingOfflineProviderLaunchControlTower,
    buildGlobalShoppingOfflineProviderLaunchControlRows,
    buildGlobalShoppingOfflineProviderLaunchControlPanels,
    buildGlobalShoppingOfflineProviderLaunchControlTowerAuditDraft,
    sanitizeGlobalShoppingOfflineProviderLaunchControlTower
  };
})();
