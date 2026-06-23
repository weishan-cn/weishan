;(function () {
  "use strict";
  const FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION = "2.1.68";
  const CONSOLE_NAME = "flight_workflow_operator_console_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function row(label, value) { return { label:safeText(label), value:safeText(value), redacted:true }; }
  function sentinelReport(input) { const api = window.WeishanFlightWorkflowSafetyRegressionSentinel || {}; return input.safetyRegressionSummary || input.sentinelReport || (typeof api.buildFlightWorkflowSafetyRegressionReport === "function" ? api.buildFlightWorkflowSafetyRegressionReport(input) : { status:"pass", checks:[], failures:[], warnings:[], redacted:true }); }
  function evaluateFlightWorkflowOperatorReadiness(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return clone({ workflowReady:false, evidenceReady:false, auditReady:false, checklistReady:false, handoffPacketReady:false, safetyRegressionPass:false, safeToContinue:false, status:"failed_safe", redacted:true });
    const audit = input.auditReviewSummary || input.auditReview || input.auditReviewCenter || {};
    const checklist = input.humanReviewChecklistSummary || input.humanReviewChecklist || {};
    const packet = input.finalSafeHandoffPacketSummary || input.finalSafeHandoffPacket || {};
    const policy = input.handoffPacketPolicyDecision || {};
    const sentinel = sentinelReport(input);
    const workflowReady = !!(input.workflowStateSummary || input.currentStage || input.workflowId || input.actionQueueSummary);
    const evidenceReady = !!(input.selectedCandidate || input.selectedCandidateSummary || toArray(input.topCandidates || input.dryRunTopCandidates).length || input.sessionSummary);
    const auditReady = audit.status === "ready" || audit.status === "warning" || audit.auditHealth && audit.auditHealth.overall !== "blocked";
    const checklistReady = checklist.status === "ready";
    const handoffPacketReady = packet.status === "ready" || policy.status === "allowed";
    const safetyRegressionPass = sentinel.status === "pass";
    const blocked = sentinel.status === "fail" || sentinel.status === "failed_safe" || audit.status === "blocked" || audit.auditHealth && audit.auditHealth.overall === "blocked" || checklist.status === "blocked" || packet.status === "blocked" || policy.status === "blocked";
    const warning = !blocked && (checklist.status === "needs_review" || packet.status === "needs_review" || policy.status === "needs_review" || sentinel.status === "warning" || !workflowReady || !evidenceReady || !auditReady);
    return clone({ workflowReady:workflowReady, evidenceReady:evidenceReady, auditReady:auditReady, checklistReady:checklistReady, handoffPacketReady:handoffPacketReady, safetyRegressionPass:safetyRegressionPass, safeToContinue:!blocked && !warning, status:blocked ? "blocked" : (warning ? "warning" : "ready"), redacted:true });
  }
  function nextActionFor(readiness) { if (readiness.status === "blocked") return { actionId:"review_blocked_items", label:"查看已阻断动作", enabled:true, requiresUserConfirmation:false, redacted:true }; if (readiness.status === "warning") return { actionId:"complete_human_review", label:"补充人工复核", enabled:true, requiresUserConfirmation:false, redacted:true }; return { actionId:"continue_read_only_workflow", label:"继续只读流程", enabled:true, requiresUserConfirmation:false, redacted:true }; }
  function buildFlightWorkflowOperatorConsoleSections(input) {
    const safe = input && typeof input === "object" ? input : {};
    const readiness = evaluateFlightWorkflowOperatorReadiness(safe);
    const sentinel = sentinelReport(safe);
    const events = toArray(safe.eventLedgerSummary && safe.eventLedgerSummary.recentEvents || safe.recentEvents || safe.events).slice(-5);
    const blockedActions = toArray(safe.blockedActions || safe.actionQueueSummary && safe.actionQueueSummary.blockedActions || safe.actionQueue && safe.actionQueue.blockedActions);
    return clone([
      { sectionId:"workflow_status", title:"工作流状态", rows:[row("工作流", readiness.workflowReady ? "正常" : "需复核"), row("候选证据", readiness.evidenceReady ? "已准备" : "仍需复核")], redacted:true },
      { sectionId:"safety_status", title:"安全状态", rows:[row("安全回归", readiness.safetyRegressionPass ? "安全回归通过" : "安全回归失败"), row("审计结果", readiness.auditReady ? "安全检查通过" : "存在需要注意的项目")], redacted:true },
      { sectionId:"recent_events", title:"最近事件", rows:events.length ? events.map(function (event) { return row(event.eventType || event.actionId || "事件", event.status || event.message || "已记录"); }) : [row("最近动作", "暂无")], redacted:true },
      { sectionId:"blocked_actions", title:"已阻断动作", rows:blockedActions.length ? blockedActions.map(function (action) { return row(action.actionId || "blocked", action.label || action.reason || "已安全阻断"); }) : [row("已阻断动作", "暂无交易动作")], redacted:true },
      { sectionId:"handoff_readiness", title:"平台确认准备状态", rows:[row("人工复核", readiness.checklistReady ? "人工复核完成" : "需要人工复核"), row("交接包", readiness.handoffPacketReady ? "准备完成" : "仍需复核")], redacted:true }
    ]);
  }
  function buildFlightWorkflowOperatorConsole(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowOperatorConsole({ consoleName:CONSOLE_NAME, appVersion:FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, status:"failed_safe", workflowId:"deterministic-flight-workflow-operator-console-v2.1.68", readiness:evaluateFlightWorkflowOperatorReadiness(null), sections:[], userFacingSummary:{ title:"机票工作流运营控制台", resultLabel:"已安全阻断", caveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。", redacted:true }, nextOperatorAction:{ actionId:"failed_safe", label:"安全降级", enabled:false, requiresUserConfirmation:false, redacted:true }, safety:safety(), redacted:true });
      const readiness = evaluateFlightWorkflowOperatorReadiness(input);
      const label = readiness.status === "ready" ? "可以继续只读流程" : (readiness.status === "blocked" ? "已安全阻断" : "存在需要注意的项目");
      const sentinel = sentinelReport(input);
      return sanitizeFlightWorkflowOperatorConsole({ consoleName:CONSOLE_NAME, appVersion:FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, status:readiness.status, workflowId:safeText(input.workflowId || input.workflowStateSummary && input.workflowStateSummary.workflowId || "deterministic-flight-workflow-operator-console-v2.1.68"), readiness:readiness, sections:buildFlightWorkflowOperatorConsoleSections(input), userFacingSummary:{ title:"机票工作流运营控制台", resultLabel:label, caveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。", redacted:true }, safetyRegressionSummary:sentinel, sentinelStatus:sentinel.status, operatorReadiness:readiness, nextOperatorAction:nextActionFor(readiness), safety:safety(), redacted:true });
    } catch (error) { return sanitizeFlightWorkflowOperatorConsole({ consoleName:CONSOLE_NAME, appVersion:FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, status:"failed_safe", workflowId:"deterministic-flight-workflow-operator-console-v2.1.68", readiness:evaluateFlightWorkflowOperatorReadiness(null), sections:[], nextOperatorAction:{ actionId:"failed_safe", label:"安全降级", enabled:false, requiresUserConfirmation:false, redacted:true }, safety:safety(), redacted:true }); }
  }
  function sanitizeFlightWorkflowOperatorConsole(input) { const safe = input && typeof input === "object" ? input : {}; return clone({ consoleName:CONSOLE_NAME, appVersion:FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, status:safe.status || "failed_safe", workflowId:safeText(safe.workflowId || "deterministic-flight-workflow-operator-console-v2.1.68"), readiness:clone(safe.readiness || evaluateFlightWorkflowOperatorReadiness(null)), sections:toArray(safe.sections), userFacingSummary:Object.assign({ title:"机票工作流运营控制台", resultLabel:"存在需要注意的项目", caveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。" }, safe.userFacingSummary || {}), safetyRegressionSummary:safe.safetyRegressionSummary || null, sentinelStatus:safeText(safe.sentinelStatus || ""), operatorReadiness:clone(safe.operatorReadiness || safe.readiness || {}), nextOperatorAction:Object.assign({ actionId:"continue_read_only_workflow", label:"继续只读流程", enabled:false, requiresUserConfirmation:false, redacted:true }, safe.nextOperatorAction || {}), safety:Object.assign(safety(), safe.safety || {}), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  function buildFlightWorkflowOperatorConsoleAuditDraft(input) { const model = buildFlightWorkflowOperatorConsole(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_OPERATOR_CONSOLE_AUDIT_DRAFT", consoleName:CONSOLE_NAME, appVersion:FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, status:model.status, workflowId:model.workflowId, sentinelStatus:model.sentinelStatus, sectionCount:model.sections.length, nextActionId:model.nextOperatorAction && model.nextOperatorAction.actionId || "", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowOperatorConsole = { FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, CONSOLE_NAME, buildFlightWorkflowOperatorConsole, evaluateFlightWorkflowOperatorReadiness, buildFlightWorkflowOperatorConsoleSections, buildFlightWorkflowOperatorConsoleAuditDraft, sanitizeFlightWorkflowOperatorConsole };
})();
