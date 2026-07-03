;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_ACTIVATION_WAR_ROOM_VERSION = "4.1.5";
  const ROOM_NAME = "global_shopping_offline_activation_war_room_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|war_room_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "war_room_only"; }
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
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
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
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistWarRoomState === true ? "war_room_state_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineActivationWarRoomPanels(input) {
    const safe = obj(input);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const offlineProviderReadinessDecisionMatrixSummary = resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix");
    const sandboxActivationFinalReviewBoardSummary = resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    const adapterLaunchBoundaryVerifierSummary = resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    return clone([
      panel("provider_final_safety_seal", "Provider Final Safety Seal", present(providerFinalSafetySealSummary) ? providerFinalSafetySealSummary.status : "needs_review", labelOf(providerFinalSafetySealSummary, "Safety Seal 仍需复核"), "Safety Seal 不生成真实证书、不写文件。"),
      panel("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核"), "No-Activation Guarantee 不修改配置、不执行真实阻断。"),
      panel("offline_provider_readiness_decision_matrix", "Offline Provider Readiness Decision Matrix", present(offlineProviderReadinessDecisionMatrixSummary) ? offlineProviderReadinessDecisionMatrixSummary.status : "needs_review", labelOf(offlineProviderReadinessDecisionMatrixSummary, "Decision Matrix 仍需复核"), "Decision Matrix 不创建 release、不 push。"),
      panel("sandbox_activation_final_review_board", "Sandbox Activation Final Review Board", present(sandboxActivationFinalReviewBoardSummary) ? sandboxActivationFinalReviewBoardSummary.status : "needs_review", labelOf(sandboxActivationFinalReviewBoardSummary, "Activation Final Review 仍需复核"), "Activation War Room 不激活 sandbox、不启用 provider。"),
      panel("adapter_launch_boundary_verifier", "Adapter Launch Boundary Verifier", present(adapterLaunchBoundaryVerifierSummary) ? adapterLaunchBoundaryVerifierSummary.status : "needs_review", labelOf(adapterLaunchBoundaryVerifierSummary, "Boundary Verifier 仍需复核"), "Activation War Room 不修改配置、不创建 provider client。")
    ]);
  }

  function buildGlobalShoppingOfflineActivationWarRoomRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.roomPanels).length ? toArray(safe.roomPanels) : buildGlobalShoppingOfflineActivationWarRoomPanels(safe);
    return clone([
      row("offline_activation_war_room_status", "Offline Activation War Room", obj(safe.userFacingSummary).resultLabel || "Offline Activation War Room 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_activation_war_room_boundary", "Activation War Room 边界", "该 War Room 只展示离线激活作战室状态，不激活 sandbox、不启用 provider、不改配置。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineActivationWarRoom(input) {
    const safe = obj(input);
    const roomPanels = buildGlobalShoppingOfflineActivationWarRoomPanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = roomPanels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewPanels = roomPanels.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ACTIVATION_WAR_ROOM_VERSION,
      status:status,
      roomMode:safeMode(safe.roomMode),
      roomBoundary:{
        warRoomOnly:true,
        offlineMock:true,
        readOnly:true,
        canActivateSandbox:false,
        canStartProvider:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canModifyRuntimeConfig:false,
        canWriteFile:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistWarRoomState:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      roomSummary:{
        hasFinalSafetySeal:present(resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal")),
        hasActivationBlocker:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasDecisionMatrix:present(resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix")),
        hasActivationFinalReviewBoard:present(resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard")),
        hasBoundaryVerifier:present(resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier")),
        roomPanelCount:roomPanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        blockedPanelCount:directBlockedReasons.length + blockedPanels.length,
        readyForReadinessCertificate:status === "ready",
        humanFinalSafetyReviewRequired:true
      },
      roomPanels:roomPanels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Activation War Room",
        resultLabel:status === "ready" ? "Offline Activation War Room 已准备" : (status === "blocked" ? "Offline Activation War Room 已阻断" : "Offline Activation War Room 仍需复核"),
        caveat:"该 War Room 只展示离线激活作战室状态，不激活 sandbox、不启用 provider、不改配置。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineActivationWarRoomRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineActivationWarRoomAuditDraft(input) {
    const room = buildGlobalShoppingOfflineActivationWarRoom(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_ACTIVATION_WAR_ROOM_AUDIT_DRAFT",
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ACTIVATION_WAR_ROOM_VERSION,
      status:room.status,
      roomPanelCount:obj(room.roomSummary).roomPanelCount || 0,
      blockedPanelCount:obj(room.roomSummary).blockedPanelCount || 0,
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

  function sanitizeGlobalShoppingOfflineActivationWarRoom(room) {
    return evaluateGlobalShoppingOfflineActivationWarRoom(room || {});
  }

  function buildGlobalShoppingOfflineActivationWarRoom(input) {
    try {
      return evaluateGlobalShoppingOfflineActivationWarRoom(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineActivationWarRoom({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineActivationWarRoom = {
    GLOBAL_SHOPPING_OFFLINE_ACTIVATION_WAR_ROOM_VERSION,
    ROOM_NAME,
    buildGlobalShoppingOfflineActivationWarRoom,
    evaluateGlobalShoppingOfflineActivationWarRoom,
    buildGlobalShoppingOfflineActivationWarRoomRows,
    buildGlobalShoppingOfflineActivationWarRoomPanels,
    buildGlobalShoppingOfflineActivationWarRoomAuditDraft,
    sanitizeGlobalShoppingOfflineActivationWarRoom
  };
})();
