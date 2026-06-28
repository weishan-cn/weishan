;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_VERSION = "2.1.95";
  const SUMMARY_NAME = "flight_workflow_read_only_pilot_ops_summary_v1";
  const CAVEAT = "该摘要只用于只读试点运营判断，不代表真实账号、客服工单、交易请求或出票能力。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText|真实姓名|手机号|邮箱/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function api(name) { return window[name] || {}; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function hasTradingUrl(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || nested.bookingUrl || nested.checkoutUrl || nested.paymentUrl || nested.orderUrl);
  }
  function hasSensitiveRisk(value) {
    const safe = obj(value);
    const nested = obj(safe.safety);
    return safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true || safe.realIdentityStored === true || safe.identityUpload === true || safe.credentialInput === true || safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || nested.realNameStored === true || nested.phoneStored === true || nested.emailStored === true || nested.realIdentityStored === true || nested.identityUpload === true || nested.credentialInput === true || nested.rawUserTextStored === true || nested.rawResponseStored === true || nested.secretStored === true;
  }
  function rolloutControl(input) { const safe = obj(input); return first(safe.rolloutControlSummary, safe.readOnlyPilotRolloutControlCenter); }
  function cohortHealth(input) { const safe = obj(input); return first(safe.cohortHealthSummary, safe.cohortHealthDashboard); }
  function progressTracker(input) { const safe = obj(input); return first(safe.cohortProgressSummary, safe.cohortProgressTrackerSummary, safe.publicPilotCohortProgressTrackerSummary); }
  function trialMilestone(input) { const safe = obj(input); return first(safe.trialMilestoneSummary, safe.trialMilestoneBoardSummary, safe.readOnlyTrialMilestoneBoardSummary); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function sentinel(input) { const safe = obj(input); return first(safe.safetyRegressionSummary, safe.safetyRegressionSentinel); }
  function exitCriteria(input) { const safe = obj(input); return first(safe.pilotExitCriteriaSummary, safe.exitCriteriaSummary); }
  function launchCandidateReadiness(input) { const safe = obj(input); return first(safe.launchCandidateReadinessSummary, safe.launchCandidateSummary, safe.launchCandidateReadinessBoard); }
  function primaryRiskFrom(state) {
    if (state.safetySentinelPass === false) return { riskId:"unknown", label:"安全回归未通过", message:"安全回归检查失败，已阻断试点运营。" };
    if (state.noSensitiveDataRisk === false) return { riskId:"sensitive_data", label:"敏感数据风险", message:"检测到真实身份、联系方式、证件或密钥相关风险。" };
    if (state.noTradingRisk === false) return { riskId:"trading_risk", label:"交易风险", message:"检测到付款、下单、出票或交易链接风险。" };
    if (state.supportReady === false) return { riskId:"support_not_ready", label:"支持准备不足", message:"支持兜底尚未准备好，建议继续观察或复核。" };
    if (state.issuePatternStable === false) return { riskId:"issue_pattern", label:"问题趋势不稳定", message:"问题趋势仍不稳定，建议暂停扩大测试。" };
    if (state.cohortHealthy === false) return { riskId:"cohort_incomplete", label:"批次尚未就绪", message:"当前批次进度仍在积累，建议继续当前批次。" };
    return { riskId:"none", label:"无主要风险", message:"当前试点运行健康，可以继续观察下一步决策。" };
  }
  function buildHealth(input) {
    const safe = obj(input);
    const rolloutSummary = rolloutControl(safe);
    const cohortSummary = cohortHealth(safe);
    const progressSummary = progressTracker(safe);
    const milestoneSummary = trialMilestone(safe);
    const snapshotSummary = snapshot(safe);
    const supportSummary = supportReadiness(safe);
    const issuePatternSummary = issuePattern(safe);
    const sentinelSummary = sentinel(safe);
    const pilotExitCriteriaSummary = exitCriteria(safe);
    const launchCandidateReadinessSummary = launchCandidateReadiness(safe);
    const values = [safe, rolloutSummary, cohortSummary, progressSummary, milestoneSummary, snapshotSummary, supportSummary, issuePatternSummary, sentinelSummary];
    const rolloutReady = safe.rolloutReady === true || rolloutSummary.status === "ready" || obj(rolloutSummary.decision).safeToAdvanceNextCohort === true;
    const cohortHealthy = safe.cohortHealthy === true || cohortSummary.status === "healthy" || cohortSummary.status === "in_progress" && obj(cohortSummary.cohortHealth).healthyEnoughForNextCohort === true;
    const milestoneReady = safe.milestoneReady === true || milestoneSummary.safeToAdvanceNextCohort === true || milestoneSummary.status === "ready";
    const supportReady = safe.supportReady === true || supportSummary.status === "ready";
    const issuePatternStable = safe.issuePatternStable === true || issuePatternSummary.status === "ready";
    const safetySentinelPass = safe.safetySentinelPass === false ? false : (safe.safetySentinelPass === true || sentinelSummary.status === "pass");
    const noSensitiveDataRisk = safe.noSensitiveDataRisk === false ? false : !values.some(hasSensitiveRisk);
    const noTradingRisk = safe.noTradingRisk === false ? false : !values.some(hasTradingUrl);
    const safeToContinuePilot = rolloutReady && cohortHealthy && milestoneReady && supportReady && issuePatternStable && safetySentinelPass && noSensitiveDataRisk && noTradingRisk;
    const safeToAdvanceNextCohort = safeToContinuePilot && obj(rolloutSummary.decision).safeToAdvanceNextCohort !== false && milestoneReady;
    const launchCandidateReadinessHealth = obj(launchCandidateReadinessSummary).launchCandidateReadiness || {};
    const launchCandidateStatus = text(obj(launchCandidateReadinessSummary).status || (launchCandidateReadinessHealth.safeForReadOnlyLaunchCandidate ? "ready" : (supportReady ? "continue_pilot" : "needs_review")));
    const readyForLaunchCandidate = safe.readyForLaunchCandidate === true || launchCandidateReadinessHealth.safeForReadOnlyLaunchCandidate === true;
    const launchCandidateNextStep = text(safe.launchCandidateNextStep || obj(launchCandidateReadinessSummary).launchCandidateNextStep || obj(launchCandidateReadinessSummary).userFacingSummary && obj(launchCandidateReadinessSummary).userFacingSummary.resultLabel || (readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察"));
    let status = "continue_current_batch";
    if (!safetySentinelPass || !noSensitiveDataRisk || !noTradingRisk) status = "blocked";
    else if (!supportReady) status = "needs_review";
    else if (!issuePatternStable) status = "pause_expansion";
    else if (!cohortHealthy || !milestoneReady || !rolloutReady) status = "continue_current_batch";
    else if (safeToAdvanceNextCohort) status = "healthy";
    else status = "continue_current_batch";
    const primaryRisk = primaryRiskFrom({ safetySentinelPass:safetySentinelPass, noSensitiveDataRisk:noSensitiveDataRisk, noTradingRisk:noTradingRisk, supportReady:supportReady, issuePatternStable:issuePatternStable, cohortHealthy:cohortHealthy });
    return clone({
      status:status,
      opsHealth:{
        rolloutReady:rolloutReady,
        cohortHealthy:cohortHealthy,
        milestoneReady:milestoneReady,
        supportReady:supportReady,
        issuePatternStable:issuePatternStable,
        safetySentinelPass:safetySentinelPass,
        noSensitiveDataRisk:noSensitiveDataRisk,
        noTradingRisk:noTradingRisk,
        safeToContinuePilot:safeToContinuePilot,
        safeToAdvanceNextCohort:safeToAdvanceNextCohort
      },
      primaryRisk:primaryRisk,
      rolloutControlSummary:clone(rolloutSummary),
      cohortHealthSummary:clone(cohortSummary),
      cohortProgressSummary:clone(progressSummary),
      trialMilestoneSummary:clone(milestoneSummary),
      pilotReadinessSnapshotSummary:clone(snapshotSummary),
      supportReadinessSummary:clone(supportSummary),
      issuePatternSummary:clone(issuePatternSummary),
      safetyRegressionSummary:clone(sentinelSummary),
      pilotExitCriteriaSummary:clone(pilotExitCriteriaSummary),
      launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary),
      pilotOpsStatus:status,
      nextCohortDecisionStatus: safeToAdvanceNextCohort ? "advance" : (status === "blocked" ? "blocked" : (status === "pause_expansion" ? "pause" : (status === "needs_review" ? "needs_review" : "continue_current"))),
      pilotOpsPrimaryRisk:primaryRisk,
      launchCandidateStatus:launchCandidateStatus,
      readyForLaunchCandidate:readyForLaunchCandidate,
      launchCandidateNextStep:launchCandidateNextStep,
      redacted:true
    });
  }
  function evaluateFlightWorkflowReadOnlyPilotOpsHealth(input) {
    return buildHealth(input || {});
  }
  function buildRows(input) {
    const health = evaluateFlightWorkflowReadOnlyPilotOpsHealth(input || {});
    return clone([
      row("ops_status", "运营状态", health.status === "healthy" ? "试点运行健康" : health.status === "continue_current_batch" ? "继续当前批次" : health.status === "pause_expansion" ? "暂停扩大测试" : health.status === "needs_review" ? "需要内部复核" : "已阻断", health.status === "blocked" ? "blocked" : health.status === "healthy" ? "pass" : "warning"),
      row("rollout", "发布控制", health.opsHealth.rolloutReady ? "下一批可推进" : "继续当前批次", health.opsHealth.rolloutReady ? "pass" : "warning"),
      row("cohort", "当前批次健康", health.opsHealth.cohortHealthy ? "当前批次健康" : "继续当前批次", health.opsHealth.cohortHealthy ? "pass" : "warning"),
      row("next_cohort", "下一批决策", health.opsHealth.safeToAdvanceNextCohort ? "可以进入下一批只读测试" : (health.status === "blocked" ? "已阻断" : "继续当前批次"), health.opsHealth.safeToAdvanceNextCohort ? "pass" : (health.status === "blocked" ? "blocked" : "warning")),
      row("support", "支持准备", health.opsHealth.supportReady ? "支持准备" : "需要内部复核", health.opsHealth.supportReady ? "pass" : "warning"),
      row("issue", "问题风险", health.opsHealth.issuePatternStable ? "问题趋势稳定" : "暂停扩大测试", health.opsHealth.issuePatternStable ? "pass" : "warning"),
      row("risk", "主要风险", health.primaryRisk.label, health.primaryRisk.riskId === "none" ? "pass" : (health.status === "blocked" ? "blocked" : "warning")),
      row("exit_criteria", "试点退出条件", health.readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", health.readyForLaunchCandidate ? "pass" : "warning"),
      row("launch_candidate", "发布候选", health.readyForLaunchCandidate ? "只读发布候选已准备" : (health.status === "blocked" ? "发布候选已阻断" : "发布候选仍需复核"), health.readyForLaunchCandidate ? "pass" : (health.status === "blocked" ? "blocked" : "warning"))
    ]);
  }
  function sanitizeFlightWorkflowReadOnlyPilotOpsSummary(summary) {
    const safe = obj(summary);
    const status = /^(healthy|continue_current_batch|needs_review|pause_expansion|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const primaryRisk = obj(safe.primaryRisk);
    const opsHealth = Object.assign({ rolloutReady:false, cohortHealthy:false, milestoneReady:false, supportReady:false, issuePatternStable:false, safetySentinelPass:false, noSensitiveDataRisk:false, noTradingRisk:false, safeToContinuePilot:false, safeToAdvanceNextCohort:false }, obj(safe.opsHealth));
    return clone({
      summaryName:SUMMARY_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_VERSION,
      status:status,
      opsHealth:opsHealth,
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      primaryRisk:{ riskId:text(primaryRisk.riskId || "unknown"), label:text(primaryRisk.label || "主要风险"), message:text(primaryRisk.message || "需要复核") },
      userFacingSummary:Object.assign({ title:"只读试点运营摘要", resultLabel:status === "healthy" ? "试点运行健康" : status === "continue_current_batch" ? "继续当前批次" : status === "pause_expansion" ? "暂停扩大测试" : status === "needs_review" ? "需要复核" : "已阻断", caveat:CAVEAT, redacted:true }, obj(safe.userFacingSummary)),
      safety:Object.assign(safety(), obj(safe.safety)),
      rolloutControlSummary:clone(safe.rolloutControlSummary || null),
      cohortHealthSummary:clone(safe.cohortHealthSummary || null),
      cohortProgressSummary:clone(safe.cohortProgressSummary || null),
      trialMilestoneSummary:clone(safe.trialMilestoneSummary || null),
      pilotReadinessSnapshotSummary:clone(safe.pilotReadinessSnapshotSummary || null),
      supportReadinessSummary:clone(safe.supportReadinessSummary || null),
      issuePatternSummary:clone(safe.issuePatternSummary || null),
      safetyRegressionSummary:clone(safe.safetyRegressionSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      pilotOpsStatus:text(safe.pilotOpsStatus || status),
      nextCohortDecisionStatus:text(safe.nextCohortDecisionStatus || (opsHealth.safeToAdvanceNextCohort ? "advance" : status)),
      pilotOpsPrimaryRisk:clone(safe.pilotOpsPrimaryRisk || primaryRisk),
      launchCandidateStatus:text(safe.launchCandidateStatus || "continue_pilot"),
      readyForLaunchCandidate:safe.readyForLaunchCandidate === true,
      launchCandidateNextStep:text(safe.launchCandidateNextStep || "继续试点观察"),
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
  function buildFlightWorkflowReadOnlyPilotOpsSummary(input) {
    try {
      const health = evaluateFlightWorkflowReadOnlyPilotOpsHealth(input || {});
      return sanitizeFlightWorkflowReadOnlyPilotOpsSummary({
        status:health.status,
        opsHealth:health.opsHealth,
        primaryRisk:health.primaryRisk,
        rows:buildRows(input || {}),
        userFacingSummary:{ title:"只读试点运营摘要", resultLabel:health.status === "healthy" ? "试点运行健康" : health.status === "continue_current_batch" ? "继续当前批次" : health.status === "pause_expansion" ? "暂停扩大测试" : health.status === "needs_review" ? "需要复核" : "已阻断", caveat:CAVEAT, redacted:true },
        safety:safety(),
        rolloutControlSummary:health.rolloutControlSummary,
        cohortHealthSummary:health.cohortHealthSummary,
        cohortProgressSummary:health.cohortProgressSummary,
        trialMilestoneSummary:health.trialMilestoneSummary,
        pilotReadinessSnapshotSummary:health.pilotReadinessSnapshotSummary,
        supportReadinessSummary:health.supportReadinessSummary,
        issuePatternSummary:health.issuePatternSummary,
        safetyRegressionSummary:health.safetyRegressionSummary,
        pilotExitCriteriaSummary:health.pilotExitCriteriaSummary,
        launchCandidateReadinessSummary:health.launchCandidateReadinessSummary,
        freezeGateSummary:health.freezeGateSummary,
        evidenceFreezePackSummary:health.evidenceFreezePackSummary,
        pilotOpsStatus:health.status,
        nextCohortDecisionStatus:health.nextCohortDecisionStatus,
        pilotOpsPrimaryRisk:health.primaryRisk,
        launchCandidateStatus:health.launchCandidateStatus,
        readyForLaunchCandidate:health.readyForLaunchCandidate === true,
        launchCandidateNextStep:health.launchCandidateNextStep
      });
    } catch (error) {
      return sanitizeFlightWorkflowReadOnlyPilotOpsSummary({ status:"failed_safe", opsHealth:{}, rows:[], primaryRisk:{ riskId:"unknown", label:"已安全降级", message:"输入异常，已安全降级。" }, userFacingSummary:{ title:"只读试点运营摘要", resultLabel:"已阻断", caveat:CAVEAT, redacted:true } });
    }
  }
  function buildFlightWorkflowReadOnlyPilotOpsSummaryAuditDraft(input) {
    const summary = buildFlightWorkflowReadOnlyPilotOpsSummary(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_AUDIT_DRAFT",
      summaryName:SUMMARY_NAME,
      appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_VERSION,
      status:summary.status,
      primaryRiskId:summary.primaryRisk && summary.primaryRisk.riskId || "unknown",
      safeToContinuePilot:summary.opsHealth.safeToContinuePilot === true,
      safeToAdvanceNextCohort:summary.opsHealth.safeToAdvanceNextCohort === true,
      launchCandidateStatus:summary.launchCandidateStatus,
      readyForLaunchCandidate:summary.readyForLaunchCandidate === true,
      launchCandidateNextStep:summary.launchCandidateNextStep,
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

  window.WeishanFlightWorkflowReadOnlyPilotOpsSummary = {
    FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_VERSION,
    SUMMARY_NAME,
    buildFlightWorkflowReadOnlyPilotOpsSummary,
    evaluateFlightWorkflowReadOnlyPilotOpsHealth,
    buildFlightWorkflowReadOnlyPilotOpsRows:buildRows,
    buildFlightWorkflowReadOnlyPilotOpsSummaryAuditDraft,
    sanitizeFlightWorkflowReadOnlyPilotOpsSummary
  };
})();
