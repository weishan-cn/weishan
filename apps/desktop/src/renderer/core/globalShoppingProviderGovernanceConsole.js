;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CONSOLE_VERSION = "2.3.7";
  const CONSOLE_NAME = "global_shopping_provider_governance_console_v1";

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
  function item(itemId, label, status, summary) {
    return {
      itemId:text(itemId),
      label:text(label),
      status:text(status || "needs_review"),
      summary:text(summary || ""),
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
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](buildInput || safe)) : {};
  }

  function evaluateGlobalShoppingProviderGovernanceConsole(input) {
    const safe = obj(input);
    const hasPilotInput = present(safe.humanControlledSandboxProviderPilotPlannerSummary);
    const hasEvidenceInput = present(safe.complianceEvidencePackSummary);
    const hasGovernanceViewInput = present(safe.providerPilotGovernanceViewModelSummary);
    const hasApprovalInput = present(safe.humanApprovalSimulationGateSummary);
    const pilotStatus = resolveSummary(safe, "humanControlledSandboxProviderPilotPlannerSummary", "WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner", "buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner", safe);
    const killSwitchStatus = resolveSummary(safe, "providerKillSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill", safe);
    const evidenceStatus = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack", safe);
    const governanceViewModel = resolveSummary(safe, "providerPilotGovernanceViewModelSummary", "WeishanGlobalShoppingProviderPilotGovernanceViewModel", "buildGlobalShoppingProviderPilotGovernanceViewModel", safe);
    const approvalStatus = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", safe);

    const killSwitchActive = safe.killSwitchActive === true || statusOf(killSwitchStatus) === "blocked";
    const hasRealProviderRisk = safe.startRealProvider === true || safe.enableProvider === true || safe.enableProductionProvider === true || safe.realProviderAccess === true || safe.providerAccess === true;
    const hasNetworkRisk = safe.network === true || safe.networkAccess === true || safe.providerSearch === true || safe.externalSearch === true || safe.readApiKey === true || safe.generateEndpoint === true || safe.endpointAccess === true;
    const hasExternalOpenRisk = safe.openExternal === true || safe.windowOpen === true || safe.download === true || safe.exportRealFile === true;
    const hasTransactionRisk = safe.booking === true || safe.checkout === true || safe.checkoutSubmit === true || safe.payment === true || safe.order === true || safe.orderSubmit === true || safe.ticketing === true || !!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl);
    const blockedBySummary = statusOf(pilotStatus) === "blocked" || statusOf(evidenceStatus) === "blocked" || statusOf(governanceViewModel) === "blocked";

    const missingEvidence = [];
    if (!hasEvidenceInput) missingEvidence.push("compliance_evidence_pack");
    if (!hasGovernanceViewInput) missingEvidence.push("provider_pilot_governance_view_model");
    if (!hasPilotInput) missingEvidence.push("human_controlled_pilot_planner");
    if (obj(evidenceStatus.evidenceSummary).missingEvidenceCount > 0) missingEvidence.push("evidence_categories_incomplete");
    if (obj(evidenceStatus.evidenceSummary).hasVerifySummary === false) missingEvidence.push("verify_summary");
    if (obj(evidenceStatus.evidenceSummary).hasSafetySentinel === false) missingEvidence.push("safety_sentinel");

    const approvalPresent = hasApprovalInput;
    const approvalState = statusOf(approvalStatus);
    const approvalGranted = safe.humanApprovalGranted === true || approvalState === "approved" || approvalState === "ready";
    const approvalMissing = !approvalPresent;
    const sandboxOnly = !hasRealProviderRisk && !hasNetworkRisk && !hasExternalOpenRisk && !hasTransactionRisk;
    const evidenceReady = missingEvidence.length === 0 && statusOf(evidenceStatus) === "ready";
    const pilotReady = statusOf(pilotStatus) === "ready";
    const governanceReady = statusOf(governanceViewModel) === "ready";
    const blocked = killSwitchActive || blockedBySummary || hasRealProviderRisk || hasNetworkRisk || hasExternalOpenRisk || hasTransactionRisk;

    const blockedActions = [];
    if (killSwitchActive) blockedActions.push("continue_sandbox_pilot");
    if (blocked) blockedActions.push("provider_pilot", "external_handoff", "checkout", "payment", "order_submit");
    const allowedNextActions = blocked ? ["pause_and_review_controls"] :
      (missingEvidence.length ? ["collect_missing_evidence", "human_review_evidence"] :
        (approvalMissing ? ["prepare_human_approval_review", "review_operator_checklist"] :
          (approvalGranted ? ["continue_sandbox_pilot_review", "monitor_audit_trail"] : ["request_final_human_approval", "review_operator_checklist"])));

    const riskReasons = [
      killSwitchActive ? "kill_switch_active" : "",
      hasRealProviderRisk ? "real_provider_intent_detected" : "",
      hasNetworkRisk ? "network_or_endpoint_intent_detected" : "",
      hasExternalOpenRisk ? "export_download_external_open_detected" : "",
      hasTransactionRisk ? "booking_payment_order_checkout_detected" : "",
      blockedBySummary ? "upstream_governance_summary_blocked" : "",
      missingEvidence.length ? "evidence_incomplete" : "",
      approvalMissing ? "human_approval_missing" : "",
      !approvalGranted && approvalPresent ? "human_final_confirmation_pending" : ""
    ].filter(Boolean);

    let consoleStatus = "needs_review";
    if (blocked) consoleStatus = "blocked";
    else if (missingEvidence.length) consoleStatus = "needs_evidence";
    else if (approvalMissing) consoleStatus = "needs_review";
    else if (sandboxOnly && evidenceReady && pilotReady && governanceReady && approvalGranted) consoleStatus = "sandbox_ready";
    else if (sandboxOnly && evidenceReady && pilotReady && governanceReady) consoleStatus = "ready_for_human_approval";

    const operatorChecklist = [
      item("review_pilot_status", "检查 pilot 当前状态", pilotReady ? "pass" : "needs_review", labelOf(pilotStatus, "Pilot 计划仍需复核")),
      item("review_kill_switch", "检查 kill switch 状态", killSwitchActive ? "blocked" : (present(killSwitchStatus) ? "pass" : "needs_review"), labelOf(killSwitchStatus, "Kill Switch 演练仍需复核")),
      item("review_evidence", "检查证据包完整性", evidenceReady ? "pass" : "needs_review", labelOf(evidenceStatus, "合规证据仍需复核")),
      item("review_human_approval", "检查人工审批状态", approvalGranted ? "pass" : "needs_review", approvalPresent ? labelOf(approvalStatus, "人工审批仍需最终确认") : "人工审批信息缺失"),
      item("review_sandbox_boundary", "确认 sandbox-only 边界", sandboxOnly ? "pass" : "blocked", sandboxOnly ? "当前仍在 sandbox / mock / human-controlled 范围内" : "发现超出 sandbox-only 边界的意图")
    ];

    const auditTrailSummary = {
      title:"Provider Governance Console 审计摘要",
      line:blocked ? "治理控制台已阻断高风险动作" :
        (consoleStatus === "needs_evidence" ? "治理控制台仍需补充证据" :
          (consoleStatus === "ready_for_human_approval" ? "治理控制台已准备，等待人工最终确认" :
            (consoleStatus === "sandbox_ready" ? "治理控制台已达到 sandbox-ready" : "治理控制台仍需人工复核"))),
      redacted:true
    };

    const userVisibleSummary = {
      title:"Provider Governance Console",
      resultLabel:consoleStatus === "blocked" ? "当前不能继续" :
        (consoleStatus === "needs_evidence" ? "仍需补充证据" :
          (consoleStatus === "ready_for_human_approval" ? "可进入人工最终确认" :
            (consoleStatus === "sandbox_ready" ? "Sandbox 试点准备完成" : "仍需人工复核"))),
      line:consoleStatus === "blocked" ? "当前已阻断继续 sandbox pilot、外部跳转和交易相关动作。" :
        (consoleStatus === "needs_evidence" ? "请先补齐证据，再由人工继续复核。" :
          (consoleStatus === "ready_for_human_approval" ? "所有只读与 sandbox 前置检查已齐备，但仍需人工最终确认。" :
            (consoleStatus === "sandbox_ready" ? "当前只允许继续 sandbox / mock / human-controlled 评估。" : "当前只展示治理状态，不自动继续。"))),
      highlights:allowedNextActions.slice(0, 2).map(text),
      redacted:true
    };

    const technicalDebugSummary = {
      title:"Provider governance technical summary",
      consoleStatus:consoleStatus,
      pilotStatus:statusOf(pilotStatus) || "missing",
      approvalStatus:approvalState || "missing",
      killSwitchStatus:statusOf(killSwitchStatus) || "missing",
      evidenceStatus:statusOf(evidenceStatus) || "missing",
      sandboxStatus:sandboxOnly ? "sandbox_only" : "boundary_broken",
      riskReasons:riskReasons.slice(),
      blockedActions:blockedActions.slice(),
      allowedNextActions:allowedNextActions.slice(),
      redacted:true
    };

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CONSOLE_VERSION,
      consoleStatus:consoleStatus,
      status:consoleStatus,
      pilotStatus:statusOf(pilotStatus) || "missing",
      approvalStatus:approvalState || "missing",
      killSwitchStatus:statusOf(killSwitchStatus) || "missing",
      evidenceStatus:statusOf(evidenceStatus) || "missing",
      sandboxStatus:sandboxOnly ? "sandbox_only" : "boundary_broken",
      humanReviewRequired:consoleStatus === "needs_review" || consoleStatus === "ready_for_human_approval",
      allowedNextActions:allowedNextActions,
      blockedActions:blockedActions,
      riskReasons:riskReasons,
      missingEvidence:missingEvidence,
      complianceSummary:{
        title:"合规摘要",
        line:evidenceReady ? "合规证据已齐备，仍保持只读与 sandbox-only 边界。" : "合规证据仍需补充或复核。",
        redacted:true
      },
      operatorChecklist:operatorChecklist,
      auditTrailSummary:auditTrailSummary,
      userVisibleSummary:userVisibleSummary,
      technicalDebugSummary:technicalDebugSummary,
      humanControlledSandboxProviderPilotPlannerSummary:clone(pilotStatus),
      providerKillSwitchDrillSummary:clone(killSwitchStatus),
      complianceEvidencePackSummary:clone(evidenceStatus),
      providerPilotGovernanceViewModelSummary:clone(governanceViewModel),
      humanApprovalSimulationGateSummary:clone(approvalStatus),
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderGovernanceConsole(input) {
    try {
      return evaluateGlobalShoppingProviderGovernanceConsole(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderGovernanceConsole({ consoleStatus:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderGovernanceConsole = {
    GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingProviderGovernanceConsole,
    evaluateGlobalShoppingProviderGovernanceConsole
  };
})();
