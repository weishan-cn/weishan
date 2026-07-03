;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION = "4.1.3";
  const CENTER_NAME = "flight_workflow_read_only_pilot_rollout_control_center_v1";
  const CAVEAT = "该控制中心只管理只读试点流程，不代表真实账号、客服工单、交易请求或出票能力。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText|真实姓名|手机号|邮箱/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function safety() { return { realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function hasTradingUrl(value) { const safe = obj(value); const nested = obj(safe.safety); return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || nested.bookingUrl || nested.checkoutUrl || nested.paymentUrl || nested.orderUrl); }
  function hasSensitiveRisk(value) { const safe = obj(value); const nested = obj(safe.safety); return safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true || safe.realIdentityStored === true || safe.identityUpload === true || safe.credentialInput === true || safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || nested.realNameStored === true || nested.phoneStored === true || nested.emailStored === true || nested.realIdentityStored === true || nested.identityUpload === true || nested.credentialInput === true || nested.rawUserTextStored === true || nested.rawResponseStored === true || nested.secretStored === true; }
  function hasTradingRisk(value) { const safe = obj(value); const nested = obj(safe.safety); return hasTradingUrl(safe) || safe.payment === true || safe.order === true || safe.ticketing === true || nested.payment === true || nested.order === true || nested.ticketing === true; }
  function api(name) { return window[name] || {}; }
  function buildIf(input, globalName, fnName, fallbackKeys) {
    const safe = obj(input);
    const direct = first.apply(null, fallbackKeys.map(function (key) { return safe[key]; }));
    if (Object.keys(direct).length) return direct;
    const candidate = api(globalName);
    return typeof candidate[fnName] === "function" ? candidate[fnName](safe) : {};
  }
  function collect(input) {
    const safe = obj(input);
    return {
      cohortProgress: buildIf(safe, "WeishanFlightWorkflowPublicPilotCohortProgressTracker", "buildFlightWorkflowPublicPilotCohortProgressTracker", ["cohortProgressSummary", "cohortProgressTrackerSummary", "publicPilotCohortProgressTrackerSummary"]),
      milestone: buildIf(safe, "WeishanFlightWorkflowReadOnlyTrialMilestoneBoard", "buildFlightWorkflowReadOnlyTrialMilestoneBoard", ["trialMilestoneSummary", "trialMilestoneBoardSummary", "readOnlyTrialMilestoneBoardSummary"]),
      invitation: buildIf(safe, "WeishanFlightWorkflowReadOnlyPilotInvitationGate", "buildFlightWorkflowReadOnlyPilotInvitationGate", ["pilotInvitationGateSummary", "readOnlyPilotInvitationGateSummary", "invitationGateSummary"]),
      testerCohort: buildIf(safe, "WeishanFlightWorkflowTesterCohortEnrollmentConsole", "buildFlightWorkflowTesterCohortEnrollmentConsole", ["testerCohortEnrollmentConsoleSummary", "testerCohortSummary", "cohortSummary"]),
      snapshot: buildIf(safe, "WeishanFlightWorkflowPublicPilotReadinessSnapshot", "buildFlightWorkflowPublicPilotReadinessSnapshot", ["pilotReadinessSnapshotSummary", "publicPilotReadinessSnapshotSummary", "snapshotSummary"]),
      playbook: buildIf(safe, "WeishanFlightWorkflowSupportPlaybookConsole", "buildFlightWorkflowSupportPlaybookConsole", ["supportPlaybookSummary", "supportPlaybookConsoleSummary", "playbookSummary"]),
      issuePattern: buildIf(safe, "WeishanFlightWorkflowPublicPilotIssuePatternRadar", "buildFlightWorkflowPublicPilotIssuePatternRadar", ["issuePatternSummary", "issuePatternRadar", "issuePatternViewModelSummary"]),
      supportReadiness: buildIf(safe, "WeishanFlightWorkflowSupportReadinessGate", "buildFlightWorkflowSupportReadinessGate", ["supportReadinessSummary", "supportReadinessGate"]),
      sentinel: buildIf(safe, "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport", ["safetyRegressionSummary", "safetyRegressionSentinel", "sentinelReport"]),
      pilotOps: buildIf(safe, "WeishanFlightWorkflowReadOnlyPilotOpsSummary", "buildFlightWorkflowReadOnlyPilotOpsSummary", ["pilotOpsSummary", "readOnlyPilotOpsSummary", "pilotOps"]),
      nextCohortDecision: buildIf(safe, "WeishanFlightWorkflowNextCohortDecisionBoard", "buildFlightWorkflowNextCohortDecisionBoard", ["nextCohortDecisionSummary", "nextCohortDecisionBoard", "decisionBoard"]),
      pilotExitCriteria: buildIf(safe, "WeishanFlightWorkflowReadOnlyPilotExitCriteria", "buildFlightWorkflowReadOnlyPilotExitCriteria", ["pilotExitCriteriaSummary", "exitCriteriaSummary"]),
      launchCandidateReadiness: buildIf(safe, "WeishanFlightWorkflowLaunchCandidateReadinessBoard", "buildFlightWorkflowLaunchCandidateReadinessBoard", ["launchCandidateReadinessSummary", "launchCandidateSummary", "launchCandidateReadinessBoard"])
    };
  }
  function evaluateFlightWorkflowReadOnlyPilotRolloutDecision(input) {
    const safe = obj(input);
    const parts = collect(safe);
    const values = [safe, parts.cohortProgress, parts.milestone, parts.invitation, parts.testerCohort, parts.snapshot, parts.playbook, parts.issuePattern, parts.supportReadiness, parts.sentinel, parts.pilotOps, parts.nextCohortDecision];
    values.push(parts.pilotExitCriteria, parts.launchCandidateReadiness);
    const rolloutHealth = {
      cohortProgressReady: safe.cohortProgressReady === true || parts.cohortProgress.status === "ready" || parts.cohortProgress.cohortProgressStatus === "ready",
      milestoneReady: safe.milestoneReady === true || parts.milestone.status === "ready" || parts.milestone.trialMilestoneStatus === "ready",
      invitationReady: safe.invitationReady === true || parts.invitation.status === "eligible" || parts.invitation.status === "ready",
      supportReady: safe.supportReady === true || parts.supportReadiness.status === "ready" || parts.playbook.status === "ready",
      issuePatternStable: safe.issuePatternStable === true || parts.issuePattern.status === "ready",
      safetySentinelPass: safe.safetySentinelPass === false ? false : (safe.safetySentinelPass === true || parts.sentinel.status === "pass"),
      noOpenBlockingIssue: safe.noOpenBlockingIssue === false ? false : (safe.noOpenBlockingIssue === true || (parts.issuePattern.status !== "blocked" && parts.supportReadiness.status !== "blocked" && parts.snapshot.status !== "blocked")),
      noSensitiveDataRisk: safe.noSensitiveDataRisk === false ? false : (safe.noSensitiveDataRisk === true || !values.some(hasSensitiveRisk)),
      noTradingRisk: safe.noTradingRisk === false ? false : (safe.noTradingRisk === true || !values.some(hasTradingRisk))
    };
    const blockedReasons = [];
    if (!rolloutHealth.safetySentinelPass) blockedReasons.push("safety_sentinel_failed");
    if (!rolloutHealth.noSensitiveDataRisk) blockedReasons.push("sensitive_data_risk");
    if (!rolloutHealth.noTradingRisk) blockedReasons.push("trading_risk");
    if (!rolloutHealth.noOpenBlockingIssue) blockedReasons.push("open_blocking_issue");
    if (parts.pilotOps.status === "blocked") blockedReasons.push("pilot_ops_blocked");
    if (parts.nextCohortDecision.status === "blocked") blockedReasons.push("next_cohort_blocked");
    if (parts.pilotExitCriteria.status === "blocked") blockedReasons.push("pilot_exit_criteria_blocked");
    if (parts.launchCandidateReadiness.status === "blocked") blockedReasons.push("launch_candidate_blocked");
    let decisionId = "continue_current_batch";
    let status = "continue_current_batch";
    let label = "继续当前小范围试点";
    let message = "批次条件仍在积累，继续当前只读试点。";
    if (blockedReasons.length) {
      status = "blocked"; decisionId = "blocked"; label = "已阻断"; message = "存在安全或阻断风险，暂停试点发布控制。";
    } else if (!rolloutHealth.cohortProgressReady || !rolloutHealth.milestoneReady) {
      status = "continue_current_batch"; decisionId = "continue_current_batch";
    } else if (!rolloutHealth.supportReady) {
      status = "needs_review"; decisionId = "internal_review"; label = "需要内部复核"; message = "支持准备未完全就绪，需要内部复核。";
    } else if (!rolloutHealth.issuePatternStable) {
      status = "pause_expansion"; decisionId = "pause_expansion"; label = "暂停扩大测试"; message = "问题趋势不稳定，暂停进入下一批。";
    } else if (parts.pilotOps.status === "healthy" || parts.nextCohortDecision.status === "advance" || Object.keys(rolloutHealth).every(function (key) { return rolloutHealth[key] === true; })) {
      status = "ready"; decisionId = "advance_next_cohort"; label = "可以进入下一批只读测试"; message = "只读试点发布控制条件已满足。";
    }
    const launchCandidateStatus = parts.launchCandidateReadiness.status || "continue_pilot";
    const readyForLaunchCandidate = obj(parts.launchCandidateReadiness.launchCandidateReadiness).safeForReadOnlyLaunchCandidate === true;
    const launchCandidateNextStep = text(parts.launchCandidateReadiness.launchCandidateNextStep || parts.launchCandidateReadiness.userFacingSummary && parts.launchCandidateReadiness.userFacingSummary.resultLabel || (readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察"));
    return clone({ status, decision:{ decisionId, label, message, safeToAdvanceNextCohort:decisionId === "advance_next_cohort", safeToContinueCurrentPilot:status === "ready" || status === "continue_current_batch" }, rolloutHealth, blockedReasons, pilotOpsSummary:clone(parts.pilotOps), nextCohortDecisionSummary:clone(parts.nextCohortDecision), pilotExitCriteriaSummary:clone(parts.pilotExitCriteria), launchCandidateReadinessSummary:clone(parts.launchCandidateReadiness), pilotOpsStatus:text(parts.pilotOps.status || ""), nextCohortDecisionStatus:text(parts.nextCohortDecision.status || ""), pilotOpsPrimaryRisk:clone(parts.pilotOps.primaryRisk || null), launchCandidateStatus:text(launchCandidateStatus), readyForLaunchCandidate:readyForLaunchCandidate, launchCandidateNextStep:launchCandidateNextStep, parts, redacted:true });
  }
  function row(rowId, label, value, status) { return { rowId, label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function buildFlightWorkflowReadOnlyPilotRolloutControlRows(input) {
    const decision = evaluateFlightWorkflowReadOnlyPilotRolloutDecision(input || {});
    const health = decision.rolloutHealth;
    return clone([
      row("cohort_progress", "测试批次进度", health.cohortProgressReady ? "批次健康" : "继续当前小范围试点", health.cohortProgressReady ? "pass" : "warning"),
      row("milestone", "只读试点里程碑", health.milestoneReady ? "发布控制正常" : "继续当前小范围试点", health.milestoneReady ? "pass" : "warning"),
      row("invitation", "试点邀请闸门", health.invitationReady ? "邀请闸门只读就绪" : "不发送真实邀请", health.invitationReady ? "pass" : "warning"),
      row("support", "支持准备", health.supportReady ? "支持准备就绪" : "需要内部复核", health.supportReady ? "pass" : "warning"),
      row("issue_pattern", "问题风险", health.issuePatternStable ? "问题趋势稳定" : "暂停扩大测试", health.issuePatternStable ? "pass" : "warning"),
      row("pilot_ops", "试点运营摘要", health.safeToContinuePilot ? "试点运行健康" : (health.supportReady ? "继续当前批次" : "需要内部复核"), health.pilotOpsStatus === "blocked" ? "blocked" : health.pilotOpsStatus === "healthy" ? "pass" : "warning"),
      row("next_cohort", "下一批决策", health.safeToAdvanceNextCohort ? "可以进入下一批只读测试" : (health.nextCohortDecisionStatus === "pause" ? "暂停扩大测试" : "继续当前批次"), health.nextCohortDecisionStatus === "blocked" ? "blocked" : health.nextCohortDecisionStatus === "advance" ? "pass" : "warning"),
      row("exit_criteria", "试点退出条件", health.readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", health.readyForLaunchCandidate ? "pass" : "warning"),
      row("launch_candidate", "发布候选", health.readyForLaunchCandidate ? "只读发布候选已准备" : (health.launchCandidateStatus === "blocked" ? "发布候选已阻断" : "发布候选仍需复核"), health.launchCandidateStatus === "blocked" ? "blocked" : (health.readyForLaunchCandidate ? "pass" : "warning")),
      row("safety", "安全哨兵", health.safetySentinelPass && health.noSensitiveDataRisk && health.noTradingRisk ? "发布控制正常" : "已阻断", health.safetySentinelPass && health.noSensitiveDataRisk && health.noTradingRisk ? "pass" : "blocked")
    ]);
  }
  function sanitizeFlightWorkflowReadOnlyPilotRolloutControlCenter(center) {
    const safe = obj(center);
    const status = /^(ready|continue_current_batch|pause_expansion|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const decision = obj(safe.decision);
    return clone({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION, status, decision:{ decisionId:text(decision.decisionId || "blocked"), label:text(decision.label || "已阻断"), message:text(decision.message || "安全降级。"), safeToAdvanceNextCohort:decision.safeToAdvanceNextCohort === true, safeToContinueCurrentPilot:decision.safeToContinueCurrentPilot === true }, rolloutHealth:Object.assign({ cohortProgressReady:false, milestoneReady:false, invitationReady:false, supportReady:false, issuePatternStable:false, safetySentinelPass:false, noOpenBlockingIssue:false, noSensitiveDataRisk:false, noTradingRisk:false }, obj(safe.rolloutHealth)), rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), blockedReasons:toArray(safe.blockedReasons).map(text), pilotOpsSummary:clone(safe.pilotOpsSummary || null), nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null), pilotOpsStatus:text(safe.pilotOpsStatus || ""), nextCohortDecisionStatus:text(safe.nextCohortDecisionStatus || ""), pilotOpsPrimaryRisk:clone(safe.pilotOpsPrimaryRisk || null), userFacingSummary:Object.assign({ title:"只读试点发布控制中心", resultLabel:status === "ready" ? "可以进入下一批只读测试" : status === "continue_current_batch" ? "继续当前小范围试点" : status === "pause_expansion" ? "暂停扩大测试" : status === "needs_review" ? "需要内部复核" : "已阻断", caveat:CAVEAT, redacted:true }, obj(safe.userFacingSummary)), safety:Object.assign(safety(), obj(safe.safety)), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
    return clone({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION, status, decision:{ decisionId:text(decision.decisionId || "blocked"), label:text(decision.label || "已阻断"), message:text(decision.message || "安全降级。"), safeToAdvanceNextCohort:decision.safeToAdvanceNextCohort === true, safeToContinueCurrentPilot:decision.safeToContinueCurrentPilot === true }, rolloutHealth:Object.assign({ cohortProgressReady:false, milestoneReady:false, invitationReady:false, supportReady:false, issuePatternStable:false, safetySentinelPass:false, noOpenBlockingIssue:false, noSensitiveDataRisk:false, noTradingRisk:false }, obj(safe.rolloutHealth)), rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), blockedReasons:toArray(safe.blockedReasons).map(text), pilotOpsSummary:clone(safe.pilotOpsSummary || null), nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null), pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null), launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null), pilotOpsStatus:text(safe.pilotOpsStatus || ""), nextCohortDecisionStatus:text(safe.nextCohortDecisionStatus || ""), pilotOpsPrimaryRisk:clone(safe.pilotOpsPrimaryRisk || null), launchCandidateStatus:text(safe.launchCandidateStatus || ""), readyForLaunchCandidate:safe.readyForLaunchCandidate === true, launchCandidateNextStep:text(safe.launchCandidateNextStep || ""), userFacingSummary:Object.assign({ title:"只读试点发布控制中心", resultLabel:status === "ready" ? "可以进入下一批只读测试" : status === "continue_current_batch" ? "继续当前小范围试点" : status === "pause_expansion" ? "暂停扩大测试" : status === "needs_review" ? "需要内部复核" : "已阻断", caveat:CAVEAT, redacted:true }, obj(safe.userFacingSummary)), safety:Object.assign(safety(), obj(safe.safety)), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  function buildFlightWorkflowReadOnlyPilotRolloutControlCenter(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowReadOnlyPilotRolloutControlCenter({ status:"failed_safe", decision:{ decisionId:"blocked", label:"已阻断", message:"安全降级。", safeToAdvanceNextCohort:false, safeToContinueCurrentPilot:false }, rows:[], blockedReasons:["failed_safe"] });
      const decision = evaluateFlightWorkflowReadOnlyPilotRolloutDecision(input || {});
      return sanitizeFlightWorkflowReadOnlyPilotRolloutControlCenter(Object.assign({}, decision, { rows:buildFlightWorkflowReadOnlyPilotRolloutControlRows(input || {}), userFacingSummary:{ title:"只读试点发布控制中心", resultLabel:decision.decision.label, caveat:CAVEAT, redacted:true }, safety:safety() }));
    } catch (error) {
      return sanitizeFlightWorkflowReadOnlyPilotRolloutControlCenter({ status:"failed_safe", decision:{ decisionId:"blocked", label:"已阻断", message:"安全降级。", safeToAdvanceNextCohort:false, safeToContinueCurrentPilot:false }, rows:[], blockedReasons:["failed_safe"] });
    }
  }
  function buildFlightWorkflowReadOnlyPilotRolloutControlCenterAuditDraft(input) { const center = buildFlightWorkflowReadOnlyPilotRolloutControlCenter(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_AUDIT_DRAFT", centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION, status:center.status, decisionId:center.decision.decisionId, blockedReasons:center.blockedReasons, pilotOpsStatus:center.pilotOpsStatus, nextCohortDecisionStatus:center.nextCohortDecisionStatus, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }

  window.WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter = { FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION, CENTER_NAME, buildFlightWorkflowReadOnlyPilotRolloutControlCenter, evaluateFlightWorkflowReadOnlyPilotRolloutDecision, buildFlightWorkflowReadOnlyPilotRolloutControlRows, buildFlightWorkflowReadOnlyPilotRolloutControlCenterAuditDraft, sanitizeFlightWorkflowReadOnlyPilotRolloutControlCenter };
})();
