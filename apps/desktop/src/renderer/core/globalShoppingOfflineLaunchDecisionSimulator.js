;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_VERSION = "3.4.0";
  const SIMULATOR_NAME = "global_shopping_offline_launch_decision_simulator_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function scenario(scenarioId, label, status, summary, caveat) {
    return { scenarioId:text(scenarioId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.persistRealDecision === true ? "real_decision_persistence_detected" : "",
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

  function buildGlobalShoppingOfflineLaunchDecisionScenarios(input) {
    const safe = obj(input);
    const providerOfflineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const providerCertificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const sandboxActivationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const providerOfflineReleaseViewModelSummary = resolveSummary(safe, "providerOfflineReleaseViewModelSummary", "WeishanGlobalShoppingProviderOfflineReleaseViewModel", "buildGlobalShoppingProviderOfflineReleaseViewModel");
    return clone([
      scenario("offline_release_gate", "Offline Release Gate", present(providerOfflineReleaseGateSummary) ? providerOfflineReleaseGateSummary.status : "needs_review", labelOf(providerOfflineReleaseGateSummary, "离线发布闸门仍需复核"), "只展示离线发布闸门，不创建 release。"),
      scenario("certification_freeze_ledger", "Certification Freeze Ledger", present(providerCertificationFreezeLedgerSummary) ? providerCertificationFreezeLedgerSummary.status : "needs_review", labelOf(providerCertificationFreezeLedgerSummary, "认证冻结仍需复核"), "只展示冻结台账，不持久化台账。"),
      scenario("activation_review_packet", "Activation Review Packet", present(sandboxActivationReviewPacketSummary) ? sandboxActivationReviewPacketSummary.status : "needs_review", labelOf(sandboxActivationReviewPacketSummary, "Sandbox 激活复核仍需复核"), "只展示激活复核，不激活 sandbox。"),
      scenario("boundary_diff_inspector", "Boundary Diff Inspector", present(adapterBoundaryDiffInspectorSummary) ? adapterBoundaryDiffInspectorSummary.status : "needs_review", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核"), "只展示边界差异，不修改配置。"),
      scenario("offline_release_view_model", "Offline Release View Model", present(providerOfflineReleaseViewModelSummary) ? providerOfflineReleaseViewModelSummary.status : "needs_review", labelOf(providerOfflineReleaseViewModelSummary, "Provider 离线发布闸门与激活复核仍需复核"), "只展示只读视图，不创建 tag、不 push。")
    ]);
  }

  function buildGlobalShoppingOfflineLaunchDecisionRows(input) {
    const safe = obj(input);
    const decisionScenarios = toArray(safe.decisionScenarios).length ? toArray(safe.decisionScenarios) : buildGlobalShoppingOfflineLaunchDecisionScenarios(safe);
    return clone([
      row("offline_launch_decision_simulator_status", "Offline Launch Decision Simulator 状态", obj(safe.userFacingSummary).resultLabel || "离线发布决策仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_launch_decision_simulator_boundary", "离线发布决策边界", "该模拟器只展示离线发布决策准备状态，不保存真实决策，不创建 release，不 push，不接真实 provider。", "pass")
    ].concat(decisionScenarios.map(function (item) {
      return row(item.scenarioId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineLaunchDecisionSimulator(input) {
    const safe = obj(input);
    const decisionScenarios = buildGlobalShoppingOfflineLaunchDecisionScenarios(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedScenarios = decisionScenarios.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewScenarios = decisionScenarios.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedScenarios.length ? "blocked" : (needsReviewScenarios.length ? "needs_review" : "ready");
    const result = {
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_VERSION,
      status:status,
      decisionBoundary:{
        simulatorId:"global-shopping-offline-launch-decision-simulator",
        simulatorMode:"simulator_only",
        simulatorOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistRealDecision:false,
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
      decisionSummary:{
        hasOfflineReleaseGate:decisionScenarios[0].status !== "needs_review",
        hasCertificationFreezeLedger:decisionScenarios[1].status !== "needs_review",
        hasActivationReviewPacket:decisionScenarios[2].status !== "needs_review",
        hasBoundaryDiffInspector:decisionScenarios[3].status !== "needs_review",
        hasOfflineReleaseViewModel:decisionScenarios[4].status !== "needs_review",
        decisionScenarioCount:decisionScenarios.length,
        hardBlockerCount:directBlockedReasons.length + blockedScenarios.length,
        needsReviewDecisionCount:needsReviewScenarios.length,
        readyForActivationReceiptLedger:status === "ready",
        humanLaunchDecisionRequired:true
      },
      decisionScenarios:decisionScenarios,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedScenarios.map(function (item) { return item.scenarioId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Launch Decision Simulator",
        resultLabel:status === "ready" ? "离线发布决策模拟器已准备" : (status === "blocked" ? "离线发布决策已阻断" : "离线发布决策仍需复核"),
        caveat:"该模拟器只展示离线发布决策准备状态，不保存真实决策，不创建 release，不 push，不接真实 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineLaunchDecisionRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineLaunchDecisionSimulatorAuditDraft(input) {
    const simulator = buildGlobalShoppingOfflineLaunchDecisionSimulator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_AUDIT_DRAFT",
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_VERSION,
      status:simulator.status,
      decisionScenarioCount:obj(simulator.decisionSummary).decisionScenarioCount || 0,
      hardBlockerCount:obj(simulator.decisionSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingOfflineLaunchDecisionSimulator(simulator) {
    return evaluateGlobalShoppingOfflineLaunchDecisionSimulator(simulator || {});
  }

  function buildGlobalShoppingOfflineLaunchDecisionSimulator(input) {
    try {
      return evaluateGlobalShoppingOfflineLaunchDecisionSimulator(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineLaunchDecisionSimulator({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineLaunchDecisionSimulator = {
    GLOBAL_SHOPPING_OFFLINE_LAUNCH_DECISION_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    buildGlobalShoppingOfflineLaunchDecisionSimulator,
    evaluateGlobalShoppingOfflineLaunchDecisionSimulator,
    buildGlobalShoppingOfflineLaunchDecisionRows,
    buildGlobalShoppingOfflineLaunchDecisionScenarios,
    buildGlobalShoppingOfflineLaunchDecisionSimulatorAuditDraft,
    sanitizeGlobalShoppingOfflineLaunchDecisionSimulator
  };
})();
