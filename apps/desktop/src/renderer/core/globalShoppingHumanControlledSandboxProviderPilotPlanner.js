;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_VERSION = "2.3.6";
  const PLANNER_NAME = "global_shopping_human_controlled_sandbox_provider_pilot_planner_v1";

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
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function stage(stageId, label, status, ownerRole, summary, caveat) {
    return {
      stageId:text(stageId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      requiredBeforeRealPilot:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }
  function present(summary) { return Object.keys(obj(summary)).length > 0; }
  function statusForSummary(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "allowed" || status === "approved" || status === "clear") return "pass";
    return "needs_review";
  }

  function buildGlobalShoppingHumanControlledPilotPlanStages(input) {
    const safe = obj(input);
    const providerSandboxPilotControlRoomSummary = obj(safe.providerSandboxPilotControlRoomSummary);
    const mockProviderIncidentDrillSummary = obj(safe.mockProviderIncidentDrillSummary);
    const productionBlockerMatrixSummary = obj(safe.productionBlockerMatrixSummary);
    const providerPilotControlViewModelSummary = obj(safe.providerPilotControlViewModelSummary);
    const humanApprovalSimulationGateSummary = obj(safe.humanApprovalSimulationGateSummary);
    const mockProviderLaunchDrillSummary = obj(safe.mockProviderLaunchDrillSummary);
    const sandboxProviderRollbackPlanSummary = obj(safe.sandboxProviderRollbackPlanSummary);
    return clone([
      stage("pilot_control_room", "Pilot 控制室复核", statusForSummary(providerSandboxPilotControlRoomSummary), "release_manager", obj(obj(providerSandboxPilotControlRoomSummary).userFacingSummary).resultLabel || "Sandbox Pilot 控制室仍需复核", "只展示 pilot 控制，不启动真实 provider。"),
      stage("mock_incident_drill", "Mock 事故演练复核", statusForSummary(mockProviderIncidentDrillSummary), "incident_commander", obj(obj(mockProviderIncidentDrillSummary).userFacingSummary).resultLabel || "Mock 事故演练仍需复核", "只做 mock 演练，不触发真实告警或回滚。"),
      stage("production_blocker_matrix", "Production 阻断矩阵复核", statusForSummary(productionBlockerMatrixSummary), "security", obj(obj(productionBlockerMatrixSummary).userFacingSummary).resultLabel || "Production 阻断矩阵仍需复核", "只展示阻断条件，不修改运行配置。"),
      stage("pilot_control_view_model", "Pilot 控制视图复核", statusForSummary(providerPilotControlViewModelSummary), "commerce_ops", text(providerPilotControlViewModelSummary.title || "Provider Sandbox Pilot 控制与阻断"), "只展示治理视图，不提供启动按钮。"),
      stage("human_approval_gate", "人工审批闸门复核", statusForSummary(humanApprovalSimulationGateSummary), "legal_security", obj(obj(humanApprovalSimulationGateSummary).userFacingSummary).resultLabel || "审批模拟闸门仍需复核", "仍需人工审批，不创建审批任务。"),
      stage("mock_launch_drill", "Mock 启动演练复核", statusForSummary(mockProviderLaunchDrillSummary), "qa", obj(obj(mockProviderLaunchDrillSummary).userFacingSummary).resultLabel || "Mock 启动演练仍需复核", "只做 mock 启动，不联网，不生成 endpoint。"),
      stage("rollback_plan", "回滚预案复核", statusForSummary(sandboxProviderRollbackPlanSummary), "commerce_engineering", obj(obj(sandboxProviderRollbackPlanSummary).userFacingSummary).resultLabel || "回滚预案仍需复核", "只展示回滚预案，不执行回滚，不修改配置。")
    ]);
  }

  function evaluateGlobalShoppingHumanControlledSandboxProviderPilotPlanner(input) {
    const safe = obj(input);
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom", safe);
    const mockProviderIncidentDrillSummary = resolveSummary(safe, "mockProviderIncidentDrillSummary", "WeishanGlobalShoppingMockProviderIncidentDrill", "buildGlobalShoppingMockProviderIncidentDrill", safe);
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix", safe);
    const providerPilotControlViewModelSummary = resolveSummary(safe, "providerPilotControlViewModelSummary", "WeishanGlobalShoppingProviderPilotControlViewModel", "buildGlobalShoppingProviderPilotControlViewModel", safe);
    const humanApprovalSimulationGateSummary = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", safe);
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", safe);
    const sandboxProviderRollbackPlanSummary = resolveSummary(safe, "sandboxProviderRollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", safe);
    const pilotPlanStages = buildGlobalShoppingHumanControlledPilotPlanStages({
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
      productionBlockerMatrixSummary:productionBlockerMatrixSummary,
      providerPilotControlViewModelSummary:providerPilotControlViewModelSummary,
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary
    });
    const plannerHealth = {
      noPilotStart:safe.startPilot !== true,
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noPilotStatePersistence:safe.persistPilotState !== true,
      noApprovalTaskCreation:safe.createApprovalTask !== true,
      noEmailSend:safe.sendEmail !== true,
      noRollbackExecution:safe.executeRollback !== true,
      noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      realPilotStillRequiresHumanApproval:true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const blocked = pilotPlanStages.some(function (item) { return item.status === "blocked"; }) ||
      !plannerHealth.noPilotStart ||
      !plannerHealth.noRealProviderStart ||
      !plannerHealth.noProviderEnablement ||
      !plannerHealth.noApiKeyRead ||
      !plannerHealth.noNetworkCall ||
      !plannerHealth.noEndpointGeneration ||
      !plannerHealth.noExternalOpen ||
      !plannerHealth.noPilotStatePersistence ||
      !plannerHealth.noApprovalTaskCreation ||
      !plannerHealth.noEmailSend ||
      !plannerHealth.noRollbackExecution ||
      !plannerHealth.noRuntimeConfigModification ||
      !plannerHealth.noCheckoutPaymentTicketingOrder ||
      !plannerHealth.noForbiddenClaims;
    const needsReview = pilotPlanStages.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const plannerSummary = {
      hasPilotControlRoom:present(providerSandboxPilotControlRoomSummary),
      hasMockIncidentDrill:present(mockProviderIncidentDrillSummary),
      hasProductionBlockerMatrix:present(productionBlockerMatrixSummary),
      hasPilotControlViewModel:present(providerPilotControlViewModelSummary),
      hasHumanApprovalSimulationGate:present(humanApprovalSimulationGateSummary),
      hasMockLaunchDrill:present(mockProviderLaunchDrillSummary),
      hasRollbackPlan:present(sandboxProviderRollbackPlanSummary),
      pilotPlanStageCount:pilotPlanStages.length,
      blockedPlanItemCount:pilotPlanStages.filter(function (item) { return item.status === "blocked"; }).length,
      needsReviewPlanItemCount:pilotPlanStages.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      readyForKillSwitchDrill:false,
      realPilotStillRequiresHumanApproval:true
    };
    plannerSummary.readyForKillSwitchDrill =
      plannerSummary.hasPilotControlRoom &&
      plannerSummary.hasMockIncidentDrill &&
      plannerSummary.hasProductionBlockerMatrix &&
      plannerSummary.hasPilotControlViewModel &&
      plannerSummary.hasHumanApprovalSimulationGate &&
      plannerSummary.hasMockLaunchDrill &&
      plannerSummary.hasRollbackPlan &&
      plannerSummary.blockedPlanItemCount === 0 &&
      plannerSummary.needsReviewPlanItemCount === 0 &&
      !blocked;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerSandboxPilotControlRoomSummary:clone(providerSandboxPilotControlRoomSummary),
      mockProviderIncidentDrillSummary:clone(mockProviderIncidentDrillSummary),
      productionBlockerMatrixSummary:clone(productionBlockerMatrixSummary),
      providerPilotControlViewModelSummary:clone(providerPilotControlViewModelSummary),
      humanApprovalSimulationGateSummary:clone(humanApprovalSimulationGateSummary),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:clone(sandboxProviderRollbackPlanSummary),
      plannerSummary:plannerSummary,
      pilotPlanStages:pilotPlanStages,
      plannerHealth:plannerHealth,
      blockedReasons:blocked ? [
        !plannerHealth.noPilotStart ? "pilot_start_detected" : "",
        !plannerHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !plannerHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !plannerHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !plannerHealth.noNetworkCall ? "network_detected" : "",
        !plannerHealth.noEndpointGeneration ? "endpoint_generation_detected" : "",
        !plannerHealth.noExternalOpen ? "external_open_detected" : "",
        !plannerHealth.noPilotStatePersistence ? "pilot_state_persistence_detected" : "",
        !plannerHealth.noApprovalTaskCreation ? "approval_task_detected" : "",
        !plannerHealth.noEmailSend ? "email_send_detected" : "",
        !plannerHealth.noRollbackExecution ? "rollback_execution_detected" : "",
        !plannerHealth.noRuntimeConfigModification ? "runtime_config_modification_detected" : "",
        !plannerHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : "",
        !plannerHealth.noForbiddenClaims ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingHumanControlledPilotPlanRows(input) {
    const evaluation = evaluateGlobalShoppingHumanControlledSandboxProviderPilotPlanner(input);
    return clone(evaluation.pilotPlanStages.map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("pilot_planner_boundary", "Pilot 计划边界", "该计划器只展示未来 sandbox pilot 的人工控制计划，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingHumanControlledSandboxProviderPilotPlannerAuditDraft(input) {
    const planner = buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_AUDIT_DRAFT",
      plannerName:PLANNER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_VERSION,
      status:planner.status,
      pilotPlanStageCount:obj(planner.plannerSummary).pilotPlanStageCount || 0,
      blockedPlanItemCount:obj(planner.plannerSummary).blockedPlanItemCount || 0,
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

  function sanitizeGlobalShoppingHumanControlledSandboxProviderPilotPlanner(planner) {
    const safe = obj(planner);
    const evaluation = evaluateGlobalShoppingHumanControlledSandboxProviderPilotPlanner(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      plannerName:PLANNER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_VERSION,
      status:status,
      plannerBoundary:{
        plannerId:text(safe.plannerId || "global-shopping-human-controlled-sandbox-provider-pilot-planner"),
        plannerMode:/^(disabled|planner_only|readiness_only|mock)$/.test(text(safe.plannerMode)) ? text(safe.plannerMode) : "planner_only",
        plannerOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canPersistPilotState:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canExecuteRollback:false,
        canModifyRuntimeConfig:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      plannerSummary:clone(evaluation.plannerSummary),
      pilotPlanStages:clone(evaluation.pilotPlanStages),
      plannerHealth:clone(evaluation.plannerHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingHumanControlledPilotPlanRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"人工控制 Sandbox Provider Pilot 计划器",
        resultLabel:status === "ready" ? "Pilot 计划器已准备" : (status === "blocked" ? "Pilot 计划已阻断" : "Pilot 计划仍需复核"),
        caveat:"该计划器只展示未来 sandbox pilot 的人工控制计划，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner(input) {
    try {
      return sanitizeGlobalShoppingHumanControlledSandboxProviderPilotPlanner(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingHumanControlledSandboxProviderPilotPlanner({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner = {
    GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_VERSION,
    PLANNER_NAME,
    buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner,
    evaluateGlobalShoppingHumanControlledSandboxProviderPilotPlanner,
    buildGlobalShoppingHumanControlledPilotPlanRows,
    buildGlobalShoppingHumanControlledPilotPlanStages,
    buildGlobalShoppingHumanControlledSandboxProviderPilotPlannerAuditDraft,
    sanitizeGlobalShoppingHumanControlledSandboxProviderPilotPlanner
  };
})();
