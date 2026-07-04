;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION = "4.2.4";
  const CENTER_NAME = "global_shopping_read_only_sandbox_activation_readiness_center_v1";

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

  function buildGlobalShoppingSandboxActivationReadinessGates(input) {
    const safe = obj(input);
    const manualGovernanceReleaseDecisionRoomSummary = resolveSummary(safe, "manualGovernanceReleaseDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const sandboxPilotExceptionRegisterSummary = resolveSummary(safe, "sandboxPilotExceptionRegisterSummary", "WeishanGlobalShoppingSandboxPilotExceptionRegister", "buildGlobalShoppingSandboxPilotExceptionRegister");
    const providerReadinessSignOffPacketSummary = resolveSummary(safe, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    const providerManualReleaseViewModelSummary = resolveSummary(safe, "providerManualReleaseViewModelSummary", "WeishanGlobalShoppingProviderManualReleaseViewModel", "buildGlobalShoppingProviderManualReleaseViewModel");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const humanPilotReadinessLedgerSummary = resolveSummary(safe, "humanPilotReadinessLedgerSummary", "WeishanGlobalShoppingHumanPilotReadinessLedger", "buildGlobalShoppingHumanPilotReadinessLedger");
    const governanceAuditConsoleSummary = resolveSummary(safe, "governanceAuditConsoleSummary", "WeishanGlobalShoppingProviderGovernanceAuditConsole", "buildGlobalShoppingProviderGovernanceAuditConsole");
    return clone([
      gate("manual_decision_room", "Manual Governance Release 决策室", normalize(manualGovernanceReleaseDecisionRoomSummary), "review_required", "release_manager", labelOf(manualGovernanceReleaseDecisionRoomSummary, "人工发布决策仍需复核"), "只展示人工发布决策状态，不执行激活。"),
      gate("exception_register", "Sandbox Pilot 例外登记簿", normalize(sandboxPilotExceptionRegisterSummary), "review_required", "operator", labelOf(sandboxPilotExceptionRegisterSummary, "例外登记仍需复核"), "只展示例外状态，不启动 pilot。"),
      gate("readiness_signoff_packet", "Provider 准备签核包", normalize(providerReadinessSignOffPacketSummary), "review_required", "security", labelOf(providerReadinessSignOffPacketSummary, "准备签核仍需复核"), "只读签核摘要，不创建 release。"),
      gate("manual_release_view_model", "Provider 人工发布决策与签核", normalize(providerManualReleaseViewModelSummary), "info", "qa", text(providerManualReleaseViewModelSummary.title || "Provider 人工发布决策与签核"), "只展示视图摘要，不 push。"),
      gate("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "hard_blocker", "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不改 git。"),
      gate("human_pilot_readiness_ledger", "Human Pilot 准备台账", normalize(humanPilotReadinessLedgerSummary), "review_required", "operator", labelOf(humanPilotReadinessLedgerSummary, "Human Pilot 准备仍需复核"), "只展示人工准备，不启用 provider。"),
      gate("governance_audit_console", "Provider Governance 审计控制台", normalize(governanceAuditConsoleSummary), "review_required", "security", labelOf(governanceAuditConsoleSummary, "治理审计仍需复核"), "只展示治理审计，不读 key。")
    ]);
  }

  function buildGlobalShoppingSandboxActivationReadinessRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.activationGates) ? {
      activationGates:safe.activationGates.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingReadOnlySandboxActivationReadinessCenter(input);
    return clone([
      row("sandbox_activation_status", "Sandbox 激活准备状态", obj(evaluation.userFacingSummary).resultLabel || "Sandbox 激活准备仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("sandbox_activation_boundary", "激活边界", "只展示 sandbox 激活准备度，不执行激活，不启动 pilot / provider。", "pass"),
      row("sandbox_activation_runtime", "运行边界", "不读 key，不联网，不生成 endpoint，不创建 release/tag，不 push。", "pass")
    ].concat(toArray(evaluation.activationGates).map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingReadOnlySandboxActivationReadinessCenter(input) {
    const safe = obj(input);
    const activationGates = buildGlobalShoppingSandboxActivationReadinessGates(safe);
    const blockedBoundary =
      safe.activateSandbox === true ||
      safe.startPilot === true ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternalNow === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.persistActivationState === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true ||
      safe.modifyGit === true ||
      safe.modifyRuntimeConfig === true;
    const hardBlockers = activationGates.filter(function (item) { return item.status === "blocked"; });
    const reviewGates = activationGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || hardBlockers.length ? "blocked" : (reviewGates.length ? "needs_review" : "ready");
    const activationSummary = {
      hasManualDecisionRoom:activationGates[0].status !== "needs_review",
      hasExceptionRegister:activationGates[1].status !== "needs_review",
      hasReadinessSignOffPacket:activationGates[2].status !== "needs_review",
      hasManualReleaseViewModel:activationGates[3].status !== "needs_review",
      hasReleaseFreezeGate:activationGates[4].status !== "needs_review",
      hasHumanPilotLedger:activationGates[5].status !== "needs_review",
      hasGovernanceAuditConsole:activationGates[6].status !== "needs_review",
      activationGateCount:activationGates.length,
      hardBlockerCount:hardBlockers.length,
      needsReviewGateCount:reviewGates.length,
      readyForOfflineMockSandboxSession:status === "ready",
      manualActivationStillRequired:true
    };
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION,
      status:status,
      activationBoundary:{
        centerId:"global-shopping-read-only-sandbox-activation-readiness-center",
        centerMode:"activation_readiness_only",
        readinessOnly:true,
        activationReadinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canActivateSandbox:false,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canPersistActivationState:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false
      },
      activationSummary:activationSummary,
      activationGates:activationGates,
      activationHealth:{
        noSandboxActivation:safe.activateSandbox !== true,
        noPilotStart:safe.startPilot !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noEndpointGeneration:safe.generateEndpoint !== true,
        noExternalOpen:safe.openExternalNow !== true && safe.openExternal !== true && safe.windowOpen !== true,
        noActivationStatePersistence:safe.persistActivationState !== true,
        noReleaseCreation:safe.createRelease !== true,
        noTagCreation:safe.createTag !== true,
        noPush:safe.push !== true,
        noGitModification:safe.modifyGit !== true,
        noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
        manualActivationStillRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingSandboxActivationReadinessRows({
        activationGates:activationGates,
        userFacingSummary:{
          resultLabel:status === "ready" ? "Sandbox 激活准备中心已准备" : (status === "blocked" ? "Sandbox 激活准备已阻断" : "Sandbox 激活准备仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.activateSandbox === true ? "sandbox_activation_detected" : "",
          safe.startPilot === true ? "pilot_start_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
          safe.openExternalNow === true || safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
          safe.persistActivationState === true ? "activation_state_persistence_detected" : "",
          safe.createRelease === true ? "release_creation_detected" : "",
          safe.createTag === true ? "tag_creation_detected" : "",
          safe.push === true ? "push_detected" : "",
          safe.modifyGit === true ? "git_modification_detected" : "",
          safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : ""
        ].filter(Boolean) : [])
        .concat(hardBlockers.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"只读 Sandbox 激活准备中心",
        resultLabel:status === "ready" ? "Sandbox 激活准备中心已准备" : (status === "blocked" ? "Sandbox 激活准备已阻断" : "Sandbox 激活准备仍需复核"),
        caveat:"该中心只展示 sandbox 激活准备度，不执行激活，不读取密钥，不联网，不生成 endpoint。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySandboxActivationReadinessCenterAuditDraft(input) {
    const center = buildGlobalShoppingReadOnlySandboxActivationReadinessCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION,
      status:center.status,
      activationGateCount:obj(center.activationSummary).activationGateCount || 0,
      hardBlockerCount:obj(center.activationSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingReadOnlySandboxActivationReadinessCenter(center) {
    return evaluateGlobalShoppingReadOnlySandboxActivationReadinessCenter(center || {});
  }

  function buildGlobalShoppingReadOnlySandboxActivationReadinessCenter(input) {
    try {
      return sanitizeGlobalShoppingReadOnlySandboxActivationReadinessCenter(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingReadOnlySandboxActivationReadinessCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter = {
    GLOBAL_SHOPPING_READ_ONLY_SANDBOX_ACTIVATION_READINESS_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingReadOnlySandboxActivationReadinessCenter,
    evaluateGlobalShoppingReadOnlySandboxActivationReadinessCenter,
    buildGlobalShoppingSandboxActivationReadinessRows,
    buildGlobalShoppingSandboxActivationReadinessGates,
    buildGlobalShoppingReadOnlySandboxActivationReadinessCenterAuditDraft,
    sanitizeGlobalShoppingReadOnlySandboxActivationReadinessCenter
  };
})();
