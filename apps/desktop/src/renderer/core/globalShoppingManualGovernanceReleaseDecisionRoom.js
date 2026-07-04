;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION = "4.2.0";
  const ROOM_NAME = "global_shopping_manual_governance_release_decision_room_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function gate(gateId, label, status, severity, ownerRole, summary, caveat) {
    return {
      gateId:text(gateId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      severity:/^(hard_blocker|review_required|info)$/.test(severity) ? severity : "review_required",
      ownerRole:text(ownerRole || "human_reviewer"),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
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
    }, obj(overrides));
  }
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear") return "pass";
    return "warning";
  }

  function buildGlobalShoppingManualGovernanceReleaseDecisionGates(input) {
    const safe = obj(input);
    const governanceAuditConsoleSummary = resolveSummary(safe, "governanceAuditConsoleSummary", "WeishanGlobalShoppingProviderGovernanceAuditConsole", "buildGlobalShoppingProviderGovernanceAuditConsole");
    const humanPilotReadinessLedgerSummary = resolveSummary(safe, "humanPilotReadinessLedgerSummary", "WeishanGlobalShoppingHumanPilotReadinessLedger", "buildGlobalShoppingHumanPilotReadinessLedger");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const governanceReleaseViewModelSummary = resolveSummary(safe, "governanceReleaseViewModelSummary", "WeishanGlobalShoppingProviderGovernanceReleaseViewModel", "buildGlobalShoppingProviderGovernanceReleaseViewModel");

    return clone([
      gate("governance_audit_console", "Governance Audit Console", normalize(governanceAuditConsoleSummary), "review_required", "operator", labelOf(governanceAuditConsoleSummary, "治理审计仍需复核"), "只展示治理审计，不保存发布决策。"),
      gate("human_pilot_readiness_ledger", "Human Pilot Readiness Ledger", normalize(humanPilotReadinessLedgerSummary), "review_required", "release_manager", labelOf(humanPilotReadinessLedgerSummary, "Human Pilot 准备仍需复核"), "只展示人工准备，不创建审批任务。"),
      gate("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "hard_blocker", "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不改 git。"),
      gate("governance_release_view_model", "Governance Release View Model", normalize(governanceReleaseViewModelSummary), "info", "qa", text(governanceReleaseViewModelSummary.title || "Provider Governance 发布审计与冻结闸门"), "只展示视图摘要，不创建 release。")
    ]);
  }

  function buildGlobalShoppingManualGovernanceReleaseDecisionRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.decisionGates) ? {
      decisionGates:safe.decisionGates.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingManualGovernanceReleaseDecisionRoom(input);
    return clone([
      row("manual_release_status", "人工发布决策状态", obj(evaluation.userFacingSummary).resultLabel || "人工发布决策仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("manual_release_boundary", "决策边界", "不保存决策，不创建 release，不创建 tag，不 push。", "pass"),
      row("manual_release_runtime", "运行边界", "不改 git，不改配置，不启动 pilot / provider，不读 key，不联网。", "pass")
    ].concat(toArray(evaluation.decisionGates).map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingManualGovernanceReleaseDecisionRoom(input) {
    const safe = obj(input);
    const decisionGates = buildGlobalShoppingManualGovernanceReleaseDecisionGates(safe);
    const blockedBoundary = safe.persistDecision === true || safe.createRelease === true || safe.createTag === true || safe.push === true ||
      safe.modifyGit === true || safe.modifyRuntimeConfig === true || safe.startPilot === true || safe.startRealProvider === true ||
      safe.enableProvider === true || safe.readApiKey === true || safe.network === true || safe.generateEndpoint === true || safe.openExternalNow === true;
    const hardBlockers = decisionGates.filter(function (item) { return item.status === "blocked"; });
    const reviewGates = decisionGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || hardBlockers.length ? "blocked" : (reviewGates.length ? "needs_review" : "ready");
    const decisionSummary = {
      hasGovernanceAuditConsole:decisionGates[0].status !== "needs_review",
      hasHumanPilotReadinessLedger:decisionGates[1].status !== "needs_review",
      hasReleaseFreezeGate:decisionGates[2].status !== "needs_review",
      hasGovernanceReleaseViewModel:decisionGates[3].status !== "needs_review",
      decisionGateCount:decisionGates.length,
      hardBlockerCount:hardBlockers.length,
      needsReviewGateCount:reviewGates.length,
      readyForExceptionRegister:status === "ready",
      manualDecisionStillRequired:true
    };
    return clone({
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION,
      status:status,
      decisionBoundary:{
        roomId:"global-shopping-manual-governance-release-decision-room",
        roomMode:"decision_room_only",
        decisionRoomOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistDecision:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false
      },
      decisionSummary:decisionSummary,
      decisionGates:decisionGates,
      decisionHealth:{
        noDecisionPersistence:safe.persistDecision !== true,
        noReleaseCreation:safe.createRelease !== true,
        noTagCreation:safe.createTag !== true,
        noPush:safe.push !== true,
        noGitModification:safe.modifyGit !== true,
        noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
        noPilotStart:safe.startPilot !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noEndpointGeneration:safe.generateEndpoint !== true,
        noExternalOpen:safe.openExternalNow !== true,
        manualDecisionStillRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingManualGovernanceReleaseDecisionRows({
        decisionGates:decisionGates,
        userFacingSummary:{
          resultLabel:status === "ready" ? "人工发布决策室已准备" : (status === "blocked" ? "人工发布决策已阻断" : "人工发布决策仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.persistDecision === true ? "decision_persistence_detected" : "",
          safe.createRelease === true ? "release_creation_detected" : "",
          safe.createTag === true ? "tag_creation_detected" : "",
          safe.push === true ? "push_detected" : "",
          safe.modifyGit === true ? "git_modification_detected" : "",
          safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : "",
          safe.startPilot === true ? "pilot_start_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
          safe.openExternalNow === true ? "external_open_detected" : ""
        ].filter(Boolean) : [])
        .concat(hardBlockers.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Manual Governance Release 决策室",
        resultLabel:status === "ready" ? "人工发布决策室已准备" : (status === "blocked" ? "人工发布决策已阻断" : "人工发布决策仍需复核"),
        caveat:"该决策室只展示人工发布决策准备状态，不保存决策，不创建 release，不创建 tag，不 push。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingManualGovernanceReleaseDecisionRoomAuditDraft(input) {
    const room = evaluateGlobalShoppingManualGovernanceReleaseDecisionRoom(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_AUDIT_DRAFT",
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION,
      status:room.status,
      decisionGateCount:obj(room.decisionSummary).decisionGateCount || 0,
      hardBlockerCount:obj(room.decisionSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingManualGovernanceReleaseDecisionRoom(room) {
    return evaluateGlobalShoppingManualGovernanceReleaseDecisionRoom(room || {});
  }

  function buildGlobalShoppingManualGovernanceReleaseDecisionRoom(input) {
    try {
      return sanitizeGlobalShoppingManualGovernanceReleaseDecisionRoom(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualGovernanceReleaseDecisionRoom({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom = {
    GLOBAL_SHOPPING_MANUAL_GOVERNANCE_RELEASE_DECISION_ROOM_VERSION,
    ROOM_NAME,
    buildGlobalShoppingManualGovernanceReleaseDecisionRoom,
    evaluateGlobalShoppingManualGovernanceReleaseDecisionRoom,
    buildGlobalShoppingManualGovernanceReleaseDecisionRows,
    buildGlobalShoppingManualGovernanceReleaseDecisionGates,
    buildGlobalShoppingManualGovernanceReleaseDecisionRoomAuditDraft,
    sanitizeGlobalShoppingManualGovernanceReleaseDecisionRoom
  };
})();
