;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_VERSION = "4.1.6";
  const BOARD_NAME = "global_shopping_offline_provider_governance_closure_board_v1";

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
  function safeMode(value) { return /^(disabled|closure_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "closure_only"; }
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
      safe.persistGovernanceDecision === true ? "governance_decision_persistence_detected" : "",
      safe.persistRealDecision === true ? "real_decision_persistence_detected" : "",
      safe.persistReceipt === true ? "receipt_persistence_detected" : "",
      safe.persistEvidence === true ? "evidence_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.executeRealBlock === true ? "real_block_execution_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderGovernanceClosurePanels(input) {
    const safe = obj(input);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const offlineActivationWarRoomSummary = resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    const providerFinalSafetyViewModelSummary = resolveSummary(safe, "providerFinalSafetyViewModelSummary", "WeishanGlobalShoppingProviderFinalSafetyViewModel", "buildGlobalShoppingProviderFinalSafetyViewModel");
    return clone([
      panel("provider_final_safety_seal", "Provider Final Safety Seal", present(providerFinalSafetySealSummary) ? providerFinalSafetySealSummary.status : "needs_review", labelOf(providerFinalSafetySealSummary, "Provider Final Safety Seal 仍需复核"), "Governance Closure 不保存真实治理结论。"),
      panel("offline_activation_war_room", "Offline Activation War Room", present(offlineActivationWarRoomSummary) ? offlineActivationWarRoomSummary.status : "needs_review", labelOf(offlineActivationWarRoomSummary, "Offline Activation War Room 仍需复核"), "Activation War Room 不激活 sandbox、不启用 provider。"),
      panel("read_only_provider_readiness_certificate", "Read-Only Provider Readiness Certificate", present(readOnlyProviderReadinessCertificateSummary) ? readOnlyProviderReadinessCertificateSummary.status : "needs_review", labelOf(readOnlyProviderReadinessCertificateSummary, "Readiness Certificate 仍需复核"), "Readiness Certificate 不持久化证书。"),
      panel("provider_no_activation_guarantee_board", "Provider No-Activation Guarantee Board", present(providerNoActivationGuaranteeBoardSummary) ? providerNoActivationGuaranteeBoardSummary.status : "needs_review", labelOf(providerNoActivationGuaranteeBoardSummary, "No-Activation Guarantee 仍需复核"), "No-Activation Guarantee 不修改配置、不执行真实阻断。"),
      panel("provider_final_safety_view_model", "Provider Final Safety Review", present(providerFinalSafetyViewModelSummary) ? providerFinalSafetyViewModelSummary.status : "needs_review", labelOf(providerFinalSafetyViewModelSummary, "Provider Final Safety Review 仍需复核"), "Human governance closure review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingOfflineProviderGovernanceClosureRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.closurePanels).length ? toArray(safe.closurePanels) : buildGlobalShoppingOfflineProviderGovernanceClosurePanels(safe);
    return clone([
      row("offline_provider_governance_closure_board_status", "Offline Provider Governance Closure Board", obj(safe.userFacingSummary).resultLabel || "Offline Provider Governance Closure Board 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_provider_governance_closure_board_boundary", "Governance Closure 边界", "该 Board 只展示离线治理闭环状态，不保存真实治理结论、不保存真实决策、不保存真实回执。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineProviderGovernanceClosureBoard(input) {
    const safe = obj(input);
    const closurePanels = buildGlobalShoppingOfflineProviderGovernanceClosurePanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = closurePanels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewPanels = closurePanels.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_VERSION,
      status:status,
      boardMode:safeMode(safe.boardMode),
      closureBoundary:{
        closureOnly:true,
        offlineMock:true,
        readOnly:true,
        canPersistGovernanceDecision:false,
        canPersistRealDecision:false,
        canPersistReceipt:false,
        canPersistEvidence:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canExecuteRealBlock:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false
      },
      closureSummary:{
        hasFinalSafetySeal:present(resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal")),
        hasActivationWarRoom:present(resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom")),
        hasReadinessCertificate:present(resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate")),
        hasNoActivationGuarantee:present(resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard")),
        hasFinalSafetyViewModel:present(resolveSummary(safe, "providerFinalSafetyViewModelSummary", "WeishanGlobalShoppingProviderFinalSafetyViewModel", "buildGlobalShoppingProviderFinalSafetyViewModel")),
        closurePanelCount:closurePanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        blockedPanelCount:directBlockedReasons.length + blockedPanels.length,
        readyForNoActivationComplianceSeal:status === "ready",
        humanGovernanceClosureReviewRequired:true
      },
      closurePanels:closurePanels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Provider Governance Closure Board",
        resultLabel:status === "ready" ? "Offline Provider Governance Closure Board 已准备" : (status === "blocked" ? "Offline Provider Governance Closure Board 已阻断" : "Offline Provider Governance Closure Board 仍需复核"),
        caveat:"该 Board 只展示离线治理闭环状态，不保存真实治理结论、不保存真实决策、不保存真实回执。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineProviderGovernanceClosureRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineProviderGovernanceClosureBoardAuditDraft(input) {
    const board = buildGlobalShoppingOfflineProviderGovernanceClosureBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_VERSION,
      status:board.status,
      closurePanelCount:obj(board.closureSummary).closurePanelCount || 0,
      blockedPanelCount:obj(board.closureSummary).blockedPanelCount || 0,
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

  function sanitizeGlobalShoppingOfflineProviderGovernanceClosureBoard(board) {
    return evaluateGlobalShoppingOfflineProviderGovernanceClosureBoard(board || {});
  }

  function buildGlobalShoppingOfflineProviderGovernanceClosureBoard(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderGovernanceClosureBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderGovernanceClosureBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_GOVERNANCE_CLOSURE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineProviderGovernanceClosureBoard,
    evaluateGlobalShoppingOfflineProviderGovernanceClosureBoard,
    buildGlobalShoppingOfflineProviderGovernanceClosureRows,
    buildGlobalShoppingOfflineProviderGovernanceClosurePanels,
    buildGlobalShoppingOfflineProviderGovernanceClosureBoardAuditDraft,
    sanitizeGlobalShoppingOfflineProviderGovernanceClosureBoard
  };
})();
