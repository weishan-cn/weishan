;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION = "4.0.6";
  const MATRIX_NAME = "global_shopping_production_blocker_matrix_v1";

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
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function category(categoryId, label, status, severity, summary, caveat) {
    return {
      categoryId:text(categoryId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      severity:/^(hard_blocker|review_required|info)$/.test(severity) ? severity : "review_required",
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

  function evaluateGlobalShoppingProductionBlockerMatrix(input) {
    const safe = obj(input);
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom", safe);
    const mockProviderIncidentDrillSummary = resolveSummary(safe, "mockProviderIncidentDrillSummary", "WeishanGlobalShoppingMockProviderIncidentDrill", "buildGlobalShoppingMockProviderIncidentDrill", safe);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const credentialVaultInterfaceStubSummary = resolveSummary(safe, "credentialVaultInterfaceStubSummary", "WeishanGlobalShoppingCredentialVaultInterfaceStub", "buildGlobalShoppingCredentialVaultInterfaceStub", safe);
    const providerLegalReviewDossierSummary = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", safe);
    const sentinelApi = window.WeishanFlightWorkflowSafetyRegressionSentinel || {};
    const safetyRegressionSummary = Object.keys(obj(safe.safetyRegressionSummary)).length ? obj(safe.safetyRegressionSummary) :
      (typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(safe) : {});

    const blockerHealth = {
      legalApprovalRequired:true,
      securityApprovalRequired:true,
      privacyApprovalRequired:true,
      credentialIsolationRequired:true,
      contractAuthorizationRequired:true,
      antiScrapingPolicyRequired:true,
      rawResponseLeakBlocked:statusOf(safetyRegressionSummary) !== "fail",
      rendererKeyExposureBlocked:statusOf(credentialVaultInterfaceStubSummary) !== "blocked",
      checkoutPaymentTicketingBlocked:true,
      forbiddenCopyBlocked:text(safetyRegressionSummary.status || "") !== "fail",
      rollbackPlanRequired:true,
      incidentDrillRequired:true,
      e2eBoundaryRequired:true,
      secretPersistenceGuardRequired:true,
      noConfigModification:safe.modifyRuntimeConfig !== true,
      noProviderEnableDisable:safe.enableProvider !== true && safe.disableProvider !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true
    };

    function present(summary) { return Object.keys(obj(summary)).length > 0; }
    function summaryReady(summary) {
      const status = statusOf(summary);
      return status === "ready" || status === "pass" || status === "clear" || status === "approved" || status === "allowed";
    }
    function deriveStatus(requiredSummary) {
      if (!present(requiredSummary)) return "needs_review";
      if (statusOf(requiredSummary) === "blocked" || statusOf(requiredSummary) === "failed_safe" || statusOf(requiredSummary) === "fail") return "blocked";
      return summaryReady(requiredSummary) ? "pass" : "warning";
    }

    const blockerCategories = [
      category("legal_approval_required", "无法务审批", deriveStatus(providerLegalReviewDossierSummary), "hard_blocker", present(providerLegalReviewDossierSummary) ? "法务审批阻断条件已定义" : "法务审批仍需接线", "未完成法务审批不得进入 production。"),
      category("security_approval_required", "无安全审批", deriveStatus(safetyRegressionSummary), "hard_blocker", present(safetyRegressionSummary) ? "安全审批阻断条件已定义" : "安全审批仍需接线", "安全回归未通过不得进入 production。"),
      category("privacy_approval_required", "无隐私审批", present(providerSandboxPilotControlRoomSummary) ? "pass" : "needs_review", "review_required", present(providerSandboxPilotControlRoomSummary) ? "隐私审批阻断条件已定义" : "隐私审批仍需接线", "未完成隐私审批不得进入 production。"),
      category("credential_isolation_required", "无凭证隔离", deriveStatus(credentialVaultInterfaceStubSummary), "hard_blocker", present(credentialVaultInterfaceStubSummary) ? "凭证隔离阻断条件已定义" : "凭证隔离仍需接线", "凭证未隔离不得进入 production。"),
      category("contract_authorization_required", "无合同授权", deriveStatus(providerLaunchReadinessBoardSummary), "hard_blocker", present(providerLaunchReadinessBoardSummary) ? "合同授权阻断条件已定义" : "合同授权仍需接线", "未确认授权不得进入 production。"),
      category("anti_scraping_policy_required", "反爬限制未确认", present(mockProviderIncidentDrillSummary) ? "pass" : "needs_review", "review_required", present(mockProviderIncidentDrillSummary) ? "反爬政策阻断条件已定义" : "反爬政策仍需接线", "未确认反爬边界不得进入 production。"),
      category("raw_response_leak_risk", "raw response 泄露风险", blockerHealth.rawResponseLeakBlocked ? "pass" : "blocked", "hard_blocker", blockerHealth.rawResponseLeakBlocked ? "Raw response 泄露阻断条件已定义" : "发现 raw response 泄露风险", "禁止保存或展示 raw provider response。"),
      category("renderer_key_exposure_risk", "renderer key 暴露风险", blockerHealth.rendererKeyExposureBlocked ? "pass" : "blocked", "hard_blocker", blockerHealth.rendererKeyExposureBlocked ? "Renderer key 暴露阻断条件已定义" : "发现 renderer key 暴露风险", "禁止 renderer 读取真实 key。"),
      category("transaction_capability_risk", "checkout/payment/order/ticketing 风险", blockerHealth.checkoutPaymentTicketingBlocked ? "pass" : "blocked", "hard_blocker", blockerHealth.checkoutPaymentTicketingBlocked ? "交易能力阻断条件已定义" : "发现交易能力风险", "禁止付款、下单、出票。"),
      category("forbidden_copy_risk", "forbidden copy 风险", blockerHealth.forbiddenCopyBlocked ? "pass" : "blocked", "review_required", blockerHealth.forbiddenCopyBlocked ? "文案阻断条件已定义" : "发现 forbidden copy 风险", "禁止平台授权、最低价、最终价承诺。"),
      category("rollback_plan_required", "rollback plan 未准备", present(providerSandboxPilotControlRoomSummary) ? "pass" : "needs_review", "hard_blocker", present(providerSandboxPilotControlRoomSummary) ? "回滚计划阻断条件已定义" : "回滚计划仍需接线", "未准备回滚计划不得进入 production。"),
      category("incident_drill_required", "incident drill 未通过", deriveStatus(mockProviderIncidentDrillSummary), "hard_blocker", present(mockProviderIncidentDrillSummary) ? "事故演练阻断条件已定义" : "事故演练仍需接线", "事故演练未通过不得进入 production。"),
      category("e2e_boundary_required", "e2e 边界未通过", "pass", "review_required", "E2E 边界阻断条件已定义", "未通过边界验证不得进入 production。"),
      category("secret_guard_required", "secret persistence guard 未通过", "pass", "hard_blocker", "Secret persistence guard 阻断条件已定义", "未通过 secret guard 不得进入 production。")
    ];

    const blocked = blockerCategories.some(function (item) { return item.status === "blocked"; }) ||
      !blockerHealth.noConfigModification ||
      !blockerHealth.noProviderEnableDisable ||
      !blockerHealth.noEndpointGeneration ||
      !blockerHealth.noApiKeyRead ||
      !blockerHealth.noNetworkCall;
    const needsReview = blockerCategories.some(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const blockerSummary = {
      hasPilotControlRoom:present(providerSandboxPilotControlRoomSummary),
      hasMockIncidentDrill:present(mockProviderIncidentDrillSummary),
      hasLaunchReadinessBoard:present(providerLaunchReadinessBoardSummary),
      hasVaultBoundary:present(credentialVaultInterfaceStubSummary),
      hasLegalReview:present(providerLegalReviewDossierSummary),
      hasSafetySentinel:present(safetyRegressionSummary),
      blockerCount:blockerCategories.length,
      hardBlockerCount:blockerCategories.filter(function (item) { return item.severity === "hard_blocker"; }).length,
      needsReviewBlockerCount:blockerCategories.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      readyForHumanControlledPilotPlanning:false
    };
    blockerSummary.readyForHumanControlledPilotPlanning =
      blockerSummary.hasPilotControlRoom &&
      blockerSummary.hasMockIncidentDrill &&
      blockerSummary.hasLaunchReadinessBoard &&
      blockerSummary.hasVaultBoundary &&
      blockerSummary.hasLegalReview &&
      blockerSummary.hasSafetySentinel &&
      blockerSummary.needsReviewBlockerCount === 0 &&
      !blocked;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerSandboxPilotControlRoomSummary:clone(providerSandboxPilotControlRoomSummary),
      mockProviderIncidentDrillSummary:clone(mockProviderIncidentDrillSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      credentialVaultInterfaceStubSummary:clone(credentialVaultInterfaceStubSummary),
      providerLegalReviewDossierSummary:clone(providerLegalReviewDossierSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      blockerSummary:blockerSummary,
      blockerCategories:blockerCategories,
      blockerHealth:blockerHealth,
      blockedReasons:blocked ? [
        !blockerHealth.noConfigModification ? "config_modification_detected" : "",
        !blockerHealth.noProviderEnableDisable ? "provider_enable_disable_detected" : "",
        !blockerHealth.noEndpointGeneration ? "endpoint_generation_detected" : "",
        !blockerHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !blockerHealth.noNetworkCall ? "network_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProductionBlockerCategories(input) {
    return clone(evaluateGlobalShoppingProductionBlockerMatrix(input).blockerCategories);
  }

  function buildGlobalShoppingProductionBlockerRows(input) {
    const evaluation = evaluateGlobalShoppingProductionBlockerMatrix(input);
    return clone(evaluation.blockerCategories.map(function (item) {
      return row(item.categoryId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("production_blocker_boundary", "Production 阻断边界", "该矩阵只展示生产能力阻断条件，不修改配置，不启用 provider，不读取密钥，不联网。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function buildGlobalShoppingProductionBlockerMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingProductionBlockerMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION,
      status:matrix.status,
      blockerCount:obj(matrix.blockerSummary).blockerCount || 0,
      hardBlockerCount:obj(matrix.blockerSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingProductionBlockerMatrix(matrix) {
    const safe = obj(matrix);
    const evaluation = evaluateGlobalShoppingProductionBlockerMatrix(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION,
      status:status,
      blockerBoundary:{
        matrixId:text(safe.matrixId || "global-shopping-production-blocker-matrix"),
        matrixMode:/^(disabled|blocker_only|readiness_only|sandbox_ready)$/.test(text(safe.matrixMode)) ? text(safe.matrixMode) : "blocker_only",
        blockerOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canOpenExternalNow:false
      },
      blockerSummary:clone(evaluation.blockerSummary),
      blockerCategories:toArray(safe.blockerCategories).length ? toArray(safe.blockerCategories) : buildGlobalShoppingProductionBlockerCategories(safe),
      blockerHealth:clone(evaluation.blockerHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProductionBlockerRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Production 阻断矩阵",
        resultLabel:status === "ready" ? "Production 阻断矩阵已准备" : (status === "blocked" ? "Production 阻断矩阵已阻断" : "Production 阻断矩阵仍需复核"),
        caveat:"该矩阵只展示生产能力阻断条件，不修改配置，不启用 provider，不读取密钥，不联网。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProductionBlockerMatrix(input) {
    try {
      return sanitizeGlobalShoppingProductionBlockerMatrix(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProductionBlockerMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProductionBlockerMatrix = {
    GLOBAL_SHOPPING_PRODUCTION_BLOCKER_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingProductionBlockerMatrix,
    evaluateGlobalShoppingProductionBlockerMatrix,
    buildGlobalShoppingProductionBlockerRows,
    buildGlobalShoppingProductionBlockerCategories,
    buildGlobalShoppingProductionBlockerMatrixAuditDraft,
    sanitizeGlobalShoppingProductionBlockerMatrix
  };
})();
