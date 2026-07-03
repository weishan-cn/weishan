;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION = "4.1.6";
  const CRITERIA_NAME = "flight_workflow_read_only_pilot_exit_criteria_v1";
  const CAVEAT = "该判断只适用于只读候选证据流程，不代表真实账号、客服工单、交易请求或出票能力。";

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
      realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false,
      rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null,
      paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false,
      autoOpen:false, autoRefresh:false, redacted:true
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
  function pick(input, directKeys, globalName, fnName) {
    const safe = obj(input);
    for (let i = 0; i < directKeys.length; i += 1) {
      const candidate = obj(safe[directKeys[i]]);
      if (Object.keys(candidate).length) return candidate;
    }
    const loaded = api(globalName);
    return typeof loaded[fnName] === "function" ? loaded[fnName](safe) : {};
  }
  function pilotOpsOf(input) { return pick(input, ["pilotOpsSummary", "readOnlyPilotOpsSummary"], "WeishanFlightWorkflowReadOnlyPilotOpsSummary", "buildFlightWorkflowReadOnlyPilotOpsSummary"); }
  function nextCohortDecisionOf(input) { return pick(input, ["nextCohortDecisionSummary", "nextCohortDecisionBoard"], "WeishanFlightWorkflowNextCohortDecisionBoard", "buildFlightWorkflowNextCohortDecisionBoard"); }
  function rolloutControlOf(input) { return pick(input, ["rolloutControlSummary", "readOnlyPilotRolloutControlCenter"], "WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter", "buildFlightWorkflowReadOnlyPilotRolloutControlCenter"); }
  function cohortHealthOf(input) { return pick(input, ["cohortHealthSummary", "cohortHealthDashboard"], "WeishanFlightWorkflowCohortHealthDashboard", "buildFlightWorkflowCohortHealthDashboard"); }
  function supportReadinessOf(input) { return pick(input, ["supportReadinessSummary", "supportReadinessGate"], "WeishanFlightWorkflowSupportReadinessGate", "buildFlightWorkflowSupportReadinessGate"); }
  function issuePatternOf(input) { return pick(input, ["issuePatternSummary", "issuePatternRadar", "issuePatternViewModelSummary"], "WeishanFlightWorkflowPublicPilotIssuePatternRadar", "buildFlightWorkflowPublicPilotIssuePatternRadar"); }
  function sentinelOf(input) { return pick(input, ["safetyRegressionSummary", "safetyRegressionSentinel"], "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport"); }
  function releaseReadinessOf(input) { return pick(input, ["releaseReadinessSummary", "releaseReadinessDashboard"], "WeishanFlightWorkflowReleaseReadinessDashboard", "buildFlightWorkflowReleaseReadinessDashboard"); }
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
  function evaluateFlightWorkflowReadOnlyPilotExitCriteria(input) {
    const safe = obj(input);
    const pilotOpsSummary = pilotOpsOf(safe);
    const nextCohortDecisionSummary = nextCohortDecisionOf(safe);
    const rolloutControlSummary = rolloutControlOf(safe);
    const cohortHealthSummary = cohortHealthOf(safe);
    const supportReadinessSummary = supportReadinessOf(safe);
    const issuePatternSummary = issuePatternOf(safe);
    const safetyRegressionSummary = sentinelOf(safe);
    const releaseReadinessSummary = releaseReadinessOf(safe);
    const values = [safe, pilotOpsSummary, nextCohortDecisionSummary, rolloutControlSummary, cohortHealthSummary, supportReadinessSummary, issuePatternSummary, safetyRegressionSummary, releaseReadinessSummary];
    const opsHealthy = safe.opsHealthy === true || pilotOpsSummary.status === "healthy" || obj(pilotOpsSummary.opsHealth).safeToContinuePilot === true;
    const nextCohortDecisionReady = safe.nextCohortDecisionReady === true || nextCohortDecisionSummary.status === "advance" || obj(nextCohortDecisionSummary.decision).safeToAdvanceNextCohort === true;
    const cohortHealthReady = safe.cohortHealthReady === true || cohortHealthSummary.status === "healthy" || obj(cohortHealthSummary.cohortHealth).healthyEnoughForNextCohort === true;
    const supportReady = safe.supportReady === true || supportReadinessSummary.status === "ready";
    const issuePatternStable = safe.issuePatternStable === true || issuePatternSummary.status === "ready";
    const safetySentinelPass = safe.safetySentinelPass === false ? false : (safe.safetySentinelPass === true || safetyRegressionSummary.status === "pass");
    const releaseReadinessReady = safe.releaseReadinessReady === true || releaseReadinessSummary.status === "ready" || releaseReadinessSummary.safeForUserFacingBeta === true;
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : !values.some(hasTradingRisk);
    const readyForLaunchCandidate = opsHealthy && nextCohortDecisionReady && cohortHealthReady && supportReady && issuePatternStable && safetySentinelPass && releaseReadinessReady && noSensitiveDataRisk && noTradingRisk;
    const unmetCriteria = [];
    if (!opsHealthy) unmetCriteria.push("opsHealthy");
    if (!nextCohortDecisionReady) unmetCriteria.push("nextCohortDecisionReady");
    if (!cohortHealthReady) unmetCriteria.push("cohortHealthReady");
    if (!supportReady) unmetCriteria.push("supportReady");
    if (!issuePatternStable) unmetCriteria.push("issuePatternStable");
    if (!safetySentinelPass) unmetCriteria.push("safetySentinelPass");
    if (!releaseReadinessReady) unmetCriteria.push("releaseReadinessReady");
    if (!noSensitiveDataRisk) unmetCriteria.push("noSensitiveDataRisk");
    if (!noTradingRisk) unmetCriteria.push("noTradingRisk");
    let status = "continue_pilot";
    if (!safetySentinelPass || !noSensitiveDataRisk || !noTradingRisk) status = "blocked";
    else if (!supportReady || !releaseReadinessReady) status = "needs_review";
    else if (!issuePatternStable || !cohortHealthReady || !opsHealthy || !nextCohortDecisionReady) status = "continue_pilot";
    else if (readyForLaunchCandidate) status = "met";
    const resultLabel = status === "met" ? "可以进入只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "已阻断";
    return clone({
      criteriaName:CRITERIA_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION,
      status:status,
      exitHealth:{ opsHealthy, nextCohortDecisionReady, cohortHealthReady, supportReady, issuePatternStable, safetySentinelPass, releaseReadinessReady, noSensitiveDataRisk, noTradingRisk, readyForLaunchCandidate },
      rows:[
        row("ops_healthy", "试点运营", opsHealthy ? "试点运行健康" : "继续试点观察", opsHealthy ? "pass" : "warning"),
        row("next_cohort_ready", "下一批决策", nextCohortDecisionReady ? "下一批可推进" : "继续试点观察", nextCohortDecisionReady ? "pass" : "warning"),
        row("cohort_health_ready", "批次健康", cohortHealthReady ? "批次健康" : "继续试点观察", cohortHealthReady ? "pass" : "warning"),
        row("support_ready", "支持准备", supportReady ? "支持准备就绪" : "需要复核", supportReady ? "pass" : "warning"),
        row("issue_pattern_stable", "问题趋势", issuePatternStable ? "问题趋势稳定" : "继续试点观察", issuePatternStable ? "pass" : "warning"),
        row("safety_sentinel_pass", "安全回归", safetySentinelPass ? "安全回归通过" : "已阻断", safetySentinelPass ? "pass" : "blocked"),
        row("release_readiness_ready", "发布就绪", releaseReadinessReady ? "发布就绪" : "需要复核", releaseReadinessReady ? "pass" : "warning"),
        row("launch_candidate", "Launch Candidate", readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", readyForLaunchCandidate ? "pass" : (status === "blocked" ? "blocked" : "warning"))
      ],
      unmetCriteria:unmetCriteria,
      userFacingSummary:{ title:"只读试点退出条件", resultLabel:resultLabel, caveat:CAVEAT, redacted:true },
      safety:safety(),
      pilotOpsSummary:clone(pilotOpsSummary),
      nextCohortDecisionSummary:clone(nextCohortDecisionSummary),
      rolloutControlSummary:clone(rolloutControlSummary),
      cohortHealthSummary:clone(cohortHealthSummary),
      supportReadinessSummary:clone(supportReadinessSummary),
      issuePatternSummary:clone(issuePatternSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      releaseReadinessSummary:clone(releaseReadinessSummary),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyPilotExitCriteriaRows(input) {
    const criteria = evaluateFlightWorkflowReadOnlyPilotExitCriteria(input || {});
    return clone(criteria.rows || []);
  }
  function sanitizeFlightWorkflowReadOnlyPilotExitCriteria(criteria) {
    const safe = obj(criteria);
    const status = /^(met|continue_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const exitHealth = Object.assign({
      opsHealthy:false, nextCohortDecisionReady:false, cohortHealthReady:false, supportReady:false, issuePatternStable:false,
      safetySentinelPass:false, releaseReadinessReady:false, noSensitiveDataRisk:false, noTradingRisk:false, readyForLaunchCandidate:false
    }, obj(safe.exitHealth));
    const summary = obj(safe.userFacingSummary);
    return clone({
      criteriaName:CRITERIA_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION,
      status:status,
      exitHealth:exitHealth,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      unmetCriteria:toArray(safe.unmetCriteria).map(text),
      userFacingSummary:{ title:"只读试点退出条件", resultLabel:summary.resultLabel || (status === "met" ? "可以进入只读发布候选" : status === "continue_pilot" ? "继续试点观察" : status === "needs_review" ? "需要复核" : "已阻断"), caveat:summary.caveat || CAVEAT, redacted:true },
      pilotOpsSummary:clone(safe.pilotOpsSummary || null),
      nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null),
      rolloutControlSummary:clone(safe.rolloutControlSummary || null),
      cohortHealthSummary:clone(safe.cohortHealthSummary || null),
      supportReadinessSummary:clone(safe.supportReadinessSummary || null),
      issuePatternSummary:clone(safe.issuePatternSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      releaseReadinessSummary:clone(safe.releaseReadinessSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcReviewStatus:text(safe.rcReviewStatus || (obj(safe.rcCandidateReviewSummary).status || "")),
      rcEvidenceStatus:text(safe.rcEvidenceStatus || (obj(safe.rcEvidenceReviewSummary).status || "")),
      safeToStartRcReview:safe.safeToStartRcReview === true,
      safety:Object.assign(safety(), obj(safe.safety)),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyPilotExitCriteria(input) {
    try {
      const criteria = evaluateFlightWorkflowReadOnlyPilotExitCriteria(input || {});
      return sanitizeFlightWorkflowReadOnlyPilotExitCriteria(criteria);
    } catch (error) {
      return sanitizeFlightWorkflowReadOnlyPilotExitCriteria({ status:"failed_safe", exitHealth:{}, rows:[], unmetCriteria:["failed_safe"], userFacingSummary:{ title:"只读试点退出条件", resultLabel:"已阻断", caveat:CAVEAT, redacted:true } });
    }
  }
  function buildFlightWorkflowReadOnlyPilotExitCriteriaAuditDraft(input) {
    const criteria = buildFlightWorkflowReadOnlyPilotExitCriteria(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_AUDIT_DRAFT",
      criteriaName:CRITERIA_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION,
      status:criteria.status,
      readyForLaunchCandidate:criteria.exitHealth.readyForLaunchCandidate === true,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false,
      secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowReadOnlyPilotExitCriteria = {
    FLIGHT_WORKFLOW_READ_ONLY_PILOT_EXIT_CRITERIA_VERSION,
    CRITERIA_NAME,
    buildFlightWorkflowReadOnlyPilotExitCriteria,
    evaluateFlightWorkflowReadOnlyPilotExitCriteria,
    buildFlightWorkflowReadOnlyPilotExitCriteriaRows,
    buildFlightWorkflowReadOnlyPilotExitCriteriaAuditDraft,
    sanitizeFlightWorkflowReadOnlyPilotExitCriteria
  };
})();
