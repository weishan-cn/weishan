;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION = "4.0.8";
  const CONSOLE_NAME = "global_shopping_provider_governance_audit_console_v1";
  const BUILD_GUARD_KEY = "__weishanGlobalShoppingProviderGovernanceAuditConsoleBuilding";

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
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function buildSafetySentinelInput(input) {
    const safe = obj(input);
    return {
      fileWrite:safe.fileWrite === true,
      download:safe.download === true,
      exportRealFile:safe.exportRealFile === true,
      uploadEvidence:safe.uploadEvidence === true,
      sendEmail:safe.sendEmail === true,
      openExternalDocument:safe.openExternalDocument === true,
      persistRawUserText:safe.persistRawUserText === true,
      persistRawProviderRequest:safe.persistRawProviderRequest === true,
      persistRawProviderResponse:safe.persistRawProviderResponse === true,
      includeSecret:safe.includeSecret === true,
      startRealProvider:safe.startRealProvider === true,
      enableProvider:safe.enableProvider === true,
      modifyRuntimeConfig:safe.modifyRuntimeConfig === true,
      safety:safe.safety
    };
  }
  function buildOperatorConsoleInput(input, safetySentinelSummary) {
    const safe = obj(input);
    return {
      safetyRegressionSummary:obj(safetySentinelSummary),
      auditReviewSummary:safe.auditReviewSummary,
      humanReviewChecklistSummary:safe.humanReviewChecklistSummary,
      finalSafeHandoffPacketSummary:safe.finalSafeHandoffPacketSummary,
      handoffPacketPolicyDecision:safe.handoffPacketPolicyDecision,
      eventLedgerSummary:safe.eventLedgerSummary,
      recentEvents:safe.recentEvents,
      events:safe.events,
      blockedActions:safe.blockedActions,
      actionQueueSummary:safe.actionQueueSummary,
      actionQueue:safe.actionQueue,
      workflowStateSummary:safe.workflowStateSummary,
      currentStage:safe.currentStage,
      workflowId:safe.workflowId,
      selectedCandidate:safe.selectedCandidate,
      selectedCandidateSummary:safe.selectedCandidateSummary,
      topCandidates:safe.topCandidates,
      dryRunTopCandidates:safe.dryRunTopCandidates,
      sessionSummary:safe.sessionSummary,
      freezeGateSummary:safe.freezeGateSummary,
      evidenceFreezePackSummary:safe.evidenceFreezePackSummary,
      rcCandidateReviewSummary:safe.rcCandidateReviewSummary,
      rcEvidenceReviewSummary:safe.rcEvidenceReviewSummary,
      rcRegressionAuditSummary:safe.rcRegressionAuditSummary,
      releaseRiskLedgerSummary:safe.releaseRiskLedgerSummary,
      rcCopyFinalizationSummary:safe.rcCopyFinalizationSummary,
      safetyDisclosureReviewSummary:safe.safetyDisclosureReviewSummary,
      globalShoppingProductGoalSummary:safe.globalShoppingProductGoalSummary,
      jumpToPlatformBoundarySummary:safe.jumpToPlatformBoundarySummary,
      safeToStartRcReview:safe.safeToStartRcReview === true,
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true
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
  function section(sectionId, label, status, ownerRole, summary, caveat) {
    return {
      sectionId:text(sectionId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function buildBoundary(overrides) {
    return Object.assign({
      consoleId:"global-shopping-provider-governance-audit-console",
      consoleMode:"audit_console_only",
      auditConsoleOnly:true,
      readinessOnly:true,
      mockOnly:true,
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      canWriteAuditFile:false,
      canDownload:false,
      canExportRealFile:false,
      canUploadEvidence:false,
      canSendEmail:false,
      canOpenExternalDocument:false,
      canPersistRawUserText:false,
      canPersistRawProviderRequest:false,
      canPersistRawProviderResponse:false,
      canIncludeSecret:false,
      canStartRealProvider:false,
      canEnableProvider:false,
      canModifyRuntimeConfig:false
    }, obj(overrides));
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

  function sectionStatus(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear" || status === "sandbox_ready" || status === "ready_for_human_approval") return "pass";
    return "warning";
  }

  function buildGlobalShoppingProviderGovernanceAuditSections(input) {
    const safe = obj(input);
    const providerPilotGovernanceViewModelSummary = resolveSummary(safe, "providerPilotGovernanceViewModelSummary", "WeishanGlobalShoppingProviderPilotGovernanceViewModel", "buildGlobalShoppingProviderPilotGovernanceViewModel");
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack");
    const providerKillSwitchDrillSummary = resolveSummary(safe, "providerKillSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill");
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    const providerSandboxPilotControlRoomSummary = resolveSummary(safe, "providerSandboxPilotControlRoomSummary", "WeishanGlobalShoppingProviderSandboxPilotControlRoom", "buildGlobalShoppingProviderSandboxPilotControlRoom");
    const safetySentinelSummary = present(safe.safetySentinelSummary)
      ? obj(safe.safetySentinelSummary)
      : obj((window.WeishanFlightWorkflowSafetyRegressionSentinel || {}).buildFlightWorkflowSafetyRegressionReport && (window.WeishanFlightWorkflowSafetyRegressionSentinel || {}).buildFlightWorkflowSafetyRegressionReport(buildSafetySentinelInput(safe)));
    const operatorConsoleSummary = present(safe.operatorConsoleSummary)
      ? obj(safe.operatorConsoleSummary)
      : obj((window.WeishanFlightWorkflowOperatorConsole || {}).buildFlightWorkflowOperatorConsole && (window.WeishanFlightWorkflowOperatorConsole || {}).buildFlightWorkflowOperatorConsole(buildOperatorConsoleInput(safe, safetySentinelSummary)));

    return clone([
      section("provider_pilot_governance_view_model", "Provider Pilot Governance View Model", sectionStatus(providerPilotGovernanceViewModelSummary), "commerce_ops", summaryLabel(providerPilotGovernanceViewModelSummary, "治理视图仍需复核"), "只读展示治理视图，不启动 provider。"),
      section("compliance_evidence_pack", "Compliance Evidence Pack", sectionStatus(complianceEvidencePackSummary), "security", summaryLabel(complianceEvidencePackSummary, "合规证据仍需复核"), "不写审计文件，不上传证据。"),
      section("provider_kill_switch_drill", "Provider Kill Switch Drill", sectionStatus(providerKillSwitchDrillSummary), "incident_commander", summaryLabel(providerKillSwitchDrillSummary, "Kill Switch 演练仍需复核"), "只做 mock 演练，不禁用真实 provider。"),
      section("production_blocker_matrix", "Production Blocker Matrix", sectionStatus(productionBlockerMatrixSummary), "security", summaryLabel(productionBlockerMatrixSummary, "Production 阻断矩阵仍需复核"), "只展示阻断条件，不改配置。"),
      section("provider_sandbox_pilot_control_room", "Provider Sandbox Pilot Control Room", sectionStatus(providerSandboxPilotControlRoomSummary), "release_manager", summaryLabel(providerSandboxPilotControlRoomSummary, "Pilot 控制室仍需复核"), "只读展示 pilot 控制，不启动 pilot。"),
      section("safety_sentinel", "Safety Sentinel", sectionStatus(safetySentinelSummary), "security", text(obj(safetySentinelSummary).status || "安全回归仍需复核"), "只读扫描，不保存 raw provider 数据。"),
      section("operator_console", "Operator Console", sectionStatus(operatorConsoleSummary), "operator", summaryLabel(operatorConsoleSummary, "运营控制台仍需复核"), "只展示治理审计摘要，不执行运营动作。")
    ]);
  }

  function buildGlobalShoppingProviderGovernanceAuditRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.auditSections) ? {
      auditSections:safe.auditSections.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingProviderGovernanceAuditConsole(input);
    return clone([
      row("audit_console_status", "治理审计状态", obj(evaluation.userFacingSummary).resultLabel || "治理审计仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("audit_console_boundary", "审计边界", "治理审计不写文件、不下载、不上传、不发邮件、不打开外部文档。", "pass"),
      row("audit_console_storage", "数据边界", "不保存 raw user text / raw provider request / raw provider response / secret。", "pass"),
      row("audit_console_runtime", "运行边界", "不启动 provider，不启用 provider，不修改配置。", "pass")
    ].concat(toArray(evaluation.auditSections).map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderGovernanceAuditConsole(input) {
    const safe = obj(input);
    const auditBoundary = buildBoundary(safe.auditBoundary);
    const auditSections = buildGlobalShoppingProviderGovernanceAuditSections(safe);
    const blockedBoundary = safe.fileWrite === true || safe.download === true || safe.exportRealFile === true || safe.uploadEvidence === true ||
      safe.sendEmail === true || safe.openExternalDocument === true || safe.persistRawUserText === true || safe.persistRawProviderRequest === true ||
      safe.persistRawProviderResponse === true || safe.includeSecret === true || safe.startRealProvider === true || safe.enableProvider === true || safe.modifyRuntimeConfig === true;
    const blockedSections = auditSections.filter(function (item) { return item.status === "blocked"; });
    const missingSections = auditSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const hasProviderPilotGovernanceViewModel = auditSections[0].status !== "needs_review";
    const hasComplianceEvidencePack = auditSections[1].status !== "needs_review";
    const hasKillSwitchDrill = auditSections[2].status !== "needs_review";
    const hasProductionBlockerMatrix = auditSections[3].status !== "needs_review";
    const hasPilotControlRoom = auditSections[4].status !== "needs_review";
    const hasSafetySentinel = auditSections[5].status !== "needs_review";
    const hasOperatorConsole = auditSections[6].status !== "needs_review";

    const status = blockedBoundary || blockedSections.length ? "blocked" :
      (missingSections.length ? "needs_review" : "ready");
    const blockedReasons = []
      .concat(blockedBoundary ? [
        safe.fileWrite === true ? "audit_file_write_detected" : "",
        safe.download === true ? "download_detected" : "",
        safe.exportRealFile === true ? "real_export_detected" : "",
        safe.uploadEvidence === true ? "evidence_upload_detected" : "",
        safe.sendEmail === true ? "email_send_detected" : "",
        safe.openExternalDocument === true ? "external_document_open_detected" : "",
        safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
        safe.persistRawProviderRequest === true ? "raw_provider_request_persistence_detected" : "",
        safe.persistRawProviderResponse === true ? "raw_provider_response_persistence_detected" : "",
        safe.includeSecret === true ? "secret_included_detected" : "",
        safe.startRealProvider === true ? "real_provider_start_detected" : "",
        safe.enableProvider === true ? "provider_enablement_detected" : "",
        safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : ""
      ].filter(Boolean) : [])
      .concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; }));

    const auditSummary = {
      hasProviderPilotGovernanceViewModel:hasProviderPilotGovernanceViewModel,
      hasComplianceEvidencePack:hasComplianceEvidencePack,
      hasKillSwitchDrill:hasKillSwitchDrill,
      hasProductionBlockerMatrix:hasProductionBlockerMatrix,
      hasPilotControlRoom:hasPilotControlRoom,
      hasSafetySentinel:hasSafetySentinel,
      hasOperatorConsole:hasOperatorConsole,
      auditSectionCount:auditSections.length,
      missingAuditSectionCount:missingSections.length,
      blockedAuditSectionCount:blockedSections.length,
      readyForHumanAuditLedger:status === "ready"
    };

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION,
      status:status,
      auditBoundary:auditBoundary,
      auditSummary:auditSummary,
      auditSections:auditSections,
      auditHealth:{
        noAuditFileWrite:safe.fileWrite !== true,
        noDownload:safe.download !== true,
        noRealExport:safe.exportRealFile !== true,
        noEvidenceUpload:safe.uploadEvidence !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noRawUserTextPersistence:safe.persistRawUserText !== true,
        noRawProviderRequestPersistence:safe.persistRawProviderRequest !== true,
        noRawProviderResponsePersistence:safe.persistRawProviderResponse !== true,
        noSecretIncluded:safe.includeSecret !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noRuntimeConfigModification:safe.modifyRuntimeConfig !== true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingProviderGovernanceAuditRows({
        auditSections:auditSections,
        userFacingSummary:{
          resultLabel:status === "ready" ? "治理审计控制台已准备" : (status === "blocked" ? "治理审计已阻断" : "治理审计仍需复核")
        },
        status:status
      }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Provider Governance 审计控制台",
        resultLabel:status === "ready" ? "治理审计控制台已准备" : (status === "blocked" ? "治理审计已阻断" : "治理审计仍需复核"),
        caveat:"该控制台只展示 provider 治理审计摘要，不写文件，不下载，不上传，不包含密钥或 raw provider 数据。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderGovernanceAuditConsoleAuditDraft(input) {
    const consoleSummary = evaluateGlobalShoppingProviderGovernanceAuditConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION,
      status:consoleSummary.status,
      auditSectionCount:obj(consoleSummary.auditSummary).auditSectionCount || 0,
      blockedAuditSectionCount:obj(consoleSummary.auditSummary).blockedAuditSectionCount || 0,
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

  function sanitizeGlobalShoppingProviderGovernanceAuditConsole(consoleSummary) {
    return evaluateGlobalShoppingProviderGovernanceAuditConsole(consoleSummary || {});
  }

  function buildGlobalShoppingProviderGovernanceAuditConsole(input) {
    if (window[BUILD_GUARD_KEY] === true) {
      return sanitizeGlobalShoppingProviderGovernanceAuditConsole({ status:"needs_review" });
    }
    window[BUILD_GUARD_KEY] = true;
    try {
      return sanitizeGlobalShoppingProviderGovernanceAuditConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderGovernanceAuditConsole({ status:"failed_safe" });
    } finally {
      window[BUILD_GUARD_KEY] = false;
    }
  }

  window.WeishanGlobalShoppingProviderGovernanceAuditConsole = {
    GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingProviderGovernanceAuditConsole,
    evaluateGlobalShoppingProviderGovernanceAuditConsole,
    buildGlobalShoppingProviderGovernanceAuditRows,
    buildGlobalShoppingProviderGovernanceAuditSections,
    buildGlobalShoppingProviderGovernanceAuditConsoleAuditDraft,
    sanitizeGlobalShoppingProviderGovernanceAuditConsole
  };
})();
