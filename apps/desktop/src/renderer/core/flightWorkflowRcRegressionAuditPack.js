;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION = "2.1.95";
  const PACK_NAME = "flight_workflow_rc_regression_audit_pack_v1";
  const CAVEAT = "该审计包只用于只读 RC 候选回归判断，不代表真实账号、客服工单、交易请求或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety() {
    return {
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
    };
  }
  function api(name) { return window[name] || {}; }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }
  function candidateReviewOf(input) {
    const safe = obj(input);
    return first(
      safe.rcCandidateReviewSummary,
      typeof api("WeishanFlightWorkflowRcCandidateReviewConsole").buildFlightWorkflowRcCandidateReviewConsole === "function"
        ? api("WeishanFlightWorkflowRcCandidateReviewConsole").buildFlightWorkflowRcCandidateReviewConsole(safe)
        : null
    );
  }
  function evidenceChecklistOf(input) {
    const safe = obj(input);
    return first(
      safe.rcEvidenceReviewSummary,
      typeof api("WeishanFlightWorkflowRcEvidenceReviewChecklist").buildFlightWorkflowRcEvidenceReviewChecklist === "function"
        ? api("WeishanFlightWorkflowRcEvidenceReviewChecklist").buildFlightWorkflowRcEvidenceReviewChecklist(safe)
        : null
    );
  }
  function freezeGateOf(input) {
    const safe = obj(input);
    return first(
      safe.freezeGateSummary,
      typeof api("WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate").buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate === "function"
        ? api("WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate").buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(safe)
        : null
    );
  }
  function evidencePackOf(input) {
    const safe = obj(input);
    return first(
      safe.evidenceFreezePackSummary,
      typeof api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack === "function"
        ? api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack(safe)
        : null
    );
  }
  function sentinelOf(input) {
    const safe = obj(input);
    return first(
      safe.safetyRegressionSummary,
      typeof api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport === "function"
        ? api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport(safe)
        : null
    );
  }
  function riskBadgeOf(input) {
    const safe = obj(input);
    return first(
      safe.riskBadgeSummary,
      typeof api("WeishanFlightWorkflowRiskBadgeBuilder").buildFlightWorkflowRiskBadges === "function"
        ? api("WeishanFlightWorkflowRiskBadgeBuilder").buildFlightWorkflowRiskBadges(safe)
        : null
    );
  }
  function operatorConsoleOf(input) {
    const safe = obj(input);
    return first(
      safe.operatorConsoleSummary,
      typeof api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole === "function"
        ? api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole(safe)
        : null
    );
  }
  function hasSensitiveRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true || safe.realIdentityStored === true ||
      safe.identityUpload === true || safe.credentialInput === true || safe.rawUserTextStored === true || safe.rawResponseStored === true ||
      safe.secretStored === true || nested.realNameStored === true || nested.phoneStored === true || nested.emailStored === true ||
      nested.realIdentityStored === true || nested.identityUpload === true || nested.credentialInput === true || nested.rawUserTextStored === true ||
      nested.rawResponseStored === true || nested.secretStored === true;
  }
  function hasTradingRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || nested.bookingUrl || nested.checkoutUrl || nested.paymentUrl || nested.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true || nested.payment === true || nested.order === true || nested.ticketing === true;
  }
  function hasSecretRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.secretStored === true || safe.rawResponseStored === true || safe.rawUserTextStored === true ||
      nested.secretStored === true || nested.rawResponseStored === true || nested.rawUserTextStored === true ||
      typeof safe.token === "string" || typeof safe.apiKey === "string" || typeof safe.secret === "string" || typeof safe.password === "string" ||
      typeof nested.token === "string" || typeof nested.apiKey === "string" || typeof nested.secret === "string" || typeof nested.password === "string" ||
      obj(safe.rawProviderResponse) && Object.keys(obj(safe.rawProviderResponse)).length > 0 ||
      obj(safe.rawPayload) && Object.keys(obj(safe.rawPayload)).length > 0;
  }
  function hasExternalOpenRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.autoOpen === true || safe.autoRefresh === true || nested.autoOpen === true || nested.autoRefresh === true;
  }
  function hasFileWriteRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.fileWrite === true || safe.canWriteFile === true || nested.fileWrite === true;
  }
  function hasDownloadRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.download === true || safe.canDownload === true || nested.download === true;
  }
  function buildFlightWorkflowRcRegressionAuditRows(input) {
    return clone(evaluateFlightWorkflowRcRegressionAudit(input || {}).regressionRows || []);
  }
  function evaluateFlightWorkflowRcRegressionAudit(input) {
    const safe = obj(input);
    const rcCandidateReviewSummary = candidateReviewOf(safe);
    const rcEvidenceReviewSummary = evidenceChecklistOf(safe);
    const freezeGateSummary = freezeGateOf(safe);
    const evidenceFreezePackSummary = evidencePackOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const riskBadgeSummary = riskBadgeOf(safe);
    const operatorConsoleSummary = operatorConsoleOf(safe);
    const values = [safe, rcCandidateReviewSummary, rcEvidenceReviewSummary, freezeGateSummary, evidenceFreezePackSummary, safetyRegressionSummary, riskBadgeSummary, operatorConsoleSummary];

    const auditHealth = {
      rcCandidateReviewReady:safe.rcCandidateReviewReady === true || rcCandidateReviewSummary.status === "ready_for_review" || rcCandidateReviewSummary.safeToStartRcReview === true,
      rcEvidenceChecklistReady:safe.rcEvidenceChecklistReady === true || rcEvidenceReviewSummary.status === "complete",
      freezeGateReady:safe.freezeGateReady === true || freezeGateSummary.status === "frozen" || freezeGateSummary.status === "ready_to_freeze" || obj(freezeGateSummary.freezeDecision).safeToFreeze === true,
      evidenceFreezePackReady:safe.evidenceFreezePackReady === true || evidenceFreezePackSummary.status === "ready" || evidenceFreezePackSummary.safeToFreeze === true,
      safetySentinelPass:safe.safetySentinelPass === false ? false : (safe.safetySentinelPass === true || safetyRegressionSummary.status === "pass"),
      commerceAgentSmokeBounded:safe.commerceAgentSmokeBounded === true || (Number(safe.commerceAgentSmokeCount) >= 16 && Number(safe.commerceAgentSmokeCount) <= 18),
      dispatchSmokePass:safe.dispatchSmokePass === true || Number(safe.dispatchSmokePassedCount) >= 1 || safe.dispatchStatus === "pass",
      versionCheckPass:safe.versionCheckPass === true || safe.versionCheckStatus === "pass",
      noSensitiveDataRisk:safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk),
      noTradingRisk:safe.noTradingRisk === false ? false : !values.some(hasTradingRisk),
      noSecretRisk:safe.noSecretRisk === false ? false : !values.some(hasSecretRisk),
      noExternalOpenRisk:safe.noExternalOpenRisk === false ? false : !values.some(hasExternalOpenRisk),
      noFileWriteRisk:safe.noFileWriteRisk === false ? false : !values.some(hasFileWriteRisk),
      noDownloadRisk:safe.noDownloadRisk === false ? false : !values.some(hasDownloadRisk)
    };

    const failedChecks = [];
    const blockedReasons = [];
    if (!auditHealth.safetySentinelPass) blockedReasons.push("safety_sentinel_failed");
    if (!auditHealth.noSensitiveDataRisk) blockedReasons.push("sensitive_data_risk");
    if (!auditHealth.noTradingRisk) blockedReasons.push("trading_risk");
    if (!auditHealth.noSecretRisk) blockedReasons.push("secret_risk");
    if (!auditHealth.noExternalOpenRisk) blockedReasons.push("external_open_risk");
    if (!auditHealth.noFileWriteRisk) blockedReasons.push("file_write_risk");
    if (!auditHealth.noDownloadRisk) blockedReasons.push("download_risk");

    if (!auditHealth.rcCandidateReviewReady) failedChecks.push("rc_candidate_review");
    if (!auditHealth.rcEvidenceChecklistReady) failedChecks.push("rc_evidence_checklist");
    if (!auditHealth.freezeGateReady) failedChecks.push("freeze_gate");
    if (!auditHealth.evidenceFreezePackReady) failedChecks.push("evidence_freeze_pack");
    if (!auditHealth.commerceAgentSmokeBounded) failedChecks.push("commerce_agent_smoke");
    if (!auditHealth.dispatchSmokePass) failedChecks.push("dispatch_smoke");
    if (!auditHealth.versionCheckPass) failedChecks.push("version_check");

    let status = "passed";
    if (blockedReasons.length) status = "blocked";
    else if (failedChecks.length) status = "needs_review";

    return clone({
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION,
      status:status,
      auditHealth:auditHealth,
      regressionRows:[
        row("rc_candidate_review", "候选复核", auditHealth.rcCandidateReviewReady ? "RC 候选复核已准备" : "RC 候选复核仍需补充", auditHealth.rcCandidateReviewReady ? "pass" : "warning"),
        row("rc_evidence_checklist", "证据复核", auditHealth.rcEvidenceChecklistReady ? "RC 证据复核已准备" : "RC 证据复核仍需补充", auditHealth.rcEvidenceChecklistReady ? "pass" : "warning"),
        row("freeze_gate", "冻结检查", auditHealth.freezeGateReady ? "冻结检查已准备" : "冻结检查仍需复核", auditHealth.freezeGateReady ? "pass" : "warning"),
        row("evidence_freeze_pack", "证据链回归", auditHealth.evidenceFreezePackReady ? "证据冻结包已准备" : "证据链仍需复核", auditHealth.evidenceFreezePackReady ? "pass" : "warning"),
        row("safety_sentinel", "安全红线回归", auditHealth.safetySentinelPass ? "安全红线回归通过" : "安全红线回归已阻断", auditHealth.safetySentinelPass ? "pass" : "blocked"),
        row("commerce_agent_smoke", "E2E smoke 回归", auditHealth.commerceAgentSmokeBounded ? "commerce-agent smoke 已 bounded" : "commerce-agent smoke 仍需复核", auditHealth.commerceAgentSmokeBounded ? "pass" : "warning"),
        row("dispatch_smoke", "dispatch 回归", auditHealth.dispatchSmokePass ? "dispatch smoke 已通过" : "dispatch smoke 仍需复核", auditHealth.dispatchSmokePass ? "pass" : "warning"),
        row("version_check", "核心 API 回归", auditHealth.versionCheckPass ? "版本检查通过" : "版本检查仍需复核", auditHealth.versionCheckPass ? "pass" : "warning"),
        row("risk_badges", "风险标签回归", riskBadgeSummary.summaryLabel || "回归不代表交易能力", "pass"),
        row("operator_console", "UI 文案回归", operatorConsoleSummary.userFacingSummary && operatorConsoleSummary.userFacingSummary.resultLabel || "仍需复核", auditHealth.rcCandidateReviewReady && auditHealth.rcEvidenceChecklistReady ? "pass" : "warning"),
        row("next_step", "下一步", status === "passed" ? "回归审计通过" : status === "needs_review" ? "仍需复核" : "已阻断", status === "blocked" ? "blocked" : (status === "passed" ? "pass" : "warning"))
      ],
      failedChecks:failedChecks,
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"只读 RC 回归审计包",
        resultLabel:status === "passed" ? "回归审计通过" : status === "needs_review" ? "仍需复核" : "已阻断",
        caveat:CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary:clone(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(safe.globalShoppingGoalStatus || safe.globalShoppingProductGoalSummary && safe.globalShoppingProductGoalSummary.status || ""),
      jumpBoundaryStatus:text(safe.jumpBoundaryStatus || safe.jumpToPlatformBoundarySummary && safe.jumpToPlatformBoundarySummary.status || ""),
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true,
      rcCandidateReviewSummary:clone(rcCandidateReviewSummary),
      rcEvidenceReviewSummary:clone(rcEvidenceReviewSummary),
      freezeGateSummary:clone(freezeGateSummary),
      evidenceFreezePackSummary:clone(evidenceFreezePackSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      riskBadgeSummary:clone(riskBadgeSummary),
      operatorConsoleSummary:clone(operatorConsoleSummary),
      safety:safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowRcRegressionAuditPack(pack) {
    const safe = obj(pack);
    const status = /^(passed|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const summary = obj(safe.userFacingSummary);
    return clone({
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION,
      status:status,
      auditHealth:Object.assign({
        rcCandidateReviewReady:false,
        rcEvidenceChecklistReady:false,
        freezeGateReady:false,
        evidenceFreezePackReady:false,
        safetySentinelPass:false,
        commerceAgentSmokeBounded:false,
        dispatchSmokePass:false,
        versionCheckPass:false,
        noSensitiveDataRisk:false,
        noTradingRisk:false,
        noSecretRisk:false,
        noExternalOpenRisk:false,
        noFileWriteRisk:false,
        noDownloadRisk:false
      }, obj(safe.auditHealth)),
      regressionRows:toArray(safe.regressionRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      failedChecks:toArray(safe.failedChecks).map(text),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{
        title:"只读 RC 回归审计包",
        resultLabel:summary.resultLabel || (status === "passed" ? "回归审计通过" : status === "needs_review" ? "仍需复核" : "已阻断"),
        caveat:summary.caveat || CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary:clone(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary:clone(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingGoalStatus:text(safe.globalShoppingGoalStatus || ""),
      jumpBoundaryStatus:text(safe.jumpBoundaryStatus || ""),
      safeToProceedWithJumpToPlatformMvp:safe.safeToProceedWithJumpToPlatformMvp === true,
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      riskBadgeSummary:clone(safe.riskBadgeSummary || null),
      operatorConsoleSummary:clone(safe.operatorConsoleSummary || null),
      safety:Object.assign(safety(), obj(safe.safety)),
      redacted:true
    });
  }
  function buildFlightWorkflowRcRegressionAuditPack(input) {
    try {
      return sanitizeFlightWorkflowRcRegressionAuditPack(evaluateFlightWorkflowRcRegressionAudit(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowRcRegressionAuditPack({
        status:"failed_safe",
        regressionRows:[],
        failedChecks:["failed_safe"],
        blockedReasons:["failed_safe"],
        userFacingSummary:{ title:"只读 RC 回归审计包", resultLabel:"已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowRcRegressionAuditPackAuditDraft(input) {
    const pack = buildFlightWorkflowRcRegressionAuditPack(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION,
      status:pack.status,
      failedCheckCount:pack.failedChecks.length,
      blockedReasonCount:pack.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowRcRegressionAuditPack = {
    FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION,
    PACK_NAME,
    buildFlightWorkflowRcRegressionAuditPack,
    evaluateFlightWorkflowRcRegressionAudit,
    buildFlightWorkflowRcRegressionAuditRows,
    buildFlightWorkflowRcRegressionAuditPackAuditDraft,
    sanitizeFlightWorkflowRcRegressionAuditPack
  };
})();
