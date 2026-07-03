;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION = "4.0.8";
  const GATE_NAME = "flight_workflow_support_readiness_gate_v1";
  const CAVEAT = "该判断只适用于只读试点问题处理，不代表客服工单或交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(/token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/ig, "redacted").trim(); }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function radar(input) { const safe = obj(input); return first(safe.issuePatternRadar, safe.issuePatternSummary, safe.publicPilotIssuePatternRadar, safe.radar); }
  function board(input) { const safe = obj(input); return first(safe.issueReviewBoard, safe.issueReviewSummary, safe.publicPilotIssueReviewBoard); }
  function triage(input) { const safe = obj(input); return first(safe.supportTriageDashboard, safe.supportTriageSummary, safe.triageDashboard); }
  function checklist(input) { const safe = obj(input); return first(safe.publicPilotChecklistSummary, safe.publicPilotChecklist, safe.checklist); }
  function betaGate(input) { const safe = obj(input); return first(safe.betaExpansionGateSummary, safe.betaExpansionGate, safe.expansionGate); }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary); }
  function testerCohort(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary); }
  function pilotInvitation(input) { const safe = obj(input); return first(safe.pilotInvitationViewModelSummary, safe.pilotInvitationSummary); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary); }
  function cohortProgress(input) { const safe = obj(input); return first(safe.cohortProgressSummary, safe.cohortProgressTrackerSummary, safe.publicPilotCohortProgressTrackerSummary); }
  function trialMilestone(input) { const safe = obj(input); return first(safe.trialMilestoneSummary, safe.trialMilestoneBoardSummary, safe.readOnlyTrialMilestoneBoardSummary); }
  function pilotOps(input) { const safe = obj(input); return first(safe.pilotOpsSummary, safe.readOnlyPilotOpsSummary); }
  function nextCohortDecision(input) { const safe = obj(input); return first(safe.nextCohortDecisionSummary, safe.nextCohortDecisionBoard); }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function buildFlightWorkflowSupportReadinessCriteria(input) {
    const safe = obj(input);
    const r = radar(safe);
    const b = board(safe);
    const t = triage(safe);
    const c = checklist(safe);
    const g = betaGate(safe);
    const ig = invitationGate(safe);
    const tc = testerCohort(safe);
    const pivm = pilotInvitation(safe);
    const s = snapshot(safe);
    const p = playbook(safe);
    const cp = cohortProgress(safe);
    const tm = trialMilestone(safe);
    const po = pilotOps(safe);
    const nd = nextCohortDecision(safe);
    const pattern = obj(r.patternSummary);
    const health = obj(r.issuePatternHealth);
    const readiness = obj(c.readiness);
    const decision = obj(g.decision);
    const noSensitiveLeakRisk = safe.rawUserTextStored !== true && safe.rawResponseStored !== true && safe.secretStored !== true && obj(r.safety).rawUserTextStored !== true && obj(r.safety).secretStored !== true && obj(s).rawUserTextStored !== true && obj(s).secretStored !== true && obj(p).rawUserTextStored !== true && obj(p).secretStored !== true && obj(po.safety).rawUserTextStored !== true && obj(po.safety).secretStored !== true && obj(nd.safety).rawUserTextStored !== true && obj(nd.safety).secretStored !== true;
    const noTradingRisk = !hasTradingUrl(safe) && !hasTradingUrl(r) && !hasTradingUrl(b) && !hasTradingUrl(t) && !hasTradingUrl(s) && !hasTradingUrl(p) && !hasTradingUrl(po) && !hasTradingUrl(nd);
    return clone({
      issuePatternReady:r.status === "ready" || r.status === "insufficient_data",
      noRepeatedBlockingIssue:r.status !== "blocked" && pattern.severity !== "blocked" && health.blockedIssueCount !== true && Number(health.blockedIssueCount || 0) === 0,
      triageReady:t.status === "ready" || t.status === "needs_internal_review",
      supportFallbackReady:safe.supportFallbackReady === true || readiness.supportFallbackReady === true || (c.status === "ready" && b.status !== "blocked" && p.status !== "blocked"),
      safetyCopyStable:pattern.dominantPattern !== "safety_copy_unclear" && safe.safetyCopyStable !== false && p.status !== "blocked",
      noSensitiveLeakRisk:noSensitiveLeakRisk,
      noTradingRisk:noTradingRisk,
      cohortProgressSummary:clone(cp),
      trialMilestoneSummary:clone(tm),
      cohortProgressStatus:text(cp.status || ""),
      trialMilestoneStatus:text(tm.status || ""),
      safeToAdvanceNextCohort:tm.safeToAdvanceNextCohort === true || cp.safeToAdvanceNextCohort === true,
      pilotOpsSummary:clone(po),
      nextCohortDecisionSummary:clone(nd),
      pilotOpsStatus:text(po.status || ""),
      nextCohortDecisionStatus:text(nd.status || ""),
      pilotOpsPrimaryRisk:clone(po.primaryRisk || null),
      pilotReadinessSnapshotSummary:clone(s),
      pilotInvitationGateSummary:clone(ig),
      testerCohortEnrollmentConsoleSummary:clone(tc),
      pilotInvitationViewModelSummary:clone(pivm),
      supportPlaybookSummary:clone(p),
      pilotSnapshotStatus:text(s.status || ""),
      pilotInvitationStatus:text(ig.status || ""),
      testerCohortStatus:text(tc.status || ""),
      pilotSnapshotNextStep:text(obj(s.userFacingSummary).resultLabel || obj(p.userFacingSummary).resultLabel || "继续小范围试点"),
      pilotInvitationNextStep:text(obj(obj(ig.userFacingSummary)).resultLabel || obj(ig.decision).label || "待邀请")
    });
  }
  function evaluateFlightWorkflowSupportReadiness(input) {
    const safe = obj(input);
    const r = radar(safe);
    const criteria = buildFlightWorkflowSupportReadinessCriteria(safe);
    const criteriaKeys = ["issuePatternReady", "noRepeatedBlockingIssue", "triageReady", "supportFallbackReady", "safetyCopyStable", "noSensitiveLeakRisk", "noTradingRisk"];
    const unmetCriteria = criteriaKeys.filter(function (key) { return criteria[key] !== true; });
    const pattern = obj(r.patternSummary);
    let status = "ready";
    let decisionId = "continue_public_pilot";
    if (!criteria.supportFallbackReady || r.status === "insufficient_data") { status = "continue_small_pilot"; decisionId = "continue_small_pilot"; }
    if (r.status === "needs_review" || pattern.dominantPattern === "platform_mismatch" || pattern.dominantPattern === "safety_copy_unclear" || !criteria.safetyCopyStable) { status = "needs_review"; decisionId = "pause_expansion"; }
    if (r.status === "blocked" || !criteria.noSensitiveLeakRisk || !criteria.noTradingRisk) { status = "blocked"; decisionId = "blocked"; }
    const supportReadyForPublicPilot = status === "ready" && unmetCriteria.length === 0;
    return clone({ status:status, decisionId:decisionId, supportReadyForPublicPilot:supportReadyForPublicPilot, unmetCriteria:unmetCriteria, criteria:criteria, redacted:true });
  }
  function labelFor(status) {
    if (status === "ready") return "支持兜底准备就绪";
    if (status === "continue_small_pilot") return "继续小范围试点";
    if (status === "needs_review") return "需要复核后再扩大";
    return "已阻断";
  }
  function messageFor(evaluation) {
    if (evaluation.status === "ready") return "问题趋势与支持兜底准备可支持继续公开只读试点。";
    if (evaluation.status === "continue_small_pilot") return "支持兜底仍需观察，建议继续小范围试点。";
    if (evaluation.status === "needs_review") return "发现高频问题或安全文案不稳定，建议复核后再扩大。";
    return "发现敏感泄露或交易风险，已阻断。";
  }
  function sanitizeFlightWorkflowSupportReadinessGate(gate) {
    const safe = obj(gate);
    const status = /^(ready|continue_small_pilot|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const criteria = Object.assign({ issuePatternReady:false, noRepeatedBlockingIssue:false, triageReady:false, supportFallbackReady:false, safetyCopyStable:false, noSensitiveLeakRisk:false, noTradingRisk:false }, obj(safe.criteria));
    return clone({
      gateName:GATE_NAME,
      appVersion:FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION,
      status:status,
      decision:{ decisionId:/^(continue_public_pilot|continue_small_pilot|pause_expansion|blocked)$/.test(obj(safe.decision).decisionId) ? safe.decision.decisionId : "blocked", label:text(obj(safe.decision).label || labelFor(status)), message:text(obj(safe.decision).message || labelFor(status)), supportReadyForPublicPilot:obj(safe.decision).supportReadyForPublicPilot === true },
      criteria:criteria,
      unmetCriteria:Array.isArray(safe.unmetCriteria) ? safe.unmetCriteria.map(text) : [],
      riskNotes:Array.isArray(safe.riskNotes) ? safe.riskNotes.map(text) : [],
      pilotReadinessSnapshotSummary:clone(safe.pilotReadinessSnapshotSummary || null),
      supportPlaybookSummary:clone(safe.supportPlaybookSummary || null),
      rolloutControlSummary:clone(safe.rolloutControlSummary || null),
      cohortHealthSummary:clone(safe.cohortHealthSummary || null),
      pilotOpsSummary:clone(safe.pilotOpsSummary || null),
      nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null),
      pilotOpsStatus:text(safe.pilotOpsStatus || obj(safe.pilotOpsSummary).status || ""),
      nextCohortDecisionStatus:text(safe.nextCohortDecisionStatus || obj(safe.nextCohortDecisionSummary).status || ""),
      pilotOpsPrimaryRisk:clone(safe.pilotOpsPrimaryRisk || obj(safe.pilotOpsSummary).primaryRisk || null),
      rolloutDecisionStatus:text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus:text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep:text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      cohortProgressSummary:clone(safe.cohortProgressSummary || null),
      trialMilestoneSummary:clone(safe.trialMilestoneSummary || null),
      cohortProgressStatus:text(safe.cohortProgressStatus || ""),
      trialMilestoneStatus:text(safe.trialMilestoneStatus || ""),
      safeToAdvanceNextCohort:safe.safeToAdvanceNextCohort === true || obj(safe.cohortProgressSummary).safeToAdvanceNextCohort === true || obj(safe.trialMilestoneSummary).safeToAdvanceNextCohort === true,
      pilotSnapshotStatus:text(safe.pilotSnapshotStatus || ""),
      supportPlaybookStatus:text(safe.supportPlaybookStatus || ""),
      pilotSnapshotNextStep:text(safe.pilotSnapshotNextStep || ""),
      userFacingSummary:{ title:"试点支持准备闸门", resultLabel:labelFor(status), caveat:CAVEAT },
      safety:safety(),
      redacted:true
    });
  }
  function buildFlightWorkflowSupportReadinessGate(input) {
    try {
      const evaluation = evaluateFlightWorkflowSupportReadiness(input || {});
      const riskNotes = evaluation.unmetCriteria.map(function (key) { return key === "supportFallbackReady" ? "支持兜底仍需观察" : key === "safetyCopyStable" ? "安全文案仍需复核" : key === "issuePatternReady" ? "问题趋势数据仍不足" : key === "noTradingRisk" ? "检测到交易字段风险" : key === "noSensitiveLeakRisk" ? "检测到敏感泄露风险" : "需要复核：" + key; });
      return sanitizeFlightWorkflowSupportReadinessGate({ status:evaluation.status, decision:{ decisionId:evaluation.decisionId, label:labelFor(evaluation.status), message:messageFor(evaluation), supportReadyForPublicPilot:evaluation.supportReadyForPublicPilot }, criteria:evaluation.criteria, unmetCriteria:evaluation.unmetCriteria, riskNotes:riskNotes, pilotReadinessSnapshotSummary:evaluation.pilotReadinessSnapshotSummary, supportPlaybookSummary:evaluation.supportPlaybookSummary, pilotSnapshotStatus:evaluation.pilotSnapshotStatus, supportPlaybookStatus:evaluation.supportPlaybookStatus, pilotSnapshotNextStep:evaluation.pilotSnapshotNextStep, pilotOpsSummary:evaluation.pilotOpsSummary, nextCohortDecisionSummary:evaluation.nextCohortDecisionSummary, pilotOpsStatus:evaluation.pilotOpsStatus, nextCohortDecisionStatus:evaluation.nextCohortDecisionStatus, pilotOpsPrimaryRisk:evaluation.pilotOpsPrimaryRisk });
    } catch (error) {
      return sanitizeFlightWorkflowSupportReadinessGate({ status:"failed_safe", decision:{ decisionId:"blocked", label:"已阻断", message:"支持准备输入异常，已安全降级。", supportReadyForPublicPilot:false }, criteria:{}, unmetCriteria:["failed_safe"], riskNotes:["支持准备输入异常"] });
    }
  }
  function buildFlightWorkflowSupportReadinessGateAuditDraft(input) {
    const gate = buildFlightWorkflowSupportReadinessGate(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_AUDIT_DRAFT", gateName:GATE_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION, status:gate.status, decisionId:gate.decision.decisionId, supportReadyForPublicPilot:gate.decision.supportReadyForPublicPilot, unmetCriteria:gate.unmetCriteria, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowSupportReadinessGate = { FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION, GATE_NAME, buildFlightWorkflowSupportReadinessGate, evaluateFlightWorkflowSupportReadiness, buildFlightWorkflowSupportReadinessCriteria, buildFlightWorkflowSupportReadinessGateAuditDraft, sanitizeFlightWorkflowSupportReadinessGate };
})();
