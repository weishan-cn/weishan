;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_VERSION = "3.4.0";
  const BOARD_NAME = "flight_workflow_next_cohort_decision_board_v1";
  const CAVEAT = "该决策只适用于只读试点节奏，不代表真实账号、邀请、交易或出票能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim().replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function api(name) { return window[name] || {}; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function opsSummary(input) { const safe = obj(input); return first(safe.pilotOpsSummary, safe.readOnlyPilotOpsSummary); }
  function rolloutControl(input) { const safe = obj(input); return first(safe.rolloutControlSummary, safe.readOnlyPilotRolloutControlCenter); }
  function cohortHealth(input) { const safe = obj(input); return first(safe.cohortHealthSummary, safe.cohortHealthDashboard); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function sentinel(input) { const safe = obj(input); return first(safe.safetyRegressionSummary, safe.safetyRegressionSentinel); }
  function exitCriteria(input) { const safe = obj(input); return first(safe.pilotExitCriteriaSummary, safe.exitCriteriaSummary); }
  function launchCandidateReadiness(input) { const safe = obj(input); return first(safe.launchCandidateReadinessSummary, safe.launchCandidateSummary, safe.launchCandidateReadinessBoard); }
  function hasTradingUrl(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || nested.bookingUrl || nested.checkoutUrl || nested.paymentUrl || nested.orderUrl);
  }
  function buildOps(input) {
    const safe = obj(input);
    const summary = opsSummary(safe);
    if (Object.keys(summary).length) return summary;
    const apiRef = api("WeishanFlightWorkflowReadOnlyPilotOpsSummary");
    return typeof apiRef.buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? apiRef.buildFlightWorkflowReadOnlyPilotOpsSummary(safe) : {};
  }
  function evaluateFlightWorkflowNextCohortDecision(input) {
    const safe = obj(input);
    const ops = buildOps(safe);
    const rollout = rolloutControl(safe);
    const cohort = cohortHealth(safe);
    const support = supportReadiness(safe);
    const pattern = issuePattern(safe);
    const sent = sentinel(safe);
    const exitCriteriaSummary = exitCriteria(safe);
    const launchCandidateReadinessSummary = launchCandidateReadiness(safe);
    const opsHealth = obj(ops.opsHealth);
    const criteria = {
      opsHealthy: safe.opsHealthy === true || ops.status === "healthy" || obj(opsHealth).safeToContinuePilot === true,
      rolloutReady: safe.rolloutReady === true || opsHealth.rolloutReady === true || rollout.status === "ready" || obj(rollout.decision).safeToAdvanceNextCohort === true,
      cohortHealthy: safe.cohortHealthy === true || opsHealth.cohortHealthy === true || cohort.status === "healthy",
      supportReady: safe.supportReady === true || opsHealth.supportReady === true || support.status === "ready",
      issuePatternStable: safe.issuePatternStable === true || opsHealth.issuePatternStable === true || pattern.status === "ready",
      noOpenBlockingIssue: safe.noOpenBlockingIssue === true || (support.status !== "blocked" && pattern.status !== "blocked" && obj(ops.primaryRisk).riskId !== "unknown"),
      noSensitiveDataRisk: safe.noSensitiveDataRisk === true || opsHealth.noSensitiveDataRisk === true,
      noTradingRisk: safe.noTradingRisk === true || opsHealth.noTradingRisk === true,
      pilotExitCriteriaMet: safe.pilotExitCriteriaMet === true || obj(exitCriteriaSummary.exitHealth).readyForLaunchCandidate === true || exitCriteriaSummary.status === "met",
      releaseReadinessReady: safe.releaseReadinessReady === true || obj(launchCandidateReadinessSummary).releaseReadinessReady === true || obj(launchCandidateReadinessSummary).status === "ready"
    };
    const allTrue = Object.keys(criteria).every(function (key) { return criteria[key] === true; });
    const blocked = !criteria.noSensitiveDataRisk || !criteria.noTradingRisk || sent.status === "fail" || sent.status === "failed_safe" || obj(ops.primaryRisk).riskId === "sensitive_data" || obj(ops.primaryRisk).riskId === "trading_risk";
    const unmetCriteria = Object.keys(criteria).filter(function (key) { return criteria[key] !== true; });
    let status = "continue_current";
    let decisionId = "continue_current_batch";
    let label = "继续当前批次";
    let message = "当前条件仍在积累，继续当前批次。";
    if (blocked) {
      status = "blocked";
      decisionId = "blocked";
      label = "已阻断";
      message = "存在敏感数据、交易或安全回归风险，已阻断。";
    } else if (!criteria.supportReady || !criteria.noOpenBlockingIssue) {
      status = "needs_review";
      decisionId = "internal_review";
      label = "需要内部复核";
      message = "支持准备或阻断事项仍需内部复核。";
    } else if (!criteria.issuePatternStable) {
      status = "pause";
      decisionId = "pause_expansion";
      label = "暂停扩大测试";
      message = "问题趋势不稳定，建议暂停扩大测试。";
    } else if (!criteria.rolloutReady || !criteria.cohortHealthy) {
      status = "continue_current";
      decisionId = "continue_current_batch";
      label = "继续当前批次";
      message = "发布控制或当前批次健康仍在积累，继续当前批次。";
    } else if (allTrue) {
      status = "advance";
      decisionId = "advance_next_cohort";
      label = "可以进入下一批只读测试";
      message = "运营条件已满足，可以进入下一批只读测试。";
    }
    return clone({
      status:status,
      decision:{ decisionId:decisionId, label:label, message:message, safeToAdvanceNextCohort:decisionId === "advance_next_cohort" },
      criteria:criteria,
      unmetCriteria:unmetCriteria,
      decisionRows:[
        row("decision", "决策", label, status === "blocked" ? "blocked" : status === "advance" ? "pass" : "warning"),
        row("ops", "运营摘要", ops.status === "healthy" ? "试点运行健康" : ops.status === "continue_current_batch" ? "继续当前批次" : ops.status === "pause_expansion" ? "暂停扩大测试" : ops.status === "needs_review" ? "需要复核" : "已阻断", ops.status === "healthy" ? "pass" : (ops.status === "blocked" ? "blocked" : "warning")),
        row("criteria", "关键条件", unmetCriteria.length === 0 ? "全部满足" : unmetCriteria.join("、"), unmetCriteria.length === 0 ? "pass" : (status === "blocked" ? "blocked" : "warning")),
        row("next", "下一步", decisionId === "advance_next_cohort" ? "可以进入下一批只读测试" : (status === "blocked" ? "已阻断" : status === "pause" ? "暂停扩大测试" : "继续当前批次"), decisionId === "advance_next_cohort" ? "pass" : (status === "blocked" ? "blocked" : "warning"))
      ],
      opsSummary:clone(ops),
      rolloutControlSummary:clone(rollout),
      cohortHealthSummary:clone(cohort),
      supportReadinessSummary:clone(support),
      issuePatternSummary:clone(pattern),
      safetyRegressionSummary:clone(sent),
      pilotExitCriteriaSummary:clone(exitCriteriaSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      launchCandidateStatus:obj(launchCandidateReadinessSummary).status || (criteria.pilotExitCriteriaMet && criteria.releaseReadinessReady ? "ready" : "continue_pilot"),
      readyForLaunchCandidate:obj(launchCandidateReadinessSummary).launchCandidateReadiness && obj(launchCandidateReadinessSummary).launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true,
      launchCandidateNextStep:text(obj(launchCandidateReadinessSummary).launchCandidateNextStep || (criteria.pilotExitCriteriaMet ? "继续试点观察" : "继续试点观察")),
      userFacingSummary:{ title:"下一批只读测试决策板", resultLabel:status === "advance" ? "可以进入下一批只读测试" : status === "continue_current" ? "继续当前批次" : status === "pause" ? "暂停扩大测试" : status === "needs_review" ? "需要内部复核" : "已阻断", caveat:CAVEAT, redacted:true },
      safety:safety(),
      redacted:true
    });
  }
  function buildFlightWorkflowNextCohortDecisionRows(input) {
    const decision = evaluateFlightWorkflowNextCohortDecision(input || {});
    return clone([
      row("decision", "决策", decision.decision.label, decision.status === "blocked" ? "blocked" : decision.status === "advance" ? "pass" : "warning"),
      row("ops", "运营摘要", decision.opsSummary.status === "healthy" ? "试点运行健康" : decision.opsSummary.status === "continue_current_batch" ? "继续当前批次" : decision.opsSummary.status === "pause_expansion" ? "暂停扩大测试" : decision.opsSummary.status === "needs_review" ? "需要复核" : "已阻断", decision.opsSummary.status === "healthy" ? "pass" : (decision.opsSummary.status === "blocked" ? "blocked" : "warning")),
      row("criteria", "关键条件", decision.unmetCriteria.length === 0 ? "全部满足" : decision.unmetCriteria.join("、"), decision.unmetCriteria.length === 0 ? "pass" : (decision.status === "blocked" ? "blocked" : "warning")),
      row("next", "下一步", decision.decision.safeToAdvanceNextCohort ? "可以进入下一批只读测试" : (decision.status === "blocked" ? "已阻断" : decision.status === "pause" ? "暂停扩大测试" : "继续当前批次"), decision.decision.safeToAdvanceNextCohort ? "pass" : (decision.status === "blocked" ? "blocked" : "warning"))
    ]);
  }
  function sanitizeFlightWorkflowNextCohortDecisionBoard(board) {
    const safe = obj(board);
    const status = /^(advance|continue_current|pause|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const decision = obj(safe.decision);
    const criteria = Object.assign({ opsHealthy:false, rolloutReady:false, cohortHealthy:false, supportReady:false, issuePatternStable:false, noOpenBlockingIssue:false, noSensitiveDataRisk:false, noTradingRisk:false }, obj(safe.criteria));
    return clone({
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_VERSION,
      status:status,
      decision:{ decisionId:/^(advance_next_cohort|continue_current_batch|pause_expansion|internal_review|blocked)$/.test(decision.decisionId) ? decision.decisionId : "blocked", label:text(decision.label || "已阻断"), message:text(decision.message || "已阻断"), safeToAdvanceNextCohort:decision.safeToAdvanceNextCohort === true },
      criteria:criteria,
      unmetCriteria:toArray(safe.unmetCriteria).map(text),
      decisionRows:toArray(safe.decisionRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      opsSummary:clone(safe.opsSummary || null),
      rolloutControlSummary:clone(safe.rolloutControlSummary || null),
      cohortHealthSummary:clone(safe.cohortHealthSummary || null),
      supportReadinessSummary:clone(safe.supportReadinessSummary || null),
      issuePatternSummary:clone(safe.issuePatternSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      launchCandidateStatus:text(safe.launchCandidateStatus || "continue_pilot"),
      readyForLaunchCandidate:safe.readyForLaunchCandidate === true,
      launchCandidateNextStep:text(safe.launchCandidateNextStep || "继续试点观察"),
      userFacingSummary:Object.assign({ title:"下一批只读测试决策板", resultLabel:status === "advance" ? "可以进入下一批只读测试" : status === "continue_current" ? "继续当前批次" : status === "pause" ? "暂停扩大测试" : status === "needs_review" ? "需要内部复核" : "已阻断", caveat:CAVEAT, redacted:true }, obj(safe.userFacingSummary)),
      safety:Object.assign(safety(), obj(safe.safety)),
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
    });
  }
  function buildFlightWorkflowNextCohortDecisionBoard(input) {
    try {
      const decision = evaluateFlightWorkflowNextCohortDecision(input || {});
      return sanitizeFlightWorkflowNextCohortDecisionBoard({
        status:decision.status,
        decision:decision.decision,
        criteria:decision.criteria,
        unmetCriteria:decision.unmetCriteria,
        decisionRows:decision.decisionRows,
        opsSummary:decision.opsSummary,
        rolloutControlSummary:decision.rolloutControlSummary,
        cohortHealthSummary:decision.cohortHealthSummary,
        supportReadinessSummary:decision.supportReadinessSummary,
        issuePatternSummary:decision.issuePatternSummary,
        safetyRegressionSummary:decision.safetyRegressionSummary,
        pilotExitCriteriaSummary:decision.pilotExitCriteriaSummary,
        launchCandidateReadinessSummary:decision.launchCandidateReadinessSummary,
        freezeGateSummary:decision.freezeGateSummary,
        evidenceFreezePackSummary:decision.evidenceFreezePackSummary,
        launchCandidateStatus:decision.launchCandidateStatus,
        readyForLaunchCandidate:decision.readyForLaunchCandidate === true,
        launchCandidateNextStep:decision.launchCandidateNextStep,
        userFacingSummary:decision.userFacingSummary,
        safety:safety()
      });
    } catch (error) {
      return sanitizeFlightWorkflowNextCohortDecisionBoard({ status:"failed_safe", decision:{ decisionId:"blocked", label:"已阻断", message:"输入异常，已安全降级。", safeToAdvanceNextCohort:false }, criteria:{}, unmetCriteria:["failed_safe"], decisionRows:[], userFacingSummary:{ title:"下一批只读测试决策板", resultLabel:"已阻断", caveat:CAVEAT, redacted:true } });
    }
  }
  function buildFlightWorkflowNextCohortDecisionBoardAuditDraft(input) {
    const board = buildFlightWorkflowNextCohortDecisionBoard(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_VERSION,
      status:board.status,
      decisionId:board.decision.decisionId,
      safeToAdvanceNextCohort:board.decision.safeToAdvanceNextCohort === true,
      launchCandidateStatus:board.launchCandidateStatus,
      readyForLaunchCandidate:board.readyForLaunchCandidate === true,
      launchCandidateNextStep:board.launchCandidateNextStep,
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

  window.WeishanFlightWorkflowNextCohortDecisionBoard = {
    FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_VERSION,
    BOARD_NAME,
    buildFlightWorkflowNextCohortDecisionBoard,
    evaluateFlightWorkflowNextCohortDecision,
    buildFlightWorkflowNextCohortDecisionRows,
    buildFlightWorkflowNextCohortDecisionBoardAuditDraft,
    sanitizeFlightWorkflowNextCohortDecisionBoard
  };
})();
