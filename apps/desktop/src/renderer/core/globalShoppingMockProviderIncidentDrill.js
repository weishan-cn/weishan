;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION = "4.0.8";
  const DRILL_NAME = "global_shopping_mock_provider_incident_drill_v1";

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
  function step(stepId, label, status, incidentType, summary, manualResponse, caveat) {
    return {
      stepId:text(stepId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      incidentType:text(incidentType),
      summary:text(summary),
      manualResponse:text(manualResponse),
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

  function buildGlobalShoppingMockProviderIncidentTimeline(input) {
    const safe = obj(input);
    const pilot = obj(safe.providerSandboxPilotControlRoomSummary);
    const drill = obj(safe.mockProviderLaunchDrillSummary);
    const rollback = obj(safe.sandboxProviderRollbackPlanSummary);
    const sentinel = obj(safe.safetyRegressionSummary);
    const ready = Object.keys(pilot).length && Object.keys(drill).length && Object.keys(rollback).length && Object.keys(sentinel).length &&
      statusOf(pilot) === "ready" && statusOf(drill) === "ready" && statusOf(rollback) === "ready" && text(sentinel.status) === "pass";
    function derivedStatus(summary, fallback) {
      const status = statusOf(summary);
      return !Object.keys(obj(summary)).length ? "needs_review" : (status === "blocked" || status === "failed_safe" ? "blocked" : (status === "ready" || status === "pass" || status === "clear" ? "pass" : fallback || "warning"));
    }
    return clone([
      step("mock_provider_blocked", "Mock provider blocked", derivedStatus(pilot, "warning"), "mock provider blocked", obj(obj(pilot).userFacingSummary).resultLabel || "Pilot 控制室仍需复核", "人工核对控制室面板，保持 provider disabled。", "不启动真实 provider。"),
      step("mock_contract_replay_failed", "Mock contract replay failed", derivedStatus(drill, "warning"), "mock contract replay failed", obj(obj(drill).userFacingSummary).resultLabel || "Mock 启动演练仍需复核", "人工复核脱敏 replay case，不触发真实请求。", "不触发真实告警。"),
      step("mock_vault_boundary_violated", "Mock vault boundary violated", text(sentinel.status) === "pass" ? (ready ? "pass" : "warning") : (text(sentinel.status) === "fail" ? "blocked" : "needs_review"), "mock vault boundary violated", text(sentinel.status || "安全回归仍需复核"), "人工检查凭据边界风险，不读取真实 key。", "不上传日志。"),
      step("mock_forbidden_capability_detected", "Mock forbidden capability detected", derivedStatus(rollback, "warning"), "mock forbidden provider capability detected", obj(obj(rollback).userFacingSummary).resultLabel || "回滚预案仍需复核", "人工确认禁用 checkout / payment / order / ticketing。", "不执行回滚。"),
      step("mock_unsafe_copy_detected", "Mock unsafe copy detected", text(sentinel.status) === "pass" ? "pass" : (text(sentinel.status) === "fail" ? "blocked" : "needs_review"), "mock unsafe copy detected", text(sentinel.status || "安全文案仍需复核"), "人工修正文案，不打开外部文档。", "不发邮件。"),
      step("mock_rollback_required", "Mock rollback required", derivedStatus(rollback, "warning"), "mock rollback required", obj(obj(rollback).userFacingSummary).resultLabel || "回滚预案仍需复核", "人工参考回滚预案，不执行任何服务动作。", "不停服务，不改 git。")
    ]);
  }

  function evaluateGlobalShoppingMockProviderIncidentDrill(input) {
    const safe = obj(input);
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom", safe);
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", safe);
    const sandboxProviderRollbackPlanSummary = resolveSummary(safe, "sandboxProviderRollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", safe);
    const sentinelApi = window.WeishanFlightWorkflowSafetyRegressionSentinel || {};
    const safetyRegressionSummary = Object.keys(obj(safe.safetyRegressionSummary)).length ? obj(safe.safetyRegressionSummary) :
      (typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(safe) : {});
    const incidentTimeline = buildGlobalShoppingMockProviderIncidentTimeline({
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary,
      safetyRegressionSummary:safetyRegressionSummary
    });
    const incidentHealth = {
      noRealAlert:safe.triggerRealAlert !== true,
      noRollbackExecution:safe.executeRollback !== true,
      noServiceStop:safe.stopService !== true,
      noGitModification:safe.modifyGit !== true,
      noFileDeletion:safe.deleteFiles !== true,
      noLogUpload:safe.uploadLogs !== true,
      noEmailSend:safe.sendEmail !== true,
      noExternalDocumentOpen:safe.openExternalDocument !== true && safe.openExternal !== true && safe.windowOpen !== true,
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const blocked = incidentTimeline.some(function (item) { return item.status === "blocked"; }) ||
      !incidentHealth.noRealAlert ||
      !incidentHealth.noRollbackExecution ||
      !incidentHealth.noServiceStop ||
      !incidentHealth.noGitModification ||
      !incidentHealth.noFileDeletion ||
      !incidentHealth.noLogUpload ||
      !incidentHealth.noEmailSend ||
      !incidentHealth.noExternalDocumentOpen ||
      !incidentHealth.noRealProviderStart ||
      !incidentHealth.noProviderEnablement;
    const needsReview = incidentTimeline.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const incidentSummary = {
      hasPilotControlRoom:Object.keys(providerSandboxPilotControlRoomSummary).length > 0,
      hasMockLaunchDrill:Object.keys(mockProviderLaunchDrillSummary).length > 0,
      hasRollbackPlan:Object.keys(sandboxProviderRollbackPlanSummary).length > 0,
      hasSafetySentinel:Object.keys(safetyRegressionSummary).length > 0,
      incidentCaseCount:incidentTimeline.length,
      detectedMockRiskCount:incidentTimeline.filter(function (item) { return item.status !== "pass"; }).length,
      blockedActionCount:incidentTimeline.filter(function (item) { return item.status === "blocked"; }).length,
      manualResponseStepCount:incidentTimeline.filter(function (item) { return item.manualResponse; }).length,
      readyForProductionBlockerMatrix:false
    };
    incidentSummary.readyForProductionBlockerMatrix =
      incidentSummary.hasPilotControlRoom &&
      incidentSummary.hasMockLaunchDrill &&
      incidentSummary.hasRollbackPlan &&
      incidentSummary.hasSafetySentinel &&
      incidentSummary.blockedActionCount === 0 &&
      incidentSummary.detectedMockRiskCount === 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerSandboxPilotControlRoomSummary:clone(providerSandboxPilotControlRoomSummary),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:clone(sandboxProviderRollbackPlanSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      incidentSummary:incidentSummary,
      incidentTimeline:incidentTimeline,
      incidentHealth:incidentHealth,
      blockedReasons:blocked ? [
        !incidentHealth.noRealAlert ? "real_alert_detected" : "",
        !incidentHealth.noRollbackExecution ? "rollback_execution_detected" : "",
        !incidentHealth.noServiceStop ? "service_stop_detected" : "",
        !incidentHealth.noGitModification ? "git_modification_detected" : "",
        !incidentHealth.noFileDeletion ? "file_deletion_detected" : "",
        !incidentHealth.noLogUpload ? "log_upload_detected" : "",
        !incidentHealth.noEmailSend ? "email_send_detected" : "",
        !incidentHealth.noExternalDocumentOpen ? "external_document_open_detected" : "",
        !incidentHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !incidentHealth.noProviderEnablement ? "provider_enablement_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function runGlobalShoppingMockProviderIncidentDrill(input) {
    const drill = buildGlobalShoppingMockProviderIncidentDrill(input || {});
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION,
      status:drill.status,
      incidentSummary:drill.incidentSummary,
      incidentTimeline:drill.incidentTimeline,
      rows:drill.rows,
      blockedReasons:drill.blockedReasons,
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
    });
  }

  function buildGlobalShoppingMockProviderIncidentRows(input) {
    const evaluation = evaluateGlobalShoppingMockProviderIncidentDrill(input);
    return clone(evaluation.incidentTimeline.map(function (item) {
      return row(item.stepId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("mock_incident_boundary", "事故演练边界", "该演练只模拟 provider 事故响应，不触发真实告警，不执行回滚，不停服务，不上传日志。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingMockProviderIncidentDrillAuditDraft(input) {
    const drill = buildGlobalShoppingMockProviderIncidentDrill(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_AUDIT_DRAFT",
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION,
      status:drill.status,
      incidentCaseCount:obj(drill.incidentSummary).incidentCaseCount || 0,
      blockedActionCount:obj(drill.incidentSummary).blockedActionCount || 0,
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

  function sanitizeGlobalShoppingMockProviderIncidentDrill(drill) {
    const safe = obj(drill);
    const evaluation = evaluateGlobalShoppingMockProviderIncidentDrill(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION,
      status:status,
      incidentBoundary:{
        drillId:text(safe.drillId || "global-shopping-mock-provider-incident-drill"),
        drillMode:/^(disabled|mock_incident|dry_run|readiness_only)$/.test(text(safe.drillMode)) ? text(safe.drillMode) : "mock_incident",
        mockOnly:true,
        dryRunOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canTriggerRealAlert:false,
        canExecuteRollback:false,
        canStopService:false,
        canModifyGit:false,
        canDeleteFiles:false,
        canUploadLogs:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartRealProvider:false,
        canEnableProvider:false
      },
      incidentSummary:clone(evaluation.incidentSummary),
      incidentTimeline:toArray(safe.incidentTimeline).length ? toArray(safe.incidentTimeline) : buildGlobalShoppingMockProviderIncidentTimeline(safe),
      incidentHealth:clone(evaluation.incidentHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingMockProviderIncidentRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Mock Provider 事故演练",
        resultLabel:status === "ready" ? "Mock 事故演练已准备" : (status === "blocked" ? "Mock 事故演练已阻断" : "Mock 事故演练仍需复核"),
        caveat:"该演练只模拟 provider 事故响应，不触发真实告警，不执行回滚，不停服务，不上传日志。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderIncidentDrill(input) {
    try {
      return sanitizeGlobalShoppingMockProviderIncidentDrill(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingMockProviderIncidentDrill({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingMockProviderIncidentDrill = {
    GLOBAL_SHOPPING_MOCK_PROVIDER_INCIDENT_DRILL_VERSION,
    DRILL_NAME,
    buildGlobalShoppingMockProviderIncidentDrill,
    evaluateGlobalShoppingMockProviderIncidentDrill,
    runGlobalShoppingMockProviderIncidentDrill,
    buildGlobalShoppingMockProviderIncidentRows,
    buildGlobalShoppingMockProviderIncidentTimeline,
    buildGlobalShoppingMockProviderIncidentDrillAuditDraft,
    sanitizeGlobalShoppingMockProviderIncidentDrill
  };
})();
