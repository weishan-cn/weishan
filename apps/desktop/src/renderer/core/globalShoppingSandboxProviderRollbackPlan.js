;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION = "4.0.0";
  const PLAN_NAME = "global_shopping_sandbox_provider_rollback_plan_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function stage(stageId, label, status, manualOwner, triggerCondition, summary, caveat) {
    return { stageId:text(stageId), label:text(label), status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review", manualOwner:text(manualOwner), triggerCondition:text(triggerCondition), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false, download:false, realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false,
      rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true
    }, obj(overrides));
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function buildGlobalShoppingSandboxProviderRollbackStages(input) {
    const safe = obj(input);
    const drill = obj(safe.mockProviderLaunchDrillSummary);
    const launch = obj(safe.providerLaunchReadinessBoardSummary);
    const sentinel = obj(safe.safetyRegressionSummary);
    return clone([
      stage("rollback_trigger_review", "回滚触发条件复核", Object.keys(drill).length ? (statusOf(drill) === "ready" ? "pass" : statusOf(drill) === "blocked" ? "blocked" : "needs_review") : "needs_review", "release_manager", "Mock 启动演练出现阻断或需要人工暂停时", obj(obj(drill).userFacingSummary).resultLabel || "Mock 启动演练仍需复核", "只展示未来回滚触发条件。"),
      stage("rollback_boundary_review", "启动准备边界复核", Object.keys(launch).length ? (statusOf(launch) === "ready" ? "pass" : statusOf(launch) === "blocked" ? "blocked" : "needs_review") : "needs_review", "commerce_engineering", "发现启动准备边界偏离时", obj(obj(launch).userFacingSummary).resultLabel || "启动准备仍需复核", "不执行 provider disable，不修改配置。"),
      stage("rollback_safety_verification", "安全验证复核", Object.keys(sentinel).length ? (text(sentinel.status) === "pass" ? "pass" : text(sentinel.status) === "fail" ? "blocked" : "needs_review") : "needs_review", "security", "需要复核安全回归时", text(sentinel.status || "安全回归仍需复核"), "不执行 git/file/service 回滚动作。")
    ]);
  }

  function evaluateGlobalShoppingSandboxProviderRollbackPlan(input) {
    const safe = obj(input);
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", safe);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const safetyRegressionSummary = Object.keys(obj(safe.safetyRegressionSummary)).length ? obj(safe.safetyRegressionSummary) : {};
    const rollbackStages = buildGlobalShoppingSandboxProviderRollbackStages({
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      safetyRegressionSummary:safetyRegressionSummary
    });
    const blocked =
      statusOf(mockProviderLaunchDrillSummary) === "blocked" ||
      statusOf(providerLaunchReadinessBoardSummary) === "blocked" ||
      text(safetyRegressionSummary.status) === "fail" ||
      safe.executeRollback === true ||
      safe.modifyGit === true ||
      safe.deleteFiles === true ||
      safe.stopService === true ||
      safe.disableProvider === true ||
      safe.modifyRuntimeConfig === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.claimRollbackCompleted === true;
    const rollbackHealth = {
      noRollbackExecution:safe.executeRollback !== true,
      noGitModification:safe.modifyGit !== true,
      noFileDeletion:safe.deleteFiles !== true,
      noServiceStop:safe.stopService !== true,
      noProviderDisablement:safe.disableProvider !== true,
      noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      manualApprovalRequired:true,
      noForbiddenClaims:safe.claimRollbackCompleted !== true && text(safe.forbiddenClaim || "") === ""
    };
    const rollbackSummary = {
      hasMockLaunchDrill:Object.keys(mockProviderLaunchDrillSummary).length > 0,
      hasLaunchReadinessBoard:Object.keys(providerLaunchReadinessBoardSummary).length > 0,
      hasSafetySentinel:Object.keys(safetyRegressionSummary).length > 0,
      rollbackStageCount:rollbackStages.length,
      triggerConditionCount:rollbackStages.filter(function (item) { return item.triggerCondition; }).length,
      manualOwnerCount:rollbackStages.filter(function (item) { return item.manualOwner; }).length,
      verificationStepCount:rollbackStages.length,
      readyForFutureSandboxRollbackReview:false
    };
    rollbackSummary.readyForFutureSandboxRollbackReview =
      rollbackSummary.hasMockLaunchDrill &&
      rollbackSummary.hasLaunchReadinessBoard &&
      rollbackSummary.hasSafetySentinel &&
      rollbackStages.every(function (item) { return item.status === "pass"; });
    const needsReview =
      !rollbackSummary.hasMockLaunchDrill ||
      !rollbackSummary.hasLaunchReadinessBoard ||
      !rollbackSummary.hasSafetySentinel ||
      rollbackStages.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      rollbackSummary:rollbackSummary,
      rollbackStages:rollbackStages,
      rollbackHealth:rollbackHealth,
      blockedReasons:blocked ? [
        !rollbackHealth.noRollbackExecution ? "rollback_execution_detected" : "",
        !rollbackHealth.noGitModification ? "git_modification_detected" : "",
        !rollbackHealth.noFileDeletion ? "file_deletion_detected" : "",
        !rollbackHealth.noServiceStop ? "service_stop_detected" : "",
        !rollbackHealth.noProviderDisablement ? "provider_disablement_detected" : "",
        !rollbackHealth.noRuntimeConfigModification ? "runtime_config_modification_detected" : "",
        !rollbackHealth.noExternalOpen ? "external_open_detected" : "",
        !rollbackHealth.noForbiddenClaims ? "rollback_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderRollbackRows(input) {
    const evaluation = evaluateGlobalShoppingSandboxProviderRollbackPlan(input);
    return clone(evaluation.rollbackStages.map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("rollback_plan_boundary", "回滚预案边界", "该预案只展示未来回滚步骤，不执行回滚，不改 git，不删文件，不停服务，不修改配置。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingSandboxProviderRollbackPlanAuditDraft(input) {
    const plan = buildGlobalShoppingSandboxProviderRollbackPlan(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_AUDIT_DRAFT",
      planName:PLAN_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION,
      status:plan.status,
      rollbackStageCount:obj(plan.rollbackSummary).rollbackStageCount || 0,
      triggerConditionCount:obj(plan.rollbackSummary).triggerConditionCount || 0,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false,
      fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true
    });
  }

  function sanitizeGlobalShoppingSandboxProviderRollbackPlan(plan) {
    const safe = obj(plan);
    const evaluation = evaluateGlobalShoppingSandboxProviderRollbackPlan(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      planName:PLAN_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION,
      status:status,
      rollbackBoundary:{
        planId:text(safe.planId || "global-shopping-sandbox-provider-rollback-plan"),
        planMode:/^(disabled|plan_only|review_only|sandbox_ready)$/.test(text(safe.planMode)) ? text(safe.planMode) : "plan_only",
        planOnly:true, reviewOnly:true, readOnly:true, sandboxOnly:true, productionDisabled:true,
        canExecuteRollback:false, canModifyGit:false, canDeleteFiles:false, canStopService:false, canDisableProvider:false, canModifyRuntimeConfig:false, canOpenExternalNow:false
      },
      rollbackSummary:clone(evaluation.rollbackSummary),
      rollbackStages:clone(evaluation.rollbackStages),
      rollbackHealth:clone(evaluation.rollbackHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxProviderRollbackRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Sandbox Provider 回滚预案",
        resultLabel:status === "ready" ? "回滚预案已准备" : (status === "blocked" ? "回滚预案已阻断" : "回滚预案仍需复核"),
        caveat:"该预案只展示未来回滚步骤，不执行回滚，不改 git，不删文件，不停服务，不修改配置。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderRollbackPlan(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderRollbackPlan(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxProviderRollbackPlan({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxProviderRollbackPlan = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_ROLLBACK_PLAN_VERSION,
    PLAN_NAME,
    buildGlobalShoppingSandboxProviderRollbackPlan,
    evaluateGlobalShoppingSandboxProviderRollbackPlan,
    buildGlobalShoppingSandboxProviderRollbackRows,
    buildGlobalShoppingSandboxProviderRollbackStages,
    buildGlobalShoppingSandboxProviderRollbackPlanAuditDraft,
    sanitizeGlobalShoppingSandboxProviderRollbackPlan
  };
})();
