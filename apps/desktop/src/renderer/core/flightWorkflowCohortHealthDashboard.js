;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION = "4.1.4";
  const DASHBOARD_NAME = "flight_workflow_cohort_health_dashboard_v1";
  const CAVEAT = "该看板只统计脱敏测试槽位，不保存真实身份或联系方式。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|真实姓名|手机号|邮箱/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function ratio(done, total) { return total > 0 ? Math.max(0, Math.min(1, done / total)) : 0; }
  function row(rowId, label, value, status) { return { rowId, label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rowsFrom(input) {
    const safe = obj(input);
    const cohort = obj(safe.cohort || safe.testerCohort || safe.cohortHealth);
    const rows = toArray(safe.rows);
    return rows.length ? rows : toArray(cohort.rows);
  }
  function evaluateFlightWorkflowCohortHealth(input) {
    const safe = obj(input);
    const sourceRows = rowsFrom(safe);
    const cohort = obj(safe.cohort || safe.testerCohort || safe.cohortHealth);
    const testerSlotCount = Number(safe.testerSlotCount != null ? safe.testerSlotCount : cohort.testerSlotCount != null ? cohort.testerSlotCount : cohort.totalCount != null ? cohort.totalCount : sourceRows.length || 0);
    const eligibleSlotCount = Number(safe.eligibleSlotCount != null ? safe.eligibleSlotCount : cohort.eligibleSlotCount != null ? cohort.eligibleSlotCount : cohort.invitedCount != null ? cohort.invitedCount : sourceRows.filter(function (item) { return item.invitationStatus === "invited" || item.invitationStatus === "eligible" || item.status === "ready"; }).length);
    const consented = Number(cohort.consentedCount != null ? cohort.consentedCount : sourceRows.filter(function (item) { return item.consentStatus === "accepted" || item.consentStatus === "confirmed"; }).length);
    const feedback = Number(cohort.feedbackReadyCount != null ? cohort.feedbackReadyCount : sourceRows.filter(function (item) { return item.feedbackStatus === "ready" || item.feedbackStatus === "complete"; }).length);
    const resolved = Number(cohort.issueResolvedCount != null ? cohort.issueResolvedCount : sourceRows.filter(function (item) { return item.issueStatus === "resolved" || item.issueStatus === "none"; }).length);
    const openIssueCount = Number(safe.openIssueCount != null ? safe.openIssueCount : cohort.openIssueCount != null ? cohort.openIssueCount : sourceRows.filter(function (item) { return item.issueStatus === "open" || item.issueStatus === "needs_review"; }).length);
    const blockedSlotCount = Number(safe.blockedSlotCount != null ? safe.blockedSlotCount : cohort.blockedSlotCount != null ? cohort.blockedSlotCount : cohort.blockedCount != null ? cohort.blockedCount : sourceRows.filter(function (item) { return item.status === "blocked"; }).length);
    const sensitiveRiskCount = Number(safe.sensitiveRiskCount != null ? safe.sensitiveRiskCount : cohort.sensitiveRiskCount != null ? cohort.sensitiveRiskCount : sourceRows.filter(function (item) { return item.sensitiveRisk === true || item.rawUserTextStored === true || item.secretStored === true; }).length);
    const realIdentityRisk = safe.realIdentityRisk === true || cohort.realIdentityRisk === true || cohort.realIdentityStored === true || sourceRows.some(function (item) { return item.realIdentityRisk === true || item.realIdentityStored === true; });
    const consentCompletionRatio = Number(safe.consentCompletionRatio != null ? safe.consentCompletionRatio : cohort.consentCompletionRatio != null ? cohort.consentCompletionRatio : ratio(consented, testerSlotCount));
    const feedbackCompletionRatio = Number(safe.feedbackCompletionRatio != null ? safe.feedbackCompletionRatio : cohort.feedbackCompletionRatio != null ? cohort.feedbackCompletionRatio : ratio(feedback, testerSlotCount));
    const issueResolutionRatio = Number(safe.issueResolutionRatio != null ? safe.issueResolutionRatio : cohort.issueResolutionRatio != null ? cohort.issueResolutionRatio : ratio(resolved, resolved + openIssueCount));
    let status = "healthy";
    if (realIdentityRisk) status = "blocked";
    else if (blockedSlotCount > 2 || sensitiveRiskCount > 1) status = "blocked";
    else if (blockedSlotCount > 0 || sensitiveRiskCount > 0 || (issueResolutionRatio < 0.7 && openIssueCount > 0)) status = "needs_review";
    else if (testerSlotCount === 0 || consentCompletionRatio < 0.8 || feedbackCompletionRatio < 0.6) status = "in_progress";
    const cohortHealth = { testerSlotCount, eligibleSlotCount, consentCompletionRatio, feedbackCompletionRatio, issueResolutionRatio, blockedSlotCount, sensitiveRiskCount, realIdentityRisk, healthyEnoughForNextCohort:status === "healthy" };
    const pilotExitCriteriaSummary = safe.pilotExitCriteriaSummary || null;
    const launchCandidateReadinessSummary = safe.launchCandidateReadinessSummary || null;
    const readyForLaunchCandidate = Boolean(obj(launchCandidateReadinessSummary).launchCandidateReadiness && obj(launchCandidateReadinessSummary).launchCandidateReadiness.safeForReadOnlyLaunchCandidate);
    return clone({ status, cohortHealth, pilotExitCriteriaSummary:clone(pilotExitCriteriaSummary), launchCandidateReadinessSummary:clone(launchCandidateReadinessSummary), launchCandidateStatus:text(safe.launchCandidateStatus || (readyForLaunchCandidate ? "ready" : "continue_pilot")), readyForLaunchCandidate:readyForLaunchCandidate, launchCandidateNextStep:text(safe.launchCandidateNextStep || (readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察")), redacted:true });
  }
  function buildFlightWorkflowCohortHealthRows(input) {
    const evaluation = evaluateFlightWorkflowCohortHealth(input || {});
    const health = evaluation.cohortHealth;
    return clone([
      row("tester_slots", "测试者数量", String(health.testerSlotCount), health.testerSlotCount > 0 ? "pass" : "warning"),
      row("read_only_consent", "只读确认", Math.round(health.consentCompletionRatio * 100) + "%", health.consentCompletionRatio >= 0.8 ? "pass" : "warning"),
      row("feedback", "反馈完成", Math.round(health.feedbackCompletionRatio * 100) + "%", health.feedbackCompletionRatio >= 0.6 ? "pass" : "warning"),
      row("issues", "问题处理", Math.round(health.issueResolutionRatio * 100) + "%", health.issueResolutionRatio >= 0.7 ? "pass" : "warning"),
      row("sensitive_risk", "敏感数据风险", String(health.sensitiveRiskCount), health.sensitiveRiskCount > 0 ? "blocked" : "pass"),
      row("identity_risk", "真实身份风险", health.realIdentityRisk ? "已阻断" : "无", health.realIdentityRisk ? "blocked" : "pass")
    ]);
  }
  function sanitizeFlightWorkflowCohortHealthDashboard(dashboard) {
    const safe = obj(dashboard);
    const status = /^(healthy|in_progress|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({ dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION, status, cohortHealth:Object.assign({ testerSlotCount:0, eligibleSlotCount:0, consentCompletionRatio:0, feedbackCompletionRatio:0, issueResolutionRatio:0, blockedSlotCount:0, sensitiveRiskCount:0, realIdentityRisk:false, healthyEnoughForNextCohort:false }, obj(safe.cohortHealth)), rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), userFacingSummary:Object.assign({ title:"测试批次健康看板", resultLabel:status === "healthy" ? "批次健康，可以继续" : status === "in_progress" ? "批次进行中" : status === "needs_review" ? "批次需要复核" : "批次已阻断", caveat:CAVEAT, redacted:true }, obj(safe.userFacingSummary)), pilotOpsSummary:clone(safe.pilotOpsSummary || null), nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null), pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null), launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null), pilotOpsStatus:text(safe.pilotOpsStatus || ""), nextCohortDecisionStatus:text(safe.nextCohortDecisionStatus || ""), pilotOpsPrimaryRisk:clone(safe.pilotOpsPrimaryRisk || null), launchCandidateStatus:text(safe.launchCandidateStatus || ""), readyForLaunchCandidate:safe.readyForLaunchCandidate === true, launchCandidateNextStep:text(safe.launchCandidateNextStep || ""), safety:Object.assign(safety(), obj(safe.safety)), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  function buildFlightWorkflowCohortHealthDashboard(input) {
    try {
      const evaluation = evaluateFlightWorkflowCohortHealth(input || {});
      return sanitizeFlightWorkflowCohortHealthDashboard(Object.assign({}, evaluation, { rows:buildFlightWorkflowCohortHealthRows(input || {}), safety:safety() }));
    } catch (error) {
      return sanitizeFlightWorkflowCohortHealthDashboard({ status:"failed_safe", rows:[], cohortHealth:{} });
    }
  }
  function buildFlightWorkflowCohortHealthDashboardAuditDraft(input) { const dashboard = buildFlightWorkflowCohortHealthDashboard(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_AUDIT_DRAFT", dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION, status:dashboard.status, healthyEnoughForNextCohort:dashboard.cohortHealth.healthyEnoughForNextCohort === true, pilotOpsStatus:dashboard.pilotOpsStatus, nextCohortDecisionStatus:dashboard.nextCohortDecisionStatus, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }

  window.WeishanFlightWorkflowCohortHealthDashboard = { FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION, DASHBOARD_NAME, buildFlightWorkflowCohortHealthDashboard, evaluateFlightWorkflowCohortHealth, buildFlightWorkflowCohortHealthRows, buildFlightWorkflowCohortHealthDashboardAuditDraft, sanitizeFlightWorkflowCohortHealthDashboard };
})();
