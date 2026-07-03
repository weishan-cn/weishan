;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_VERSION = "4.0.9";
  const CENTER_NAME = "global_shopping_offline_distribution_readiness_center_v1";

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
  function safeMode(value) { return /^(disabled|distribution_readiness_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "distribution_readiness_only"; }
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
      decisionStored:false,
      receiptStored:false,
      evidenceStored:false,
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
      safe.createDistributionPackage === true ? "distribution_package_detected" : "",
      safe.persistDistributionResult === true ? "distribution_result_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineDistributionReadinessPanels(input) {
    const safe = obj(input);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const finalReadinessHandoffSimulatorSummary = resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator");
    const providerGovernanceClosureEvidenceLedgerSummary = resolveSummary(safe, "providerGovernanceClosureEvidenceLedgerSummary", "WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger", "buildGlobalShoppingProviderGovernanceClosureEvidenceLedger");
    const providerGovernanceClosureViewModelSummary = resolveSummary(safe, "providerGovernanceClosureViewModelSummary", "WeishanGlobalShoppingProviderGovernanceClosureViewModel", "buildGlobalShoppingProviderGovernanceClosureViewModel");
    return clone([
      panel("offline_provider_governance_closure_board", "Offline Provider Governance Closure Board", present(offlineProviderGovernanceClosureBoardSummary) ? offlineProviderGovernanceClosureBoardSummary.status : "needs_review", labelOf(offlineProviderGovernanceClosureBoardSummary, "Offline Provider Governance Closure Board 仍需复核"), "Distribution Readiness 不创建真实分发包。"),
      panel("no_activation_compliance_seal", "No-Activation Compliance Seal", present(noActivationComplianceSealSummary) ? noActivationComplianceSealSummary.status : "needs_review", labelOf(noActivationComplianceSealSummary, "No-Activation Compliance Seal 仍需复核"), "No-Activation Enforcement 不执行真实阻断。"),
      panel("final_readiness_handoff_simulator", "Final Readiness Handoff Simulator", present(finalReadinessHandoffSimulatorSummary) ? finalReadinessHandoffSimulatorSummary.status : "needs_review", labelOf(finalReadinessHandoffSimulatorSummary, "Final Readiness Handoff Simulator 仍需复核"), "User Trust Summary 不写文件、不保存用户原文。"),
      panel("provider_governance_closure_evidence_ledger", "Provider Governance Closure Evidence Ledger", present(providerGovernanceClosureEvidenceLedgerSummary) ? providerGovernanceClosureEvidenceLedgerSummary.status : "needs_review", labelOf(providerGovernanceClosureEvidenceLedgerSummary, "Provider Governance Closure Evidence Ledger 仍需复核"), "Safety Matrix 不启用 provider、不激活 sandbox。"),
      panel("provider_governance_closure_view_model", "Provider Governance Closure Review", present(providerGovernanceClosureViewModelSummary) ? providerGovernanceClosureViewModelSummary.status : "needs_review", labelOf(providerGovernanceClosureViewModelSummary, "Provider Governance Closure Review 仍需复核"), "Human distribution readiness review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingOfflineDistributionReadinessRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.distributionPanels).length ? toArray(safe.distributionPanels) : buildGlobalShoppingOfflineDistributionReadinessPanels(safe);
    return clone([
      row("offline_distribution_readiness_center_status", "Offline Distribution Readiness Center", obj(safe.userFacingSummary).resultLabel || "Offline Distribution Readiness Center 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_distribution_readiness_center_boundary", "Distribution Readiness 边界", "该 Center 只展示离线分发准备状态，不创建真实分发包、不保存真实分发结果。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineDistributionReadinessCenter(input) {
    const safe = obj(input);
    const distributionPanels = buildGlobalShoppingOfflineDistributionReadinessPanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = distributionPanels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewPanels = distributionPanels.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_VERSION,
      status:status,
      centerMode:safeMode(safe.centerMode),
      distributionBoundary:{
        distributionReadinessOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateDistributionPackage:false,
        canPersistDistributionResult:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canModifyRuntimeConfig:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false
      },
      distributionSummary:{
        hasGovernanceClosureBoard:present(resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard")),
        hasNoActivationComplianceSeal:present(resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal")),
        hasFinalReadinessHandoffSimulator:present(resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator")),
        hasClosureEvidenceLedger:present(resolveSummary(safe, "providerGovernanceClosureEvidenceLedgerSummary", "WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger", "buildGlobalShoppingProviderGovernanceClosureEvidenceLedger")),
        hasClosureViewModel:present(resolveSummary(safe, "providerGovernanceClosureViewModelSummary", "WeishanGlobalShoppingProviderGovernanceClosureViewModel", "buildGlobalShoppingProviderGovernanceClosureViewModel")),
        distributionPanelCount:distributionPanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        blockedPanelCount:directBlockedReasons.length + blockedPanels.length,
        readyForNoActivationEnforcementLedger:status === "ready",
        humanDistributionReadinessReviewRequired:true
      },
      distributionPanels:distributionPanels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Distribution Readiness Center",
        resultLabel:status === "ready" ? "Offline Distribution Readiness Center 已准备" : (status === "blocked" ? "Offline Distribution Readiness Center 已阻断" : "Offline Distribution Readiness Center 仍需复核"),
        caveat:"该 Center 只展示离线分发准备状态，不创建真实分发包、不保存真实分发结果。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineDistributionReadinessRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineDistributionReadinessCenterAuditDraft(input) {
    const center = buildGlobalShoppingOfflineDistributionReadinessCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_VERSION,
      status:center.status,
      distributionPanelCount:obj(center.distributionSummary).distributionPanelCount || 0,
      blockedPanelCount:obj(center.distributionSummary).blockedPanelCount || 0,
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

  function sanitizeGlobalShoppingOfflineDistributionReadinessCenter(center) {
    return evaluateGlobalShoppingOfflineDistributionReadinessCenter(center || {});
  }

  function buildGlobalShoppingOfflineDistributionReadinessCenter(input) {
    try {
      return evaluateGlobalShoppingOfflineDistributionReadinessCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineDistributionReadinessCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineDistributionReadinessCenter = {
    GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingOfflineDistributionReadinessCenter,
    evaluateGlobalShoppingOfflineDistributionReadinessCenter,
    buildGlobalShoppingOfflineDistributionReadinessRows,
    buildGlobalShoppingOfflineDistributionReadinessPanels,
    buildGlobalShoppingOfflineDistributionReadinessCenterAuditDraft,
    sanitizeGlobalShoppingOfflineDistributionReadinessCenter
  };
})();
