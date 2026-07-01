;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION = "3.4.0";
  const GATE_NAME = "flight_workflow_read_only_launch_candidate_freeze_gate_v1";
  const CAVEAT = "该页面只用于只读发布候选冻结判断，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() {
    return {
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, fileWrite:false, download:false,
      autoOpen:false, autoRefresh:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false,
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }
  function pilotExitCriteriaOf(input) {
    const safe = obj(input);
    return first(safe.pilotExitCriteriaSummary, safe.exitCriteriaSummary, typeof api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? api("WeishanFlightWorkflowReadOnlyPilotExitCriteria").buildFlightWorkflowReadOnlyPilotExitCriteria(safe) : null);
  }
  function launchCandidateReadinessOf(input) {
    const safe = obj(input);
    return first(safe.launchCandidateReadinessSummary, safe.launchCandidateSummary, typeof api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? api("WeishanFlightWorkflowLaunchCandidateReadinessBoard").buildFlightWorkflowLaunchCandidateReadinessBoard(safe) : null);
  }
  function releaseReadinessOf(input) {
    const safe = obj(input);
    return first(safe.releaseReadinessSummary, safe.releaseReadinessDashboard, typeof api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard === "function" ? api("WeishanFlightWorkflowReleaseReadinessDashboard").buildFlightWorkflowReleaseReadinessDashboard(safe) : null);
  }
  function sentinelOf(input) {
    const safe = obj(input);
    return first(safe.safetyRegressionSummary, safe.safetyRegressionSentinel, typeof api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport === "function" ? api("WeishanFlightWorkflowSafetyRegressionSentinel").buildFlightWorkflowSafetyRegressionReport(safe) : null);
  }
  function evidencePackOf(input) {
    const safe = obj(input);
    return first(safe.evidenceFreezePackSummary, safe.freezePackSummary, typeof api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack === "function" ? api("WeishanFlightWorkflowEvidenceFreezePack").buildFlightWorkflowEvidenceFreezePack(safe) : null);
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
  function evaluateFlightWorkflowReadOnlyLaunchCandidateFreezeGate(input) {
    const safe = obj(input);
    const pilotExitCriteriaSummary = pilotExitCriteriaOf(safe);
    const launchCandidateReadinessSummary = launchCandidateReadinessOf(safe);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const evidenceFreezePackSummary = evidencePackOf(safe);
    const values = [safe, pilotExitCriteriaSummary, launchCandidateReadinessSummary, releaseReadinessSummary, safetyRegressionSummary, evidenceFreezePackSummary];
    const pilotExitCriteriaMet = safe.pilotExitCriteriaMet === true || pilotExitCriteriaSummary.status === "met" || obj(pilotExitCriteriaSummary.exitHealth).readyForLaunchCandidate === true;
    const launchCandidateReady = safe.launchCandidateReady === true || launchCandidateReadinessSummary.status === "ready" || obj(launchCandidateReadinessSummary.launchCandidateReadiness).safeForReadOnlyLaunchCandidate === true;
    const releaseReadinessReady = safe.releaseReadinessReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.safeForUserFacingBeta === true;
    const safetyRegressionPass = safe.safetyRegressionPass === false ? false : (safe.safetyRegressionPass === true || safetyRegressionSummary.status === "pass");
    const evidencePackReady = safe.evidencePackReady === true || evidenceFreezePackSummary.status === "ready" || evidenceFreezePackSummary.safeToFreeze === true;
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : !values.some(hasTradingRisk);
    const freezeReady = pilotExitCriteriaMet && launchCandidateReady && releaseReadinessReady && safetyRegressionPass && evidencePackReady && noSensitiveDataRisk && noTradingRisk;
    const freezeRequested = safe.freezeRequested === true;
    const freezeDecision = freezeReady
      ? (freezeRequested ? { decisionId:"freeze_read_only_launch_candidate", label:"已冻结只读发布候选", message:"冻结检查已通过，发布候选已冻结。", frozen:true, safeToFreeze:true }
        : { decisionId:"ready_to_freeze", label:"准备冻结只读发布候选", message:"冻结检查已通过，可以冻结发布候选。", frozen:false, safeToFreeze:true })
      : (!pilotExitCriteriaMet || !launchCandidateReady
        ? { decisionId:"continue_pilot", label:"继续试点观察", message:"试点退出条件或发布候选准备尚未完成。", frozen:false, safeToFreeze:false }
        : (!releaseReadinessReady || !evidencePackReady
          ? { decisionId:"internal_review", label:"需要复核", message:"发布就绪或证据冻结包仍需复核。", frozen:false, safeToFreeze:false }
          : { decisionId:"blocked", label:"已阻断", message:"检测到安全回归、敏感数据或交易风险。", frozen:false, safeToFreeze:false }));
    let status = freezeDecision.decisionId === "freeze_read_only_launch_candidate" ? "frozen" : (freezeDecision.decisionId === "ready_to_freeze" ? "ready_to_freeze" : freezeDecision.decisionId === "continue_pilot" ? "continue_pilot" : freezeDecision.decisionId === "internal_review" ? "needs_review" : "blocked");
    if (!safetyRegressionPass || !noSensitiveDataRisk || !noTradingRisk) status = "blocked";
    const resultLabel = status === "frozen" ? "已冻结只读发布候选" : status === "ready_to_freeze" ? "准备冻结只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "已阻断";
    return clone({
      gateName:GATE_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION,
      status:status,
      freezeDecision:freezeDecision,
      freezeReady:freezeReady,
      freezeRequested:freezeRequested,
      rows:[
        row("pilot_exit_criteria", "试点退出条件", pilotExitCriteriaMet ? "试点退出条件已满足" : "继续试点观察", pilotExitCriteriaMet ? "pass" : "warning"),
        row("launch_candidate", "发布候选", launchCandidateReady ? "发布候选已准备" : "继续试点观察", launchCandidateReady ? "pass" : "warning"),
        row("release_readiness", "发布就绪", releaseReadinessReady ? "发布就绪" : "需要复核", releaseReadinessReady ? "pass" : "warning"),
        row("evidence_pack", "证据冻结包", evidencePackReady ? "证据冻结包已准备" : "需要复核", evidencePackReady ? "pass" : "warning"),
        row("safety_regression", "安全回归", safetyRegressionPass ? "安全回归通过" : "已阻断", safetyRegressionPass ? "pass" : "blocked"),
        row("safety_redline", "安全红线", noSensitiveDataRisk && noTradingRisk ? "安全红线正常" : "已阻断", noSensitiveDataRisk && noTradingRisk ? "pass" : "blocked"),
        row("freeze_status", "冻结状态", resultLabel, status === "blocked" ? "blocked" : (status === "frozen" ? "pass" : "warning"))
      ],
      blockedReasons:freezeReady ? [] : [!pilotExitCriteriaMet ? "pilot_exit_criteria_not_met" : null, !launchCandidateReady ? "launch_candidate_not_ready" : null, !releaseReadinessReady ? "release_readiness_not_ready" : null, !evidencePackReady ? "evidence_pack_not_ready" : null, !safetyRegressionPass ? "safety_regression_failed" : null, !noSensitiveDataRisk ? "sensitive_data_risk" : null, !noTradingRisk ? "trading_risk" : null].filter(Boolean),
      userFacingSummary:{ title:"只读发布候选冻结检查", resultLabel:resultLabel, caveat:CAVEAT, redacted:true },
      safety:safety(),
      pilotExitCriteriaSummary:clone(pilotExitCriteriaSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      releaseReadinessSummary:clone(releaseReadinessSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      evidenceFreezePackSummary:clone(evidenceFreezePackSummary),
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary:clone(safe.releaseRiskLedgerSummary || null),
      freezeGateNextStep:status === "frozen" ? "继续后续封版工作" : status === "ready_to_freeze" ? "可以冻结只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂停冻结并复核安全红线",
      freezeGateStatus:status,
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      rcRegressionStatus:text(safe.rcRegressionStatus || (obj(safe.rcRegressionAuditSummary).status || "")),
      releaseRiskStatus:text(safe.releaseRiskStatus || (obj(safe.releaseRiskLedgerSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true || obj(safe.rcCandidateReviewSummary).safeToStartRcReview === true,
      safeToContinueReleaseCandidate:safe.safeToContinueReleaseCandidate === true || obj(safe.releaseRiskLedgerSummary).riskSummary && obj(safe.releaseRiskLedgerSummary).riskSummary.safeToContinueReleaseCandidate === true,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyLaunchCandidateFreezeGateRows(input) { const gate = evaluateFlightWorkflowReadOnlyLaunchCandidateFreezeGate(input || {}); return clone(gate.rows || []); }
  function sanitizeFlightWorkflowReadOnlyLaunchCandidateFreezeGate(gate) {
    const safe = obj(gate);
    const status = /^(frozen|ready_to_freeze|continue_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const summary = obj(safe.userFacingSummary);
    const decision = obj(safe.freezeDecision);
    return clone({
      gateName:GATE_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION,
      status:status,
      freezeDecision:{
        decisionId:/^(freeze_read_only_launch_candidate|ready_to_freeze|continue_pilot|internal_review|blocked)$/.test(decision.decisionId) ? decision.decisionId : "blocked",
        label:text(decision.label || "已阻断"),
        message:text(decision.message || "已阻断"),
        frozen:decision.frozen === true,
        safeToFreeze:decision.safeToFreeze === true
      },
      freezeReady:safe.freezeReady === true,
      freezeRequested:safe.freezeRequested === true,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      blockedReasons:toArray(safe.blockedReasons).map(text),
      userFacingSummary:{ title:"只读发布候选冻结检查", resultLabel:summary.resultLabel || (status === "frozen" ? "已冻结只读发布候选" : status === "ready_to_freeze" ? "准备冻结只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "已阻断"), caveat:summary.caveat || CAVEAT, redacted:true },
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary:clone(safe.releaseRiskLedgerSummary || null),
      freezeGateNextStep:text(safe.freezeGateNextStep || (status === "frozen" ? "继续后续封版工作" : status === "ready_to_freeze" ? "可以冻结只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "暂停冻结并复核安全红线")),
      freezeGateStatus:text(safe.freezeGateStatus || status),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      rcRegressionStatus:text(safe.rcRegressionStatus || (obj(safe.rcRegressionAuditSummary).status || "")),
      releaseRiskStatus:text(safe.releaseRiskStatus || (obj(safe.releaseRiskLedgerSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true || obj(safe.rcCandidateReviewSummary).safeToStartRcReview === true,
      safeToContinueReleaseCandidate:safe.safeToContinueReleaseCandidate === true || obj(safe.releaseRiskLedgerSummary).riskSummary && obj(safe.releaseRiskLedgerSummary).riskSummary.safeToContinueReleaseCandidate === true,
      safety:Object.assign(safety(), obj(safe.safety)),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(input) {
    try { return sanitizeFlightWorkflowReadOnlyLaunchCandidateFreezeGate(evaluateFlightWorkflowReadOnlyLaunchCandidateFreezeGate(input || {})); }
    catch (error) {
      return sanitizeFlightWorkflowReadOnlyLaunchCandidateFreezeGate({ status:"failed_safe", freezeDecision:{ decisionId:"blocked", label:"已阻断", message:"输入异常，已安全降级。", frozen:false, safeToFreeze:false }, rows:[], blockedReasons:["failed_safe"], userFacingSummary:{ title:"只读发布候选冻结检查", resultLabel:"已阻断", caveat:CAVEAT, redacted:true } });
    }
  }
  function buildFlightWorkflowReadOnlyLaunchCandidateFreezeGateAuditDraft(input) {
    const gate = buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION,
      status:gate.status,
      freezeReady:gate.freezeReady === true,
      freezeRequested:gate.freezeRequested === true,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false,
      secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate = {
    FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION,
    GATE_NAME,
    buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate,
    evaluateFlightWorkflowReadOnlyLaunchCandidateFreezeGate,
    buildFlightWorkflowReadOnlyLaunchCandidateFreezeGateRows,
    buildFlightWorkflowReadOnlyLaunchCandidateFreezeGateAuditDraft,
    sanitizeFlightWorkflowReadOnlyLaunchCandidateFreezeGate
  };
})();
