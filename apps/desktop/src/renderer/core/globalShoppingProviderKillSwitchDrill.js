;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_VERSION = "2.3.6";
  const DRILL_NAME = "global_shopping_provider_kill_switch_drill_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function trigger(triggerId, label, status, severity, manualResponse, summary, caveat) {
    return {
      triggerId:text(triggerId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      severity:/^(hard_blocker|review_required|info)$/.test(severity) ? severity : "review_required",
      manualResponse:text(manualResponse),
      summary:text(summary),
      caveat:text(caveat),
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
    if (status === "ready" || status === "pass" || status === "clear" || status === "approved" || status === "allowed") return "pass";
    return "needs_review";
  }

  function buildGlobalShoppingProviderKillSwitchTriggers(input) {
    const safe = obj(input);
    const planner = obj(safe.humanControlledSandboxProviderPilotPlannerSummary);
    const blockers = obj(safe.productionBlockerMatrixSummary);
    const incident = obj(safe.mockProviderIncidentDrillSummary);
    const rollback = obj(safe.rollbackPlanSummary || safe.sandboxProviderRollbackPlanSummary);
    const sentinel = obj(safe.safetySentinelSummary || safe.safetyRegressionSummary);
    return clone([
      trigger("human_controlled_pilot_planner", "人工控制 Pilot 计划器", statusForSummary(planner), "review_required", "由 release manager 复核 pilot 计划并保持人工控制。", obj(obj(planner).userFacingSummary).resultLabel || "Pilot 计划器仍需复核", "该计划器只展示未来 pilot 计划，不启动 pilot。"),
      trigger("production_blocker_matrix", "Production 阻断矩阵", statusForSummary(blockers), "hard_blocker", "若发现高风险阻断项，保持 provider disabled 并升级人工复核。", obj(obj(blockers).userFacingSummary).resultLabel || "Production 阻断矩阵仍需复核", "只展示阻断条件，不修改配置。"),
      trigger("mock_incident_drill", "Mock 事故演练", statusForSummary(incident), "hard_blocker", "按 mock 事故步骤进行人工演练，不触发真实告警。", obj(obj(incident).userFacingSummary).resultLabel || "Mock 事故演练仍需复核", "只做 mock 演练，不执行真实回滚。"),
      trigger("rollback_plan", "回滚预案", statusForSummary(rollback), "review_required", "人工检查回滚预案是否完整，但不执行回滚。", obj(obj(rollback).userFacingSummary).resultLabel || "回滚预案仍需复核", "不改 git，不删文件，不停服务。"),
      trigger("safety_sentinel", "安全回归", !present(sentinel) ? "needs_review" : (text(sentinel.status || "") === "pass" ? "pass" : (text(sentinel.status || "") === "fail" || text(sentinel.status || "") === "failed_safe" ? "blocked" : "needs_review")), "hard_blocker", "若安全回归不通过，保持人工阻断并停止后续评估。", text(sentinel.status || "安全回归仍需复核"), "只读扫描，不上传日志，不联网。")
    ]);
  }

  function evaluateGlobalShoppingProviderKillSwitchDrill(input) {
    const safe = obj(input);
    const humanControlledSandboxProviderPilotPlannerSummary = resolveSummary(safe, "humanControlledSandboxProviderPilotPlannerSummary", "WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner", "buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner", safe);
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix", safe);
    const mockProviderIncidentDrillSummary = resolveSummary(safe, "mockProviderIncidentDrillSummary", "WeishanGlobalShoppingMockProviderIncidentDrill", "buildGlobalShoppingMockProviderIncidentDrill", safe);
    const rollbackPlanSummary = resolveSummary(safe, "rollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", safe);
    const safetySentinelSummary = Object.keys(obj(safe.safetySentinelSummary)).length ? obj(safe.safetySentinelSummary) :
      (Object.keys(obj(safe.safetyRegressionSummary)).length ? obj(safe.safetyRegressionSummary) :
        ((window.WeishanFlightWorkflowSafetyRegressionSentinel || {}).buildFlightWorkflowSafetyRegressionReport ? window.WeishanFlightWorkflowSafetyRegressionSentinel.buildFlightWorkflowSafetyRegressionReport(safe) : {}));
    const killSwitchTriggers = buildGlobalShoppingProviderKillSwitchTriggers({
      humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary,
      productionBlockerMatrixSummary:productionBlockerMatrixSummary,
      mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
      rollbackPlanSummary:rollbackPlanSummary,
      safetySentinelSummary:safetySentinelSummary
    });
    const killSwitchHealth = {
      noRealProviderDisablement:safe.disableRealProvider !== true,
      noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
      noRollbackExecution:safe.executeRollback !== true,
      noServiceStop:safe.stopService !== true,
      noGitModification:safe.modifyGit !== true,
      noFileDeletion:safe.deleteFiles !== true,
      noLogUpload:safe.uploadLogs !== true,
      noEmailSend:safe.sendEmail !== true,
      noExternalDocumentOpen:safe.openExternalDocument !== true,
      noNetworkCall:safe.network !== true,
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const blocked = killSwitchTriggers.some(function (item) { return item.status === "blocked"; }) ||
      !killSwitchHealth.noRealProviderDisablement ||
      !killSwitchHealth.noRuntimeConfigModification ||
      !killSwitchHealth.noRollbackExecution ||
      !killSwitchHealth.noServiceStop ||
      !killSwitchHealth.noGitModification ||
      !killSwitchHealth.noFileDeletion ||
      !killSwitchHealth.noLogUpload ||
      !killSwitchHealth.noEmailSend ||
      !killSwitchHealth.noExternalDocumentOpen ||
      !killSwitchHealth.noNetworkCall ||
      !killSwitchHealth.noRealProviderStart ||
      !killSwitchHealth.noProviderEnablement ||
      !killSwitchHealth.noForbiddenClaims;
    const needsReview = killSwitchTriggers.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const killSwitchSummary = {
      hasHumanControlledPilotPlanner:present(humanControlledSandboxProviderPilotPlannerSummary),
      hasProductionBlockerMatrix:present(productionBlockerMatrixSummary),
      hasMockIncidentDrill:present(mockProviderIncidentDrillSummary),
      hasRollbackPlan:present(rollbackPlanSummary),
      hasSafetySentinel:present(safetySentinelSummary),
      triggerCount:killSwitchTriggers.length,
      blockedActionCount:killSwitchTriggers.filter(function (item) { return item.status === "blocked"; }).length,
      manualResponseStepCount:killSwitchTriggers.filter(function (item) { return item.manualResponse; }).length,
      readyForComplianceEvidencePack:false
    };
    killSwitchSummary.readyForComplianceEvidencePack =
      killSwitchSummary.hasHumanControlledPilotPlanner &&
      killSwitchSummary.hasProductionBlockerMatrix &&
      killSwitchSummary.hasMockIncidentDrill &&
      killSwitchSummary.hasRollbackPlan &&
      killSwitchSummary.hasSafetySentinel &&
      killSwitchSummary.blockedActionCount === 0 &&
      !needsReview &&
      !blocked;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      humanControlledSandboxProviderPilotPlannerSummary:clone(humanControlledSandboxProviderPilotPlannerSummary),
      productionBlockerMatrixSummary:clone(productionBlockerMatrixSummary),
      mockProviderIncidentDrillSummary:clone(mockProviderIncidentDrillSummary),
      rollbackPlanSummary:clone(rollbackPlanSummary),
      safetySentinelSummary:clone(safetySentinelSummary),
      killSwitchSummary:killSwitchSummary,
      killSwitchTriggers:killSwitchTriggers,
      killSwitchHealth:killSwitchHealth,
      blockedReasons:blocked ? [
        !killSwitchHealth.noRealProviderDisablement ? "real_provider_disablement_detected" : "",
        !killSwitchHealth.noRuntimeConfigModification ? "runtime_config_modification_detected" : "",
        !killSwitchHealth.noRollbackExecution ? "rollback_execution_detected" : "",
        !killSwitchHealth.noServiceStop ? "service_stop_detected" : "",
        !killSwitchHealth.noGitModification ? "git_modification_detected" : "",
        !killSwitchHealth.noFileDeletion ? "file_deletion_detected" : "",
        !killSwitchHealth.noLogUpload ? "log_upload_detected" : "",
        !killSwitchHealth.noEmailSend ? "email_send_detected" : "",
        !killSwitchHealth.noExternalDocumentOpen ? "external_document_open_detected" : "",
        !killSwitchHealth.noNetworkCall ? "network_detected" : "",
        !killSwitchHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !killSwitchHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !killSwitchHealth.noForbiddenClaims ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderKillSwitchRows(input) {
    const evaluation = evaluateGlobalShoppingProviderKillSwitchDrill(input);
    return clone(evaluation.killSwitchTriggers.map(function (item) {
      return row(item.triggerId, item.label, item.manualResponse || item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("provider_kill_switch_boundary", "Kill Switch 边界", "该演练只模拟 provider 关闭条件，不禁用真实 provider，不改配置，不执行回滚，不停服务。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function runGlobalShoppingProviderKillSwitchDrill(input) {
    return evaluateGlobalShoppingProviderKillSwitchDrill(input || {});
  }

  function buildGlobalShoppingProviderKillSwitchDrillAuditDraft(input) {
    const drill = buildGlobalShoppingProviderKillSwitchDrill(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_AUDIT_DRAFT",
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_VERSION,
      status:drill.status,
      triggerCount:obj(drill.killSwitchSummary).triggerCount || 0,
      blockedActionCount:obj(drill.killSwitchSummary).blockedActionCount || 0,
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

  function sanitizeGlobalShoppingProviderKillSwitchDrill(drill) {
    const safe = obj(drill);
    const evaluation = evaluateGlobalShoppingProviderKillSwitchDrill(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_VERSION,
      status:status,
      killSwitchBoundary:{
        drillId:text(safe.drillId || "global-shopping-provider-kill-switch-drill"),
        drillMode:/^(disabled|mock_kill_switch|dry_run|readiness_only)$/.test(text(safe.drillMode)) ? text(safe.drillMode) : "mock_kill_switch",
        mockOnly:true,
        dryRunOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canDisableRealProvider:false,
        canModifyRuntimeConfig:false,
        canExecuteRollback:false,
        canStopService:false,
        canModifyGit:false,
        canDeleteFiles:false,
        canUploadLogs:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCallNetwork:false,
        canStartRealProvider:false,
        canEnableProvider:false
      },
      killSwitchSummary:clone(evaluation.killSwitchSummary),
      killSwitchTriggers:clone(evaluation.killSwitchTriggers),
      killSwitchHealth:clone(evaluation.killSwitchHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderKillSwitchRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider Kill Switch 演练",
        resultLabel:status === "ready" ? "Kill Switch 演练已准备" : (status === "blocked" ? "Kill Switch 演练已阻断" : "Kill Switch 演练仍需复核"),
        caveat:"该演练只模拟 provider 关闭条件，不禁用真实 provider，不改配置，不执行回滚，不停服务。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderKillSwitchDrill(input) {
    try {
      return sanitizeGlobalShoppingProviderKillSwitchDrill(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderKillSwitchDrill({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderKillSwitchDrill = {
    GLOBAL_SHOPPING_PROVIDER_KILL_SWITCH_DRILL_VERSION,
    DRILL_NAME,
    buildGlobalShoppingProviderKillSwitchDrill,
    evaluateGlobalShoppingProviderKillSwitchDrill,
    runGlobalShoppingProviderKillSwitchDrill,
    buildGlobalShoppingProviderKillSwitchRows,
    buildGlobalShoppingProviderKillSwitchTriggers,
    buildGlobalShoppingProviderKillSwitchDrillAuditDraft,
    sanitizeGlobalShoppingProviderKillSwitchDrill
  };
})();
