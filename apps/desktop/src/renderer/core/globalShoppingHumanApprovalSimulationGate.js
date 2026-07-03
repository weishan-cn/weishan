;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION = "4.0.8";
  const GATE_NAME = "global_shopping_human_approval_simulation_gate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|approvalResult|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      status:/^(mock_pass|needs_review|blocked|not_started)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      requiredBeforeRealSandbox:true,
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

  function buildGlobalShoppingHumanApprovalSimulationGates(input) {
    const safe = obj(input);
    const launchSummary = obj(safe.providerLaunchReadinessBoardSummary);
    const legalSummary = obj(safe.legalApprovalWorkflowBoardSummary);
    const replaySummary = obj(safe.providerContractReplayHarnessSummary);
    const vaultSummary = obj(safe.vaultBoundaryContractSummary);
    return clone([
      gate("launch_readiness_review", "启动准备复核", Object.keys(launchSummary).length ? (statusOf(launchSummary) === "ready" ? "mock_pass" : statusOf(launchSummary) === "blocked" ? "blocked" : "needs_review") : "needs_review", "commerce_engineering", obj(obj(launchSummary).userFacingSummary).resultLabel || "启动准备仍需复核", "只模拟审批前置条件，不启动真实 provider。"),
      gate("legal_approval_review", "法务审批复核", Object.keys(legalSummary).length ? (statusOf(legalSummary) === "ready" ? "mock_pass" : statusOf(legalSummary) === "blocked" ? "blocked" : "needs_review") : "needs_review", "legal", obj(obj(legalSummary).userFacingSummary).resultLabel || "法务审批流程仍需复核", "不创建审批任务，不发邮件。"),
      gate("contract_replay_review", "合同回放复核", Object.keys(replaySummary).length ? (statusOf(replaySummary) === "ready" ? "mock_pass" : statusOf(replaySummary) === "blocked" ? "blocked" : "needs_review") : "needs_review", "qa_security", obj(obj(replaySummary).userFacingSummary).resultLabel || "合同回放仍需复核", "只回放脱敏 contract case。"),
      gate("vault_boundary_review", "Vault 边界复核", Object.keys(vaultSummary).length ? (statusOf(vaultSummary) === "ready" ? "mock_pass" : statusOf(vaultSummary) === "blocked" ? "blocked" : "needs_review") : "needs_review", "security", obj(obj(vaultSummary).userFacingSummary).resultLabel || "Vault 边界仍需复核", "不读取 key，不保存审批结果。")
    ]);
  }

  function evaluateGlobalShoppingHumanApprovalSimulationGate(input) {
    const safe = obj(input);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const legalApprovalWorkflowBoardSummary = resolveSummary(safe, "legalApprovalWorkflowBoardSummary", "WeishanGlobalShoppingLegalApprovalWorkflowBoard", "buildGlobalShoppingLegalApprovalWorkflowBoard", safe);
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", safe);
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract", safe);
    const approvalGates = buildGlobalShoppingHumanApprovalSimulationGates({
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      vaultBoundaryContractSummary:vaultBoundaryContractSummary
    });
    const blocked =
      statusOf(providerLaunchReadinessBoardSummary) === "blocked" ||
      statusOf(legalApprovalWorkflowBoardSummary) === "blocked" ||
      statusOf(providerContractReplayHarnessSummary) === "blocked" ||
      statusOf(vaultBoundaryContractSummary) === "blocked" ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDocument === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.persistApprovalResult === true ||
      safe.claimApprovalComplete === true ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true;
    const approvalHealth = {
      noApprovalTaskCreation:safe.createApprovalTask !== true,
      noEmailSend:safe.sendEmail !== true,
      noExternalDocumentOpen:safe.openExternalDocument !== true && safe.openExternal !== true && safe.windowOpen !== true,
      noApprovalPersistence:safe.persistApprovalResult !== true,
      noApprovalCompleteClaim:safe.claimApprovalComplete !== true,
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      realHumanApprovalStillRequired:true,
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const approvalSummary = {
      hasLaunchReadinessBoard:Object.keys(providerLaunchReadinessBoardSummary).length > 0,
      hasLegalApprovalWorkflowBoard:Object.keys(legalApprovalWorkflowBoardSummary).length > 0,
      hasContractReplayHarness:Object.keys(providerContractReplayHarnessSummary).length > 0,
      hasVaultBoundaryContract:Object.keys(vaultBoundaryContractSummary).length > 0,
      simulatedGateCount:approvalGates.length,
      missingApprovalCount:approvalGates.filter(function (item) { return item.status === "needs_review" || item.status === "not_started"; }).length,
      blockedApprovalCount:approvalGates.filter(function (item) { return item.status === "blocked"; }).length,
      readyForMockLaunchDrill:false,
      realHumanApprovalStillRequired:true
    };
    approvalSummary.readyForMockLaunchDrill =
      approvalSummary.hasLaunchReadinessBoard &&
      approvalSummary.hasLegalApprovalWorkflowBoard &&
      approvalSummary.hasContractReplayHarness &&
      approvalSummary.hasVaultBoundaryContract &&
      approvalSummary.missingApprovalCount === 0 &&
      approvalSummary.blockedApprovalCount === 0;
    const needsReview =
      !approvalSummary.hasLaunchReadinessBoard ||
      !approvalSummary.hasLegalApprovalWorkflowBoard ||
      !approvalSummary.hasContractReplayHarness ||
      !approvalSummary.hasVaultBoundaryContract ||
      approvalSummary.missingApprovalCount > 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      legalApprovalWorkflowBoardSummary:clone(legalApprovalWorkflowBoardSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      vaultBoundaryContractSummary:clone(vaultBoundaryContractSummary),
      approvalSummary:approvalSummary,
      approvalGates:approvalGates,
      approvalHealth:approvalHealth,
      blockedReasons:blocked ? [
        !approvalHealth.noApprovalTaskCreation ? "approval_task_creation_detected" : "",
        !approvalHealth.noEmailSend ? "approval_email_detected" : "",
        !approvalHealth.noExternalDocumentOpen ? "external_approval_document_detected" : "",
        !approvalHealth.noApprovalPersistence ? "approval_persistence_detected" : "",
        !approvalHealth.noApprovalCompleteClaim ? "approval_complete_claim_detected" : "",
        !approvalHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !approvalHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !approvalHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !approvalHealth.noNetworkCall ? "network_detected" : "",
        !approvalHealth.noEndpointGeneration ? "endpoint_generation_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingHumanApprovalSimulationRows(input) {
    const evaluation = evaluateGlobalShoppingHumanApprovalSimulationGate(input);
    return clone(evaluation.approvalGates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "mock_pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("approval_simulation_boundary", "审批模拟边界", "只模拟人工审批前置条件，不创建审批任务，不保存审批结果，不代表审批已完成。", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("approval_simulation_human_required", "人工审批要求", "真实 sandbox provider pilot 仍需人工控制", "pass")
    ]));
  }

  function buildGlobalShoppingHumanApprovalSimulationGateAuditDraft(input) {
    const gateSummary = buildGlobalShoppingHumanApprovalSimulationGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION,
      status:gateSummary.status,
      simulatedGateCount:obj(gateSummary.approvalSummary).simulatedGateCount || 0,
      missingApprovalCount:obj(gateSummary.approvalSummary).missingApprovalCount || 0,
      blockedApprovalCount:obj(gateSummary.approvalSummary).blockedApprovalCount || 0,
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

  function sanitizeGlobalShoppingHumanApprovalSimulationGate(gateSummary) {
    const safe = obj(gateSummary);
    const evaluation = evaluateGlobalShoppingHumanApprovalSimulationGate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION,
      status:status,
      approvalBoundary:{
        gateId:text(safe.gateId || "global-shopping-human-approval-simulation-gate"),
        gateMode:/^(disabled|simulation_only|review_only|sandbox_ready)$/.test(text(safe.gateMode)) ? text(safe.gateMode) : "simulation_only",
        simulationOnly:true,
        reviewOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistApprovalResult:false,
        canClaimApprovalComplete:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false
      },
      approvalSummary:clone(evaluation.approvalSummary),
      approvalGates:clone(evaluation.approvalGates),
      approvalHealth:clone(evaluation.approvalHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingHumanApprovalSimulationRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"人工审批模拟闸门",
        resultLabel:status === "ready" ? "审批模拟闸门已准备" : (status === "blocked" ? "审批模拟已阻断" : "审批模拟仍需复核"),
        caveat:"该闸门只模拟人工审批前置条件，不创建审批任务，不保存审批结果，不代表审批已完成。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingHumanApprovalSimulationGate(input) {
    try {
      return sanitizeGlobalShoppingHumanApprovalSimulationGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingHumanApprovalSimulationGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanApprovalSimulationGate = {
    GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingHumanApprovalSimulationGate,
    evaluateGlobalShoppingHumanApprovalSimulationGate,
    buildGlobalShoppingHumanApprovalSimulationRows,
    buildGlobalShoppingHumanApprovalSimulationGates,
    buildGlobalShoppingHumanApprovalSimulationGateAuditDraft,
    sanitizeGlobalShoppingHumanApprovalSimulationGate
  };
})();
