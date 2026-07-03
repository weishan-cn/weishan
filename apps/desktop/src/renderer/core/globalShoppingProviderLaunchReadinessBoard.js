;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_VERSION = "4.1.7";
  const BOARD_NAME = "global_shopping_provider_launch_readiness_board_v1";

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
  function gate(gateId, label, status, ownerRole, summary, caveat) {
    return {
      gateId:text(gateId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      requiredBeforeRealSandbox:true,
      ownerRole:text(ownerRole || "human_reviewer"),
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

  function buildGlobalShoppingProviderLaunchReadinessGates(input) {
    const safe = obj(input);
    const mockSummary = obj(safe.mockProviderAdapterRegistryRuntimeSummary);
    const replaySummary = obj(safe.providerContractReplayHarnessSummary);
    const legalSummary = obj(safe.legalApprovalWorkflowBoardSummary);
    const vaultSummary = obj(safe.vaultBoundaryContractSummary);
    const dossierSummary = obj(safe.providerLegalReviewDossierSummary);
    return clone([
      gate("mock_adapter_registry_gate", "Mock Adapter 注册", Object.keys(mockSummary).length ? (statusOf(mockSummary) === "ready" ? "pass" : statusOf(mockSummary)) : "needs_review", "commerce_engineering", obj(obj(mockSummary).userFacingSummary).resultLabel || "Mock Adapter 注册仍需复核", "只允许 mock/fixture/dry-run/contract-only adapter。"),
      gate("contract_replay_gate", "合同回放", Object.keys(replaySummary).length ? (statusOf(replaySummary) === "ready" ? "pass" : statusOf(replaySummary)) : "needs_review", "qa_security", obj(obj(replaySummary).userFacingSummary).resultLabel || "合同回放仍需复核", "只回放脱敏 contract case。"),
      gate("legal_workflow_gate", "法务审批流程", Object.keys(legalSummary).length ? (statusOf(legalSummary) === "ready" ? "pass" : statusOf(legalSummary)) : "needs_review", "legal", obj(obj(legalSummary).userFacingSummary).resultLabel || "法务审批流程仍需复核", "不创建审批任务、不发邮件。"),
      gate("vault_boundary_gate", "Vault 边界", Object.keys(vaultSummary).length ? (statusOf(vaultSummary) === "ready" ? "pass" : statusOf(vaultSummary)) : "needs_review", "security", obj(obj(vaultSummary).userFacingSummary).resultLabel || "Vault 边界仍需复核", "不读取 key，不提供输入框。"),
      gate("provider_legal_dossier_gate", "Provider 法务审查档案", Object.keys(dossierSummary).length ? (statusOf(dossierSummary) === "ready" ? "pass" : statusOf(dossierSummary)) : "needs_review", "legal_security", obj(obj(dossierSummary).userFacingSummary).resultLabel || "Provider 法务档案仍需复核", "下一步仍需人工审批真实只读 sandbox provider 接入。")
    ]);
  }

  function evaluateGlobalShoppingProviderLaunchReadinessBoard(input) {
    const safe = obj(input);
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", safe);
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", safe);
    const legalApprovalWorkflowBoardSummary = resolveSummary(safe, "legalApprovalWorkflowBoardSummary", "WeishanGlobalShoppingLegalApprovalWorkflowBoard", "buildGlobalShoppingLegalApprovalWorkflowBoard", safe);
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", safe);
    const providerLegalReviewDossierSummary = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", safe);
    const launchReadinessGates = buildGlobalShoppingProviderLaunchReadinessGates({
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary,
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary
    });
    const blocked =
      statusOf(mockProviderAdapterRegistryRuntimeSummary) === "blocked" ||
      statusOf(providerContractReplayHarnessSummary) === "blocked" ||
      statusOf(legalApprovalWorkflowBoardSummary) === "blocked" ||
      statusOf(vaultBoundaryContractSummary) === "blocked" ||
      statusOf(providerLegalReviewDossierSummary) === "blocked" ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const launchHealth = {
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      noApprovalTaskCreation:safe.createApprovalTask !== true,
      noEmailSend:safe.sendEmail !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      manualApprovalRequired:true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const readinessSummary = {
      hasMockAdapterRegistryRuntime:Object.keys(mockProviderAdapterRegistryRuntimeSummary).length > 0,
      hasContractReplayHarness:Object.keys(providerContractReplayHarnessSummary).length > 0,
      hasLegalApprovalWorkflowBoard:Object.keys(legalApprovalWorkflowBoardSummary).length > 0,
      hasVaultBoundaryContract:Object.keys(vaultBoundaryContractSummary).length > 0,
      hasProviderLegalReviewDossier:Object.keys(providerLegalReviewDossierSummary).length > 0,
      readinessGateCount:launchReadinessGates.length,
      passedGateCount:launchReadinessGates.filter(function (item) { return item.status === "pass"; }).length,
      needsReviewGateCount:launchReadinessGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      blockedGateCount:launchReadinessGates.filter(function (item) { return item.status === "blocked"; }).length,
      manualApprovalRequired:true,
      readyForHumanSandboxProviderApproval:false
    };
    readinessSummary.readyForHumanSandboxProviderApproval =
      readinessSummary.hasMockAdapterRegistryRuntime &&
      readinessSummary.hasContractReplayHarness &&
      readinessSummary.hasLegalApprovalWorkflowBoard &&
      readinessSummary.hasVaultBoundaryContract &&
      readinessSummary.hasProviderLegalReviewDossier &&
      readinessSummary.blockedGateCount === 0 &&
      readinessSummary.needsReviewGateCount === 0;
    const needsReview =
      !readinessSummary.hasMockAdapterRegistryRuntime ||
      !readinessSummary.hasContractReplayHarness ||
      !readinessSummary.hasLegalApprovalWorkflowBoard ||
      !readinessSummary.hasVaultBoundaryContract ||
      !readinessSummary.hasProviderLegalReviewDossier ||
      readinessSummary.needsReviewGateCount > 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockProviderAdapterRegistryRuntimeSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      legalApprovalWorkflowBoardSummary:clone(legalApprovalWorkflowBoardSummary),
      vaultBoundaryContractSummary:clone(vaultBoundaryContractSummary),
      providerLegalReviewDossierSummary:clone(providerLegalReviewDossierSummary),
      readinessSummary:readinessSummary,
      launchReadinessGates:launchReadinessGates,
      launchHealth:launchHealth,
      blockedReasons:blocked ? [
        !launchHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !launchHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !launchHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !launchHealth.noNetworkCall ? "network_detected" : "",
        !launchHealth.noEndpointGeneration ? "endpoint_generation_detected" : "",
        !launchHealth.noApprovalTaskCreation ? "approval_task_detected" : "",
        !launchHealth.noEmailSend ? "email_send_detected" : "",
        !launchHealth.noExternalOpen ? "external_open_detected" : "",
        !launchHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchReadinessRows(input) {
    const evaluation = evaluateGlobalShoppingProviderLaunchReadinessBoard(input);
    return clone(evaluation.launchReadinessGates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("provider_launch_readiness_boundary", "启动准备边界", "该闸门只评估人工审批前的准备度，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("provider_launch_manual_approval", "真实 sandbox provider 仍需人工审批", "manual approval required", "pass")
    ]));
  }

  function buildGlobalShoppingProviderLaunchReadinessBoardAuditDraft(input) {
    const board = buildGlobalShoppingProviderLaunchReadinessBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_VERSION,
      status:board.status,
      readinessGateCount:obj(board.readinessSummary).readinessGateCount || 0,
      blockedGateCount:obj(board.readinessSummary).blockedGateCount || 0,
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

  function sanitizeGlobalShoppingProviderLaunchReadinessBoard(board) {
    const safe = obj(board);
    const evaluation = evaluateGlobalShoppingProviderLaunchReadinessBoard(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_VERSION,
      status:status,
      launchBoundary:{
        boardId:text(safe.boardId || "global-shopping-provider-launch-readiness-board"),
        boardMode:/^(disabled|readiness_only|planning_only|sandbox_ready)$/.test(text(safe.boardMode)) ? text(safe.boardMode) : "readiness_only",
        readinessOnly:true,
        planningOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      readinessSummary:clone(evaluation.readinessSummary),
      launchReadinessGates:clone(evaluation.launchReadinessGates),
      launchHealth:clone(evaluation.launchHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderLaunchReadinessRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 启动准备总闸门",
        resultLabel:status === "ready" ? "Provider 启动准备总闸门已准备" : (status === "blocked" ? "启动准备已阻断" : "启动准备仍需复核"),
        caveat:"该闸门只评估人工审批前的准备度，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchReadinessBoard(input) {
    try {
      return sanitizeGlobalShoppingProviderLaunchReadinessBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLaunchReadinessBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchReadinessBoard = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingProviderLaunchReadinessBoard,
    evaluateGlobalShoppingProviderLaunchReadinessBoard,
    buildGlobalShoppingProviderLaunchReadinessRows,
    buildGlobalShoppingProviderLaunchReadinessGates,
    buildGlobalShoppingProviderLaunchReadinessBoardAuditDraft,
    sanitizeGlobalShoppingProviderLaunchReadinessBoard
  };
})();
