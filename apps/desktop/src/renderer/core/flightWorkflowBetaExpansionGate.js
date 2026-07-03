;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION = "4.1.2";
  const GATE_NAME = "flight_workflow_beta_expansion_gate_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  const TRADING_RE = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"https?:\/\//i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function blockedInput(input) { const source = JSON.stringify(input && typeof input === "object" ? input : {}); return /rawUserTextStored"?\s*:?\s*true/i.test(source) || /secretStored"?\s*:?\s*true/i.test(source) || TRADING_RE.test(source); }
  function summary(input, names) { const safe = input && typeof input === "object" ? input : {}; for (let i = 0; i < names.length; i += 1) if (safe[names[i]]) return safe[names[i]]; return {}; }
  function snapshot(input) { return summary(input, ["pilotReadinessSnapshotSummary", "publicPilotReadinessSnapshotSummary", "snapshotSummary"]); }
  function playbook(input) { return summary(input, ["supportPlaybookSummary", "supportPlaybookConsoleSummary", "playbookSummary"]); }
  function bool(value) { return value === true; }
  function criteriaItem(criteriaId, label, passed, message) { return { criteriaId:criteriaId, label:safeText(label), passed:passed === true, message:safeText(message), status:passed === true ? "pass" : "needs_review", redacted:true }; }
  function evaluateFlightWorkflowBetaExpansionDecision(input) {
    const safe = input && typeof input === "object" ? input : {};
    const release = summary(safe, ["releaseReadinessSummary", "releaseReadiness"]);
    const matrix = summary(safe, ["safetyTestMatrixSummary", "matrixSummary", "safetyMatrixSummary"]);
    const sentinel = summary(safe, ["safetyRegressionSummary", "sentinelReport"]);
    const cohort = summary(safe, ["betaCohortSummary", "cohortReviewSummary"]);
    const trend = summary(safe, ["feedbackTrendSummary", "trendRadarSummary"]);
    const human = summary(safe, ["humanReviewChecklistSummary", "humanReview", "humanReviewSummary"]);
    const acceptance = summary(safe, ["acceptanceSessionSummary", "betaAcceptanceSummary", "acceptanceSummary"]);
    const issueReview = summary(safe, ["issueReviewSummary", "issueReviewBoard"]);
    const supportReadiness = summary(safe, ["supportReadinessSummary", "supportReadinessGate"]);
    const issuePattern = summary(safe, ["issuePatternSummary", "issuePatternRadar"]);
    const pilotSnapshot = snapshot(safe);
    const supportPlaybook = playbook(safe);
    const issueHealth = issueReview.issueHealth || {};
    const hasPilotSnapshotInput = Boolean(safe.pilotReadinessSnapshotSummary || safe.publicPilotReadinessSnapshotSummary || safe.snapshotSummary);
    const hasSupportPlaybookInput = Boolean(safe.supportPlaybookSummary || safe.supportPlaybookConsoleSummary || safe.playbookSummary);
    const releaseReadinessReady = release.status === "ready" || release.releaseReady === true || release.safeForUserFacingBeta === true;
    const safetyMatrixPass = safe.safetyMatrixPass === true || matrix.status === "pass" || matrix.status === "ready" || matrix.overallHealth === "pass" || matrix.overallHealth === "ready";
    const safetySentinelPass = safe.safetySentinelPass === true || sentinel.status === "pass" || sentinel.status === "ready";
    const cohortReady = cohort.status === "ready" || cohort.cohortHealth && cohort.cohortHealth.safeToExpandBeta === true || safe.betaExpansionReadiness === true;
    const feedbackTrendPositive = trend.status === "ready" || trend.trends && trend.trends.overallTrend === "positive" || trend.recommendation && trend.recommendation.recommendationId === "expand_read_only_beta";
    const humanReviewReady = human.status === "ready" || safe.humanReviewReady === true;
    const acceptanceSessionReady = acceptance.status === "completed" || acceptance.status === "ready" || acceptance.safeForGuidedUserTest === true || acceptance.safeForUserFacingBeta === true;
    const safetyCopyLow = trend.trends && trend.trends.safetyCopyTrend === "not_understood" || cohort.findings && JSON.stringify(cohort.findings).indexOf("安全文案理解不足") >= 0 || safe.safetyCopyUnderstood === false;
    const blockedSafety = blockedInput(safe) || matrix.status === "fail" || matrix.status === "blocked" || matrix.overallHealth === "fail" || Number(matrix.failedCount || 0) > 0 || Number(matrix.blockedCount || 0) > 0 || sentinel.status === "fail" || sentinel.status === "failed_safe" || release.status === "blocked" || release.status === "failed_safe" || issueReview.status === "blocked" || supportReadiness.status === "blocked" || pilotSnapshot.status === "blocked" || supportPlaybook.status === "blocked";
    const criteria = { releaseReadinessReady:releaseReadinessReady, safetyMatrixPass:safetyMatrixPass, safetySentinelPass:safetySentinelPass, cohortReady:cohortReady, feedbackTrendPositive:feedbackTrendPositive, humanReviewReady:humanReviewReady, acceptanceSessionReady:acceptanceSessionReady, noBlockedSafetyRisk:!blockedSafety, pilotSnapshotReady:!hasPilotSnapshotInput || pilotSnapshot.status === "ready" || pilotSnapshot.status === "continue_small_pilot", supportPlaybookReady:!hasSupportPlaybookInput || supportPlaybook.status === "ready" || supportPlaybook.status === "needs_review" };
    const unmet = [];
    Object.keys(criteria).forEach(function (name) { if (!criteria[name]) unmet.push(name); });
    const riskNotes = [];
    if (blockedSafety) riskNotes.push("存在安全阻断或交易字段风险。");
    if (cohort.status === "needs_more_feedback") riskNotes.push("Beta 批次仍需更多反馈。");
    if (trend.status === "insufficient_data") riskNotes.push("反馈趋势数据不足。");
    if (safetyCopyLow) riskNotes.push("安全文案理解不足。");
    if (issueHealth.affectsPilotExpansion === true || safe.issueAffectsPilotExpansion === true) riskNotes.push("问题影响试点扩大。");
    if (issueHealth.requiresInternalReview === true || safe.issueRequiresInternalReview === true) riskNotes.push("问题需要内部复核。");
    if (supportReadiness.status === "needs_review" || issuePattern.status === "needs_review") riskNotes.push("需要暂停扩大测试。");
    if (human.status === "needs_review" || human.status === "warning") riskNotes.push("人工复核仍需完成。");
    let status = "needs_review";
    let decisionId = "continue_internal_testing";
    let label = "继续内部测试";
    let message = "继续内部只读测试，补齐未满足项。";
    if (blockedSafety) { status = "blocked"; decisionId = "blocked"; label = "暂不可扩大测试"; message = "安全矩阵、回归哨兵、发布就绪或输入安全存在阻断项。"; }
    else if (cohort.status === "needs_more_feedback" || trend.status === "insufficient_data") { status = "continue_internal_testing"; decisionId = "continue_internal_testing"; label = "继续内部测试"; message = "继续收集脱敏反馈后再扩大只读测试。"; }
    else if (safetyCopyLow) { status = "needs_review"; decisionId = "improve_safety_copy"; label = "仍需复核"; message = "先改进安全文案理解，再考虑扩大只读测试。"; }
    else if (supportReadiness.status === "needs_review" || issuePattern.status === "needs_review" || supportPlaybook.status === "needs_review" || pilotSnapshot.status === "needs_review") { status = "needs_review"; decisionId = "pause_expansion"; label = "需要暂停扩大测试"; message = "问题趋势、支持准备或试点快照仍需复核，暂不扩大只读测试。"; }
    else if (human.status === "needs_review" || human.status === "warning" || !humanReviewReady) { status = "needs_review"; decisionId = "continue_internal_testing"; label = "仍需复核"; message = "人工复核未完成，暂不扩大只读测试。"; }
    else if (Object.keys(criteria).every(function (name) { return criteria[name] === true; })) { status = "approved"; decisionId = "expand_read_only_beta"; label = "可以小范围扩大只读测试"; message = "只读 Beta 扩大测试条件已满足。"; }
    return clone({ issueAffectsPilotExpansion:issueHealth.affectsPilotExpansion === true || safe.issueAffectsPilotExpansion === true || supportReadiness.status === "needs_review" || issuePattern.status === "needs_review" || pilotSnapshot.status === "needs_review", issueRequiresInternalReview:issueHealth.requiresInternalReview === true || safe.issueRequiresInternalReview === true || supportReadiness.status === "needs_review", supportReadinessStatus:supportReadiness.status || safe.supportReadinessStatus || "", issuePatternStatus:issuePattern.status || safe.issuePatternStatus || "", supportReadyForPublicPilot:supportReadiness.decision && supportReadiness.decision.supportReadyForPublicPilot === true || safe.supportReadyForPublicPilot === true, repeatedIssueRisk:issuePattern.issuePatternHealth && issuePattern.issuePatternHealth.hasRepeatedPattern === true || safe.repeatedIssueRisk === true, pilotReadinessSnapshotSummary:clone(pilotSnapshot), supportPlaybookSummary:clone(supportPlaybook), pilotSnapshotStatus:text(pilotSnapshot.status || ""), supportPlaybookStatus:text(supportPlaybook.status || ""), pilotSnapshotNextStep:text(obj(pilotSnapshot.userFacingSummary).resultLabel || "继续小范围试点"), status:status, decision:{ decisionId:decisionId, label:label, message:message, safeToExpandReadOnlyBeta:status === "approved" }, criteria:criteria, unmetCriteria:unmet, riskNotes:riskNotes, redacted:true });
  }
  function buildFlightWorkflowBetaExpansionCriteria(input) {
    const decision = evaluateFlightWorkflowBetaExpansionDecision(input || {});
    return clone([
      criteriaItem("release_readiness", "发布就绪", decision.criteria.releaseReadinessReady, decision.criteria.releaseReadinessReady ? "发布就绪通过。" : "发布就绪仍需复核。"),
      criteriaItem("safety_matrix", "安全矩阵", decision.criteria.safetyMatrixPass, decision.criteria.safetyMatrixPass ? "安全矩阵通过。" : "安全矩阵未通过。"),
      criteriaItem("safety_sentinel", "安全回归哨兵", decision.criteria.safetySentinelPass, decision.criteria.safetySentinelPass ? "安全回归通过。" : "安全回归未通过。"),
      criteriaItem("cohort", "Beta 批次反馈", decision.criteria.cohortReady, decision.criteria.cohortReady ? "Beta 批次反馈可扩大。" : "仍需更多可用反馈。"),
      criteriaItem("trend", "反馈趋势", decision.criteria.feedbackTrendPositive, decision.criteria.feedbackTrendPositive ? "趋势正向。" : "趋势仍需观察。"),
      criteriaItem("human_review", "人工复核", decision.criteria.humanReviewReady, decision.criteria.humanReviewReady ? "人工复核完成。" : "仍需人工复核。"),
      criteriaItem("acceptance_session", "验收会话", decision.criteria.acceptanceSessionReady, decision.criteria.acceptanceSessionReady ? "验收会话完成。" : "验收会话仍需补齐。"),
      criteriaItem("blocked_safety", "无阻断安全风险", decision.criteria.noBlockedSafetyRisk, decision.criteria.noBlockedSafetyRisk ? "未发现阻断安全风险。" : "存在安全阻断风险。")
    ]);
  }
  function sanitizeFlightWorkflowBetaExpansionGate(gate) {
    const safe = gate && typeof gate === "object" ? gate : {};
    return clone({ gateName:GATE_NAME, appVersion:FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION, status:safeText(safe.status || "failed_safe"), decision:Object.assign({ decisionId:"blocked", label:"暂不可扩大测试", message:"安全降级。", safeToExpandReadOnlyBeta:false }, safe.decision || {}), criteria:Object.assign({ releaseReadinessReady:false, safetyMatrixPass:false, safetySentinelPass:false, cohortReady:false, feedbackTrendPositive:false, humanReviewReady:false, acceptanceSessionReady:false, noBlockedSafetyRisk:false, pilotSnapshotReady:false, supportPlaybookReady:false }, safe.criteria || {}), criteriaRows:toArray(safe.criteriaRows), unmetCriteria:toArray(safe.unmetCriteria).map(safeText), issueReviewSummary:clone(safe.issueReviewSummary || null), supportTriageSummary:clone(safe.supportTriageSummary || null), issuePatternSummary:clone(safe.issuePatternSummary || null), supportReadinessSummary:clone(safe.supportReadinessSummary || null), issuePatternStatus:safeText(safe.issuePatternStatus || ""), supportReadinessStatus:safeText(safe.supportReadinessStatus || ""), supportReadyForPublicPilot:safe.supportReadyForPublicPilot === true, repeatedIssueRisk:safe.repeatedIssueRisk === true, issueAffectsPilotExpansion:safe.issueAffectsPilotExpansion === true, issueRequiresInternalReview:safe.issueRequiresInternalReview === true, supportReadyForPublicPilot:safe.supportReadyForPublicPilot === true, riskNotes:toArray(safe.riskNotes).map(safeText), pilotReadinessSnapshotSummary:clone(safe.pilotReadinessSnapshotSummary || null), supportPlaybookSummary:clone(safe.supportPlaybookSummary || null), pilotSnapshotStatus:safeText(safe.pilotSnapshotStatus || ""), supportPlaybookStatus:safeText(safe.supportPlaybookStatus || ""), pilotSnapshotNextStep:safeText(safe.pilotSnapshotNextStep || ""), pilotOnboardingSummary:clone(safe.pilotOnboardingSummary || null), readOnlyConsentSummary:clone(safe.readOnlyConsentSummary || null), pilotEntryStatus:safeText(safe.pilotEntryStatus || ""), canEnterReadOnlyPilot:safe.canEnterReadOnlyPilot === true, pilotConsentRequired:safe.pilotConsentRequired === true, userFacingSummary:Object.assign({ title:"只读 Beta 扩大测试闸门", resultLabel:"暂不可扩大测试", caveat:"该判断只适用于只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true }, safe.userFacingSummary || {}), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowBetaExpansionGate(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowBetaExpansionGate({ status:"failed_safe", riskNotes:["输入格式异常。"] });
      const evaluation = evaluateFlightWorkflowBetaExpansionDecision(input);
      const resultLabel = evaluation.status === "approved" ? "可以小范围扩大只读测试" : (evaluation.status === "continue_internal_testing" ? "继续内部测试" : (evaluation.status === "blocked" ? "暂不可扩大测试" : "仍需复核"));
      return sanitizeFlightWorkflowBetaExpansionGate({ status:evaluation.status, decision:evaluation.decision, criteria:evaluation.criteria, criteriaRows:buildFlightWorkflowBetaExpansionCriteria(input), unmetCriteria:evaluation.unmetCriteria, issueAffectsPilotExpansion:evaluation.issueAffectsPilotExpansion, issueRequiresInternalReview:evaluation.issueRequiresInternalReview, issueReviewSummary:input.issueReviewSummary || null, supportTriageSummary:input.supportTriageSummary || null, issuePatternSummary:input.issuePatternSummary || null, supportReadinessSummary:input.supportReadinessSummary || null, issuePatternStatus:evaluation.issuePatternStatus, supportReadinessStatus:evaluation.supportReadinessStatus, supportReadyForPublicPilot:evaluation.supportReadyForPublicPilot, repeatedIssueRisk:evaluation.repeatedIssueRisk, riskNotes:evaluation.riskNotes, pilotReadinessSnapshotSummary:evaluation.pilotReadinessSnapshotSummary, supportPlaybookSummary:evaluation.supportPlaybookSummary, pilotSnapshotStatus:evaluation.pilotSnapshotStatus, supportPlaybookStatus:evaluation.supportPlaybookStatus, pilotSnapshotNextStep:evaluation.pilotSnapshotNextStep, userFacingSummary:{ title:"只读 Beta 扩大测试闸门", resultLabel:resultLabel, caveat:"该判断只适用于只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true } });
    } catch (error) { return sanitizeFlightWorkflowBetaExpansionGate({ status:"failed_safe" }); }
  }
  function buildFlightWorkflowBetaExpansionGateAuditDraft(input) { const gate = buildFlightWorkflowBetaExpansionGate(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_AUDIT_DRAFT", gateName:GATE_NAME, appVersion:FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION, status:gate.status, decisionId:gate.decision.decisionId, safeToExpandReadOnlyBeta:gate.decision.safeToExpandReadOnlyBeta === true, unmetCriteria:gate.unmetCriteria, riskNotes:gate.riskNotes, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowBetaExpansionGate = { FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION, GATE_NAME, buildFlightWorkflowBetaExpansionGate, evaluateFlightWorkflowBetaExpansionDecision, buildFlightWorkflowBetaExpansionCriteria, buildFlightWorkflowBetaExpansionGateAuditDraft, sanitizeFlightWorkflowBetaExpansionGate };
})();
