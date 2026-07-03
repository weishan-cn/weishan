;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_VERSION = "4.0.8";
  const SIMULATOR_NAME = "global_shopping_final_readiness_handoff_simulator_v1";

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
  function safeMode(value) { return /^(disabled|handoff_simulator_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "handoff_simulator_only"; }
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
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      handoffStored:false,
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
      safe.executeRealHandoff === true ? "real_handoff_detected" : "",
      safe.persistHandoffResult === true ? "handoff_result_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.createTask === true ? "task_creation_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingFinalReadinessHandoffScenarios(input) {
    const safe = obj(input);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const manualProviderActivationHandoffPacketSummary = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    return clone([
      scenario("offline_provider_governance_closure_board", "Offline Provider Governance Closure Board", present(offlineProviderGovernanceClosureBoardSummary) ? offlineProviderGovernanceClosureBoardSummary.status : "needs_review", labelOf(offlineProviderGovernanceClosureBoardSummary, "Governance Closure Board 仍需复核"), "Governance Closure 不保存真实治理结论。"),
      scenario("no_activation_compliance_seal", "No-Activation Compliance Seal", present(noActivationComplianceSealSummary) ? noActivationComplianceSealSummary.status : "needs_review", labelOf(noActivationComplianceSealSummary, "No-Activation Compliance Seal 仍需复核"), "No-Activation Seal 不生成真实封条、不执行真实阻断。"),
      scenario("read_only_provider_readiness_certificate", "Read-Only Provider Readiness Certificate", present(readOnlyProviderReadinessCertificateSummary) ? readOnlyProviderReadinessCertificateSummary.status : "needs_review", labelOf(readOnlyProviderReadinessCertificateSummary, "Readiness Certificate 仍需复核"), "Readiness Certificate 不持久化证书。"),
      scenario("manual_provider_activation_handoff_packet", "Manual Provider Activation Handoff Packet", present(manualProviderActivationHandoffPacketSummary) ? manualProviderActivationHandoffPacketSummary.status : "needs_review", labelOf(manualProviderActivationHandoffPacketSummary, "Manual Provider Activation Handoff Packet 仍需复核"), "Final Handoff 不执行真实交接。"),
      scenario("final_offline_launch_review_console", "Final Offline Launch Review Console", present(finalOfflineLaunchReviewConsoleSummary) ? finalOfflineLaunchReviewConsoleSummary.status : "needs_review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Offline Launch Review Console 仍需复核"), "Final Handoff 不创建 release、不 push。")
    ]);
  }

  function buildGlobalShoppingFinalReadinessHandoffRows(input) {
    const safe = obj(input);
    const scenarios = toArray(safe.handoffScenarios).length ? toArray(safe.handoffScenarios) : buildGlobalShoppingFinalReadinessHandoffScenarios(safe);
    return clone([
      row("final_readiness_handoff_simulator_status", "Final Readiness Handoff Simulator", obj(safe.userFacingSummary).resultLabel || "Final Readiness Handoff Simulator 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_readiness_handoff_simulator_boundary", "Final Handoff 边界", "该 Simulator 只展示最终准备交接模拟，不执行真实交接、不保存 handoff result。", "pass")
    ].concat(scenarios.map(function (item) {
      return row(item.scenarioId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingFinalReadinessHandoffSimulator(input) {
    const safe = obj(input);
    const handoffScenarios = buildGlobalShoppingFinalReadinessHandoffScenarios(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedScenarios = handoffScenarios.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewScenarios = handoffScenarios.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedScenarios.length ? "blocked" : (needsReviewScenarios.length ? "needs_review" : "ready");
    const result = {
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_VERSION,
      status:status,
      simulatorMode:safeMode(safe.simulatorMode),
      handoffBoundary:{
        handoffSimulatorOnly:true,
        offlineMock:true,
        readOnly:true,
        canExecuteRealHandoff:false,
        canPersistHandoffResult:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCreateTask:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      handoffSummary:{
        hasGovernanceClosureBoard:present(resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard")),
        hasNoActivationComplianceSeal:present(resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal")),
        hasReadinessCertificate:present(resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate")),
        hasManualActivationHandoffPacket:present(resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket")),
        hasFinalOfflineLaunchReviewConsole:present(resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole")),
        handoffScenarioCount:handoffScenarios.length,
        needsReviewScenarioCount:needsReviewScenarios.length,
        blockedScenarioCount:directBlockedReasons.length + blockedScenarios.length,
        readyForClosureEvidenceLedger:status === "ready",
        humanGovernanceClosureReviewRequired:true
      },
      handoffScenarios:handoffScenarios,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedScenarios.map(function (item) { return item.scenarioId + "_blocked"; })),
      userFacingSummary:{
        title:"Final Readiness Handoff Simulator",
        resultLabel:status === "ready" ? "Final Readiness Handoff Simulator 已准备" : (status === "blocked" ? "Final Readiness Handoff Simulator 已阻断" : "Final Readiness Handoff Simulator 仍需复核"),
        caveat:"该 Simulator 只展示最终准备交接模拟，不执行真实交接、不保存 handoff result。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingFinalReadinessHandoffRows(result);
    return clone(result);
  }

  function buildGlobalShoppingFinalReadinessHandoffSimulatorAuditDraft(input) {
    const simulator = buildGlobalShoppingFinalReadinessHandoffSimulator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_AUDIT_DRAFT",
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_VERSION,
      status:simulator.status,
      handoffScenarioCount:obj(simulator.handoffSummary).handoffScenarioCount || 0,
      blockedScenarioCount:obj(simulator.handoffSummary).blockedScenarioCount || 0,
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

  function sanitizeGlobalShoppingFinalReadinessHandoffSimulator(simulator) {
    return evaluateGlobalShoppingFinalReadinessHandoffSimulator(simulator || {});
  }

  function buildGlobalShoppingFinalReadinessHandoffSimulator(input) {
    try {
      return evaluateGlobalShoppingFinalReadinessHandoffSimulator(input || {});
    } catch (_) {
      return evaluateGlobalShoppingFinalReadinessHandoffSimulator({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalReadinessHandoffSimulator = {
    GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    buildGlobalShoppingFinalReadinessHandoffSimulator,
    evaluateGlobalShoppingFinalReadinessHandoffSimulator,
    buildGlobalShoppingFinalReadinessHandoffRows,
    buildGlobalShoppingFinalReadinessHandoffScenarios,
    buildGlobalShoppingFinalReadinessHandoffSimulatorAuditDraft,
    sanitizeGlobalShoppingFinalReadinessHandoffSimulator
  };
})();
