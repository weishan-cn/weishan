;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION = "2.1.99";
  const CONSOLE_NAME = "flight_workflow_rc_candidate_review_console_v1";
  const CAVEAT = "该控制台只用于只读 RC 候选复核，不代表真实账号、客服工单、交易请求或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function api(name) { return window[name] || {}; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safety() {
    return {
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
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
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
  function launchCandidateOf(input) {
    const safe = obj(input);
    return first(
      safe.launchCandidateReadinessSummary,
      typeof api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard === "function"
        ? api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard(safe)
        : null
    );
  }
  function pilotExitCriteriaOf(input) {
    const safe = obj(input);
    return first(
      safe.pilotExitCriteriaSummary,
      typeof api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria === "function"
        ? api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria(safe)
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
  function operatorConsoleOf(input) {
    const safe = obj(input);
    return first(
      safe.operatorConsoleSummary,
      typeof api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole === "function"
        ? api("WeishanFlightWorkflowOperatorConsole").buildFlightWorkflowOperatorConsole(safe)
        : null
    );
  }
  function releaseReadinessOf(input) {
    const safe = obj(input);
    return first(
      safe.releaseReadinessSummary,
      typeof api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard === "function"
        ? api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard(safe)
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
  function buildFlightWorkflowRcCandidateReviewRows(input) {
    return clone(evaluateFlightWorkflowRcCandidateReview(input || {}).rows || []);
  }
  function evaluateFlightWorkflowRcCandidateReview(input) {
    const safe = obj(input);
    const freezeGateSummary = freezeGateOf(safe);
    const evidenceFreezePackSummary = evidencePackOf(safe);
    const launchCandidateReadinessSummary = launchCandidateOf(safe);
    const pilotExitCriteriaSummary = pilotExitCriteriaOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const operatorConsoleSummary = operatorConsoleOf(safe);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const values = [safe, freezeGateSummary, evidenceFreezePackSummary, launchCandidateReadinessSummary, pilotExitCriteriaSummary, safetyRegressionSummary, operatorConsoleSummary, releaseReadinessSummary];
    const hasSafetySentinelSummary = Object.keys(safetyRegressionSummary).length > 0 || safe.safetySentinelPass === true || safe.safetySentinelPass === false;
    const hasReleaseReadinessSummary = Object.keys(releaseReadinessSummary).length > 0 || safe.releaseReadinessReady === true || safe.releaseReadinessReady === false;
    const freezeGateReady = safe.freezeGateReady === true || freezeGateSummary.status === "frozen" || freezeGateSummary.status === "ready_to_freeze" || obj(freezeGateSummary.freezeDecision).safeToFreeze === true;
    const evidenceFreezePackReady = safe.evidenceFreezePackReady === true || evidenceFreezePackSummary.status === "ready" || evidenceFreezePackSummary.safeToFreeze === true;
    const launchCandidateReady = safe.launchCandidateReady === true || launchCandidateReadinessSummary.status === "ready" || obj(launchCandidateReadinessSummary.launchCandidateReadiness).safeForReadOnlyLaunchCandidate === true;
    const pilotExitCriteriaMet = safe.pilotExitCriteriaMet === true || pilotExitCriteriaSummary.status === "met" || obj(pilotExitCriteriaSummary.exitHealth).readyForLaunchCandidate === true;
    const safetySentinelPass = safe.safetySentinelPass === false ? false : (safe.safetySentinelPass === true || !hasSafetySentinelSummary || safetyRegressionSummary.status === "pass");
    const releaseReadinessReady = safe.releaseReadinessReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.safeForUserFacingBeta === true;
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : !values.some(hasTradingRisk);
    const noSecretRisk = safe.noSecretRisk === false ? false : !values.some(hasSecretRisk);
    const noExternalOpenRisk = safe.noExternalOpenRisk === false ? false : !values.some(hasExternalOpenRisk);
    const reviewHealth = {
      freezeGateReady:freezeGateReady,
      evidenceFreezePackReady:evidenceFreezePackReady,
      launchCandidateReady:launchCandidateReady,
      pilotExitCriteriaMet:pilotExitCriteriaMet,
      safetySentinelPass:safetySentinelPass,
      releaseReadinessReady:releaseReadinessReady,
      noSensitiveDataRisk:noSensitiveDataRisk,
      noTradingRisk:noTradingRisk,
      noSecretRisk:noSecretRisk,
      noExternalOpenRisk:noExternalOpenRisk
    };
    const missingEvidence = [];
    if (!freezeGateReady) missingEvidence.push("freeze_gate");
    if (!evidenceFreezePackReady) missingEvidence.push("evidence_freeze_pack");
    if (!launchCandidateReady) missingEvidence.push("launch_candidate_readiness");
    if (!pilotExitCriteriaMet) missingEvidence.push("pilot_exit_criteria");
    if (!releaseReadinessReady) missingEvidence.push("release_readiness");
    const blockedReasons = [];
    if (!safetySentinelPass) blockedReasons.push("safety_sentinel_failed");
    if (!noSensitiveDataRisk) blockedReasons.push("sensitive_data_risk");
    if (!noTradingRisk) blockedReasons.push("trading_risk");
    if (!noSecretRisk) blockedReasons.push("secret_risk");
    if (!noExternalOpenRisk) blockedReasons.push("external_open_risk");
    let status = "ready_for_review";
    if (!safetySentinelPass || !noSensitiveDataRisk || !noTradingRisk || !noSecretRisk || !noExternalOpenRisk) status = "blocked";
    else if (hasReleaseReadinessSummary && !releaseReadinessReady) status = "needs_safety_review";
    else if (!freezeGateReady || !evidenceFreezePackReady || !launchCandidateReady || !pilotExitCriteriaMet) status = "evidence_incomplete";
    const reviewDecision = status === "ready_for_review"
      ? { decisionId:"start_rc_review", label:"可以开始 RC 复核", message:"关键只读候选证据已齐备，可以开始 RC 复核。", safeToStartRcReview:true }
      : status === "evidence_incomplete"
        ? { decisionId:"collect_more_evidence", label:"证据仍需补充", message:"请先补齐冻结检查、候选准备或试点退出条件相关证据。", safeToStartRcReview:false }
        : status === "needs_safety_review"
          ? { decisionId:"safety_review", label:"需要安全复核", message:"发布就绪相关安全证据仍需复核。", safeToStartRcReview:false }
          : { decisionId:"blocked", label:"已阻断", message:"检测到安全红线或只读边界风险。", safeToStartRcReview:false };
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION,
      status:status,
      reviewDecision:reviewDecision,
      reviewHealth:reviewHealth,
      rows:[
        row("freeze_gate", "冻结检查", freezeGateReady ? "冻结检查已准备" : "证据仍需补充", freezeGateReady ? "pass" : "warning"),
        row("evidence_pack", "证据复核", evidenceFreezePackReady ? "证据冻结包已准备" : "证据仍需补充", evidenceFreezePackReady ? "pass" : "warning"),
        row("launch_candidate", "候选准备", launchCandidateReady ? "发布候选已准备" : "证据仍需补充", launchCandidateReady ? "pass" : "warning"),
        row("pilot_exit", "试点退出", pilotExitCriteriaMet ? "试点退出条件已满足" : "证据仍需补充", pilotExitCriteriaMet ? "pass" : "warning"),
        row("release_readiness", "发布就绪", releaseReadinessReady ? "发布就绪" : "需要安全复核", releaseReadinessReady ? "pass" : "warning"),
        row("safety", "安全红线", safetySentinelPass && noSensitiveDataRisk && noTradingRisk && noSecretRisk && noExternalOpenRisk ? "安全红线正常" : "RC 复核已阻断", safetySentinelPass && noSensitiveDataRisk && noTradingRisk && noSecretRisk && noExternalOpenRisk ? "pass" : "blocked"),
        row("next_step", "下一步", reviewDecision.label, status === "blocked" ? "blocked" : (status === "ready_for_review" ? "pass" : "warning"))
      ],
      missingEvidence:missingEvidence,
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"只读 RC 候选复核控制台",
        resultLabel:status === "ready_for_review" ? "可以开始 RC 复核" : status === "evidence_incomplete" ? "证据仍需补充" : status === "needs_safety_review" ? "需要安全复核" : "已阻断",
        caveat:CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      freezeGateSummary:clone(freezeGateSummary),
      evidenceFreezePackSummary:clone(evidenceFreezePackSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      pilotExitCriteriaSummary:clone(pilotExitCriteriaSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      operatorConsoleSummary:clone(operatorConsoleSummary),
      releaseReadinessSummary:clone(releaseReadinessSummary),
      safeToStartRcReview:reviewDecision.safeToStartRcReview === true,
      safety:safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowRcCandidateReviewConsole(model) {
    const safe = obj(model);
    const status = /^(ready_for_review|evidence_incomplete|needs_safety_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const reviewDecision = obj(safe.reviewDecision);
    const reviewHealth = Object.assign({
      freezeGateReady:false,
      evidenceFreezePackReady:false,
      launchCandidateReady:false,
      pilotExitCriteriaMet:false,
      safetySentinelPass:false,
      releaseReadinessReady:false,
      noSensitiveDataRisk:false,
      noTradingRisk:false,
      noSecretRisk:false,
      noExternalOpenRisk:false
    }, obj(safe.reviewHealth));
    const summary = obj(safe.userFacingSummary);
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION,
      status:status,
      reviewDecision:{
        decisionId:/^(start_rc_review|collect_more_evidence|safety_review|blocked)$/.test(reviewDecision.decisionId) ? reviewDecision.decisionId : "blocked",
        label:text(reviewDecision.label || "已阻断"),
        message:text(reviewDecision.message || "已阻断"),
        safeToStartRcReview:reviewDecision.safeToStartRcReview === true
      },
      reviewHealth:reviewHealth,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      missingEvidence:toArray(safe.missingEvidence).map(text),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{
        title:"只读 RC 候选复核控制台",
        resultLabel:summary.resultLabel || (status === "ready_for_review" ? "可以开始 RC 复核" : status === "evidence_incomplete" ? "证据仍需补充" : status === "needs_safety_review" ? "需要安全复核" : "已阻断"),
        caveat:summary.caveat || CAVEAT,
        redacted:true
      },
      rcCopyFinalizationSummary:clone(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary:clone(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewStatus:text(safe.rcCopyReviewStatus || ""),
      safetyDisclosureStatus:text(safe.safetyDisclosureStatus || ""),
      safeToFinalizeUserFacingCopy:safe.safeToFinalizeUserFacingCopy === true,
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      operatorConsoleSummary:clone(safe.operatorConsoleSummary || null),
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      safeToStartRcReview:safe.safeToStartRcReview === true || reviewDecision.safeToStartRcReview === true,
      safety:Object.assign(safety(), obj(safe.safety)),
      redacted:true
    });
  }
  function buildFlightWorkflowRcCandidateReviewConsole(input) {
    try {
      return sanitizeFlightWorkflowRcCandidateReviewConsole(evaluateFlightWorkflowRcCandidateReview(input || {}));
    } catch (error) {
      return sanitizeFlightWorkflowRcCandidateReviewConsole({
        status:"failed_safe",
        reviewDecision:{ decisionId:"blocked", label:"已阻断", message:"输入异常，已安全降级。", safeToStartRcReview:false },
        reviewHealth:{},
        rows:[],
        missingEvidence:[],
        blockedReasons:["failed_safe"],
        userFacingSummary:{ title:"只读 RC 候选复核控制台", resultLabel:"已阻断", caveat:CAVEAT, redacted:true }
      });
    }
  }
  function buildFlightWorkflowRcCandidateReviewConsoleAuditDraft(input) {
    const model = buildFlightWorkflowRcCandidateReviewConsole(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION,
      status:model.status,
      safeToStartRcReview:model.safeToStartRcReview === true,
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

  window.WeishanFlightWorkflowRcCandidateReviewConsole = {
    FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildFlightWorkflowRcCandidateReviewConsole,
    evaluateFlightWorkflowRcCandidateReview,
    buildFlightWorkflowRcCandidateReviewRows,
    buildFlightWorkflowRcCandidateReviewConsoleAuditDraft,
    sanitizeFlightWorkflowRcCandidateReviewConsole
  };
})();
