;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION = "4.2.7";
  const ROOM_NAME = "global_shopping_provider_sandbox_pilot_control_room_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
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
  function panel(panelId, label, summary, ownerRole, caveat) {
    const safe = obj(summary);
    const status = statusOf(safe);
    return {
      panelId:text(panelId),
      label:text(label),
      status:status === "ready" ? "pass" : (status === "blocked" || status === "failed_safe" || status === "fail" ? "blocked" : (Object.keys(safe).length ? "warning" : "needs_review")),
      ownerRole:text(ownerRole || "human_reviewer"),
      summary:text(obj(safe.userFacingSummary).resultLabel || safe.title || safe.roomName || safe.viewModelName || safe.drillName || safe.matrixName || safe.boardName || safe.runtimeName || "仍需复核"),
      caveat:text(caveat || ""),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function evaluateGlobalShoppingProviderSandboxPilotControlRoom(input) {
    const safe = obj(input);
    const humanApprovalSimulationGateSummary = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", safe);
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", safe);
    const sandboxProviderRollbackPlanSummary = resolveSummary(safe, "sandboxProviderRollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", safe);
    const providerLaunchSimulationViewModelSummary = resolveSummary(safe, "providerLaunchSimulationViewModelSummary", "WeishanGlobalShoppingProviderLaunchSimulationViewModel", "buildGlobalShoppingProviderLaunchSimulationViewModel", safe);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", safe);
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", safe);

    const controlPanels = [
      panel("human_approval_simulation", "人工审批模拟闸门", humanApprovalSimulationGateSummary, "legal_security", "不创建审批任务，不发邮件。"),
      panel("mock_provider_launch_drill", "Mock Provider 启动演练", mockProviderLaunchDrillSummary, "commerce_engineering", "不启动真实 provider，不联网。"),
      panel("sandbox_provider_rollback_plan", "Sandbox Provider 回滚预案", sandboxProviderRollbackPlanSummary, "release_manager", "只展示预案，不执行回滚。"),
      panel("provider_launch_simulation_view_model", "Provider 启动模拟视图", providerLaunchSimulationViewModelSummary, "operator", "只展示 mock / readiness 信息。"),
      panel("provider_launch_readiness_board", "Provider 启动准备总闸门", providerLaunchReadinessBoardSummary, "commerce_engineering", "不启用 production provider。"),
      panel("provider_contract_replay_harness", "Provider 合同回放器", providerContractReplayHarnessSummary, "qa_security", "只回放脱敏合同样本。"),
      panel("mock_provider_adapter_registry_runtime", "Mock Provider Adapter 注册运行时", mockProviderAdapterRegistryRuntimeSummary, "adapter_ops", "只允许 mock / dry_run / readiness_only。")
    ];

    const controlHealth = {
      noRealProviderStart:safe.startRealProvider !== true && safe.canStartRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true && safe.canEnableProvider !== true,
      noApiKeyRead:safe.readApiKey !== true && safe.canReadApiKey !== true,
      noNetworkCall:safe.network !== true && safe.canCallNetwork !== true,
      noEndpointGeneration:safe.generateEndpoint !== true && safe.canGenerateEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.canOpenExternalNow !== true,
      noPilotStatePersistence:safe.persistPilotState !== true && safe.canPersistPilotState !== true,
      noApprovalTaskCreation:safe.createApprovalTask !== true && safe.canCreateApprovalTask !== true,
      noEmailSend:safe.sendEmail !== true && safe.canSendEmail !== true,
      noCheckoutPaymentTicketingOrder:
        safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true &&
        !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      realPilotStillRequiresHumanApproval:true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };

    const blocked = controlPanels.some(function (item) { return item.status === "blocked"; }) ||
      !controlHealth.noRealProviderStart ||
      !controlHealth.noProviderEnablement ||
      !controlHealth.noApiKeyRead ||
      !controlHealth.noNetworkCall ||
      !controlHealth.noEndpointGeneration ||
      !controlHealth.noExternalOpen ||
      !controlHealth.noPilotStatePersistence ||
      !controlHealth.noApprovalTaskCreation ||
      !controlHealth.noEmailSend ||
      !controlHealth.noCheckoutPaymentTicketingOrder;
    const needsReview = controlPanels.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });

    const controlSummary = {
      hasHumanApprovalSimulationGate:Object.keys(humanApprovalSimulationGateSummary).length > 0,
      hasMockProviderLaunchDrill:Object.keys(mockProviderLaunchDrillSummary).length > 0,
      hasRollbackPlan:Object.keys(sandboxProviderRollbackPlanSummary).length > 0,
      hasLaunchSimulationViewModel:Object.keys(providerLaunchSimulationViewModelSummary).length > 0,
      hasLaunchReadinessBoard:Object.keys(providerLaunchReadinessBoardSummary).length > 0,
      hasContractReplayHarness:Object.keys(providerContractReplayHarnessSummary).length > 0,
      hasMockAdapterRegistryRuntime:Object.keys(mockProviderAdapterRegistryRuntimeSummary).length > 0,
      controlPanelCount:controlPanels.length,
      blockedControlCount:controlPanels.filter(function (item) { return item.status === "blocked"; }).length,
      needsReviewControlCount:controlPanels.filter(function (item) { return item.status === "warning" || item.status === "needs_review"; }).length,
      readyForMockIncidentDrill:false,
      realPilotStillRequiresHumanApproval:true
    };
    controlSummary.readyForMockIncidentDrill =
      controlSummary.hasHumanApprovalSimulationGate &&
      controlSummary.hasMockProviderLaunchDrill &&
      controlSummary.hasRollbackPlan &&
      controlSummary.hasLaunchSimulationViewModel &&
      controlSummary.hasLaunchReadinessBoard &&
      controlSummary.hasContractReplayHarness &&
      controlSummary.hasMockAdapterRegistryRuntime &&
      controlSummary.blockedControlCount === 0 &&
      controlSummary.needsReviewControlCount === 0;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      humanApprovalSimulationGateSummary:clone(humanApprovalSimulationGateSummary),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:clone(sandboxProviderRollbackPlanSummary),
      providerLaunchSimulationViewModelSummary:clone(providerLaunchSimulationViewModelSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockProviderAdapterRegistryRuntimeSummary),
      controlSummary:controlSummary,
      controlPanels:controlPanels,
      controlHealth:controlHealth,
      blockedReasons:blocked ? [
        !controlHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !controlHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !controlHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !controlHealth.noNetworkCall ? "network_detected" : "",
        !controlHealth.noEndpointGeneration ? "endpoint_generation_detected" : "",
        !controlHealth.noExternalOpen ? "external_open_detected" : "",
        !controlHealth.noPilotStatePersistence ? "pilot_state_persistence_detected" : "",
        !controlHealth.noApprovalTaskCreation ? "approval_task_creation_detected" : "",
        !controlHealth.noEmailSend ? "email_send_detected" : "",
        !controlHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxPilotControlPanels(input) {
    return clone(evaluateGlobalShoppingProviderSandboxPilotControlRoom(input).controlPanels);
  }

  function buildGlobalShoppingProviderSandboxPilotControlRows(input) {
    const evaluation = evaluateGlobalShoppingProviderSandboxPilotControlRoom(input);
    return clone(evaluation.controlPanels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("pilot_control_room_boundary", "Pilot 控制室边界", "该控制室只展示 sandbox pilot 的只读准备状态，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("pilot_control_room_human_gate", "人工审批", "Human-controlled pilot 仍需人工审批", "pass")
    ]));
  }

  function buildGlobalShoppingProviderSandboxPilotControlRoomAuditDraft(input) {
    const room = buildGlobalShoppingProviderSandboxPilotControlRoom(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_AUDIT_DRAFT",
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION,
      status:room.status,
      controlPanelCount:obj(room.controlSummary).controlPanelCount || 0,
      blockedControlCount:obj(room.controlSummary).blockedControlCount || 0,
      needsReviewControlCount:obj(room.controlSummary).needsReviewControlCount || 0,
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

  function sanitizeGlobalShoppingProviderSandboxPilotControlRoom(room) {
    const safe = obj(room);
    const evaluation = evaluateGlobalShoppingProviderSandboxPilotControlRoom(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      roomName:ROOM_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION,
      status:status,
      controlBoundary:{
        roomId:text(safe.roomId || "global-shopping-provider-sandbox-pilot-control-room"),
        roomMode:/^(disabled|control_room_only|mock|readiness_only)$/.test(text(safe.roomMode)) ? text(safe.roomMode) : "control_room_only",
        controlRoomOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canPersistPilotState:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      controlSummary:clone(evaluation.controlSummary),
      controlPanels:toArray(safe.controlPanels).length ? toArray(safe.controlPanels) : buildGlobalShoppingProviderSandboxPilotControlPanels(safe),
      controlHealth:clone(evaluation.controlHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderSandboxPilotControlRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider Sandbox Pilot 控制室",
        resultLabel:status === "ready" ? "Sandbox Pilot 控制室已准备" : (status === "blocked" ? "Sandbox Pilot 控制室已阻断" : "Sandbox Pilot 控制室仍需复核"),
        caveat:"该控制室只展示 sandbox pilot 的只读准备状态，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxPilotControlRoom(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxPilotControlRoom(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderSandboxPilotControlRoom({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSandboxPilotControlRoom = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION,
    ROOM_NAME,
    buildGlobalShoppingProviderSandboxPilotControlRoom,
    evaluateGlobalShoppingProviderSandboxPilotControlRoom,
    buildGlobalShoppingProviderSandboxPilotControlRows,
    buildGlobalShoppingProviderSandboxPilotControlPanels,
    buildGlobalShoppingProviderSandboxPilotControlRoomAuditDraft,
    sanitizeGlobalShoppingProviderSandboxPilotControlRoom
  };
})();
