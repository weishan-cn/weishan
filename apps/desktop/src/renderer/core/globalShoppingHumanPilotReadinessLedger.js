;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION = "4.0.5";
  const LEDGER_NAME = "global_shopping_human_pilot_readiness_ledger_v1";

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
  function entry(entryId, label, status, ownerRole, summary, caveat) {
    return {
      entryId:text(entryId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      requiredBeforePilot:true,
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

  function buildGlobalShoppingHumanPilotReadinessLedgerEntries(input) {
    const safe = obj(input);
    const governanceAuditConsoleSummary = resolveSummary(safe, "governanceAuditConsoleSummary", "WeishanGlobalShoppingProviderGovernanceAuditConsole", "buildGlobalShoppingProviderGovernanceAuditConsole");
    const humanControlledPilotPlannerSummary = resolveSummary(safe, "humanControlledPilotPlannerSummary", "WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner", "buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner");
    const launchReadinessBoardSummary = resolveSummary(safe, "launchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard");
    const legalApprovalWorkflowSummary = resolveSummary(safe, "legalApprovalWorkflowSummary", "WeishanGlobalShoppingLegalApprovalWorkflowBoard", "buildGlobalShoppingLegalApprovalWorkflowBoard");
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack");

    return clone([
      entry("governance_audit_console", "Governance Audit Console", normalize(governanceAuditConsoleSummary), "operator", labelOf(governanceAuditConsoleSummary, "治理审计仍需复核"), "只读台账，不写审计文件。"),
      entry("human_controlled_pilot_planner", "Human-Controlled Pilot Planner", normalize(humanControlledPilotPlannerSummary), "release_manager", labelOf(humanControlledPilotPlannerSummary, "Pilot 计划仍需复核"), "只读台账，不启动 pilot。"),
      entry("launch_readiness_board", "Launch Readiness Board", normalize(launchReadinessBoardSummary), "qa", labelOf(launchReadinessBoardSummary, "启动准备仍需复核"), "只读台账，不启动 provider。"),
      entry("legal_approval_workflow", "Legal Approval Workflow", normalize(legalApprovalWorkflowSummary), "legal", labelOf(legalApprovalWorkflowSummary, "法务审批仍需复核"), "只读台账，不创建审批任务。"),
      entry("compliance_evidence_pack", "Compliance Evidence Pack", normalize(complianceEvidencePackSummary), "security", labelOf(complianceEvidencePackSummary, "合规证据仍需复核"), "只读台账，不保存用户查询原文。")
    ]);
  }

  function buildGlobalShoppingHumanPilotReadinessRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.ledgerEntries) ? {
      ledgerEntries:safe.ledgerEntries.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingHumanPilotReadinessLedger(input);
    return clone([
      row("human_pilot_ledger_status", "Human Pilot 准备状态", obj(evaluation.userFacingSummary).resultLabel || "Human Pilot 准备仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("human_pilot_ledger_boundary", "台账边界", "台账不持久化、不保存审批结果、不创建审批任务、不发邮件。", "pass"),
      row("human_pilot_ledger_runtime", "运行边界", "不启动 pilot / provider，不读 key，不联网，不生成 endpoint。", "pass")
    ].concat(toArray(evaluation.ledgerEntries).map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingHumanPilotReadinessLedger(input) {
    const safe = obj(input);
    const ledgerEntries = buildGlobalShoppingHumanPilotReadinessLedgerEntries(safe);
    const blockedBoundary = safe.persistLedger === true || safe.persistApprovalResult === true || safe.persistRawUserText === true || safe.createApprovalTask === true ||
      safe.sendEmail === true || safe.openExternalDocument === true || safe.startPilot === true || safe.startRealProvider === true || safe.enableProvider === true ||
      safe.readApiKey === true || safe.network === true || safe.generateEndpoint === true;
    const blockedLedgerEntries = ledgerEntries.filter(function (item) { return item.status === "blocked"; });
    const missingApprovals = ledgerEntries.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedLedgerEntries.length ? "blocked" :
      (missingApprovals.length ? "needs_review" : "ready");
    const ledgerSummary = {
      hasGovernanceAuditConsole:ledgerEntries[0].status !== "needs_review",
      hasHumanControlledPilotPlanner:ledgerEntries[1].status !== "needs_review",
      hasLaunchReadinessBoard:ledgerEntries[2].status !== "needs_review",
      hasLegalApprovalWorkflow:ledgerEntries[3].status !== "needs_review",
      hasComplianceEvidencePack:ledgerEntries[4].status !== "needs_review",
      ledgerEntryCount:ledgerEntries.length,
      missingApprovalCount:missingApprovals.length,
      blockedLedgerEntryCount:blockedLedgerEntries.length,
      readyForReleaseFreezeGate:status === "ready",
      humanApprovalStillRequired:true
    };

    return clone({
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION,
      status:status,
      ledgerBoundary:{
        ledgerId:"global-shopping-human-pilot-readiness-ledger",
        ledgerMode:"ledger_only",
        ledgerOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistLedger:false,
        canPersistApprovalResult:false,
        canPersistRawUserText:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false
      },
      ledgerSummary:ledgerSummary,
      ledgerEntries:ledgerEntries,
      ledgerHealth:{
        noLedgerPersistence:safe.persistLedger !== true,
        noApprovalPersistence:safe.persistApprovalResult !== true,
        noRawUserTextPersistence:safe.persistRawUserText !== true,
        noApprovalTaskCreation:safe.createApprovalTask !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noPilotStart:safe.startPilot !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noEndpointGeneration:safe.generateEndpoint !== true,
        humanApprovalStillRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingHumanPilotReadinessRows({
        ledgerEntries:ledgerEntries,
        userFacingSummary:{
          resultLabel:status === "ready" ? "Human Pilot 准备台账已准备" : (status === "blocked" ? "Human Pilot 准备已阻断" : "Human Pilot 准备仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.persistLedger === true ? "ledger_persistence_detected" : "",
          safe.persistApprovalResult === true ? "approval_persistence_detected" : "",
          safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
          safe.createApprovalTask === true ? "approval_task_creation_detected" : "",
          safe.sendEmail === true ? "email_send_detected" : "",
          safe.openExternalDocument === true ? "external_document_open_detected" : "",
          safe.startPilot === true ? "pilot_start_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.generateEndpoint === true ? "endpoint_generation_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedLedgerEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"Human Pilot 准备台账",
        resultLabel:status === "ready" ? "Human Pilot 准备台账已准备" : (status === "blocked" ? "Human Pilot 准备已阻断" : "Human Pilot 准备仍需复核"),
        caveat:"该台账只展示人工 pilot 准备状态，不持久化台账，不保存审批结果，不启动 pilot。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingHumanPilotReadinessLedgerAuditDraft(input) {
    const ledger = evaluateGlobalShoppingHumanPilotReadinessLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION,
      status:ledger.status,
      ledgerEntryCount:obj(ledger.ledgerSummary).ledgerEntryCount || 0,
      missingApprovalCount:obj(ledger.ledgerSummary).missingApprovalCount || 0,
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

  function sanitizeGlobalShoppingHumanPilotReadinessLedger(ledger) {
    return evaluateGlobalShoppingHumanPilotReadinessLedger(ledger || {});
  }

  function buildGlobalShoppingHumanPilotReadinessLedger(input) {
    try {
      return sanitizeGlobalShoppingHumanPilotReadinessLedger(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingHumanPilotReadinessLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanPilotReadinessLedger = {
    GLOBAL_SHOPPING_HUMAN_PILOT_READINESS_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingHumanPilotReadinessLedger,
    evaluateGlobalShoppingHumanPilotReadinessLedger,
    buildGlobalShoppingHumanPilotReadinessRows,
    buildGlobalShoppingHumanPilotReadinessLedgerEntries,
    buildGlobalShoppingHumanPilotReadinessLedgerAuditDraft,
    sanitizeGlobalShoppingHumanPilotReadinessLedger
  };
})();
