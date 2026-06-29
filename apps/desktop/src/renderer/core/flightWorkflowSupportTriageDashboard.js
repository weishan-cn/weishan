;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION = "2.2.5";
  const DASHBOARD_NAME = "flight_workflow_support_triage_dashboard_v1";
  const CAVEAT = "问题分流仅用于本地改进参考，不会提交客服工单或交易请求。";
  const TRIAGE = {
    candidate_unclear:{ triageId:"evidence_review", label:"证据复核", message:"重新查看只读候选证据与来源说明。", affectsPilotExpansion:false, requiresInternalReview:false },
    platform_mismatch:{ triageId:"platform_check_review", label:"平台核对复核", message:"复核平台核对差异摘要，不打开或提交外部平台。", affectsPilotExpansion:true, requiresInternalReview:false },
    safety_copy_unclear:{ triageId:"safety_copy_review", label:"安全文案复核", message:"复核只读范围、安全限制与禁止能力说明。", affectsPilotExpansion:true, requiresInternalReview:false },
    consent_blocked:{ triageId:"consent_review", label:"只读范围确认复核", message:"复核只读范围确认流程，不代表交易授权。", affectsPilotExpansion:false, requiresInternalReview:false },
    feedback_error:{ triageId:"feedback_flow_review", label:"反馈流程复核", message:"复核反馈填写流程是否清楚。", affectsPilotExpansion:false, requiresInternalReview:true },
    internal_review:{ triageId:"internal_review", label:"内部复核", message:"该问题需要内部复核后再用于试点改进。", affectsPilotExpansion:false, requiresInternalReview:true },
    blocked:{ triageId:"blocked", label:"安全阻断", message:"问题包含敏感或交易字段，已安全阻断。", affectsPilotExpansion:false, requiresInternalReview:true },
    unknown:{ triageId:"evidence_review", label:"证据复核", message:"当前暂无明确问题，保留为只读证据复核。", affectsPilotExpansion:false, requiresInternalReview:false }
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(/token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/ig, "redacted").trim(); }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function issueBoard(input) { const safe = obj(input); return first(safe.issueReviewBoard, safe.publicPilotIssueReviewBoard, safe.issueReviewSummary, safe.board); }
  function fallback(input) { const safe = obj(input); return first(safe.supportFallbackRecommendation, safe.supportFallbackSummary, safe.supportFallback, safe.fallbackRecommendation); }
  function issueCategory(input) {
    const safe = obj(input);
    const board = issueBoard(safe);
    const support = fallback(safe);
    return text(safe.issueCategory || safe.category || board.issueCategory || (support.issueIntakeSummary && support.issueIntakeSummary.issueCategory) || (support.recommendation && support.recommendation.issueCategory) || "unknown") || "unknown";
  }
  function recId(input) { return text(obj(fallback(input).recommendation).recommendationId || obj(fallback(input).suggestedNextStep).nextStepId); }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function evaluateFlightWorkflowSupportTriage(input) {
    const safe = obj(input);
    const board = issueBoard(safe);
    const support = fallback(safe);
    const category = issueCategory(safe);
    const recommendationId = recId(safe);
    const blocked = board.status === "blocked" || support.status === "blocked" || safe.rawUserTextStored === true || safe.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(board) || hasTradingUrl(support);
    let triage = TRIAGE[category] || TRIAGE.unknown;
    let status = "ready";
    if (recommendationId === "internal_review" || support.status === "needs_review" || board.status === "needs_review") { triage = TRIAGE.internal_review; status = "needs_internal_review"; }
    if (blocked) { triage = TRIAGE.blocked; status = "blocked"; }
    return clone({ status:status, triage:triage, blockedReasons:blocked ? ["sensitive_or_trading_field_blocked"] : [], redacted:true });
  }
  function buildFlightWorkflowSupportTriageRows(input) {
    const evaluation = evaluateFlightWorkflowSupportTriage(input || {});
    return clone([
      { rowId:"triage", label:"分流建议", value:text(evaluation.triage.label), status:evaluation.status === "blocked" ? "blocked" : "pass" },
      { rowId:"pilot_expansion", label:"试点影响", value:evaluation.triage.affectsPilotExpansion ? "问题影响试点扩大" : "暂不影响试点扩大", status:evaluation.triage.affectsPilotExpansion ? "warning" : "pass" },
      { rowId:"internal_review", label:"内部复核", value:evaluation.triage.requiresInternalReview ? "需要内部复核" : "无需内部复核", status:evaluation.triage.requiresInternalReview ? "warning" : "pass" },
      { rowId:"caveat", label:"安全限制", value:CAVEAT, status:"pass" }
    ]);
  }
  function labelFor(status) {
    if (status === "blocked") return "问题已安全阻断";
    if (status === "needs_internal_review") return "需要内部复核";
    return "已有建议处理路径";
  }
  function sanitizeFlightWorkflowSupportTriageDashboard(dashboard) {
    const safe = obj(dashboard);
    const status = /^(ready|needs_internal_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const triage = Object.assign({}, TRIAGE.unknown, obj(safe.triage));
    return clone({ dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION, status:status, triage:{ triageId:text(triage.triageId), label:text(triage.label), message:text(triage.message), affectsPilotExpansion:triage.affectsPilotExpansion === true, requiresInternalReview:triage.requiresInternalReview === true }, rows:Array.isArray(safe.rows) ? safe.rows.map(function (item) { return { rowId:text(item.rowId), label:text(item.label), value:text(item.value), status:/^(pass|warning|blocked)$/.test(item.status) ? item.status : "pass" }; }) : [], blockedReasons:Array.isArray(safe.blockedReasons) ? safe.blockedReasons.map(text) : [], userFacingSummary:{ title:"问题分流面板", resultLabel:labelFor(status), caveat:CAVEAT }, safety:safety(), redacted:true });
  }
  function buildFlightWorkflowSupportTriageDashboard(input) {
    try {
      const evaluation = evaluateFlightWorkflowSupportTriage(input || {});
      return sanitizeFlightWorkflowSupportTriageDashboard({ status:evaluation.status, triage:evaluation.triage, rows:buildFlightWorkflowSupportTriageRows(input || {}), blockedReasons:evaluation.blockedReasons });
    } catch (error) {
      return sanitizeFlightWorkflowSupportTriageDashboard({ status:"failed_safe", triage:TRIAGE.blocked, rows:[], blockedReasons:["failed_safe"] });
    }
  }
  function buildFlightWorkflowSupportTriageDashboardAuditDraft(input) {
    const dashboard = buildFlightWorkflowSupportTriageDashboard(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_AUDIT_DRAFT", dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION, status:dashboard.status, triageId:dashboard.triage.triageId, affectsPilotExpansion:dashboard.triage.affectsPilotExpansion, requiresInternalReview:dashboard.triage.requiresInternalReview, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowSupportTriageDashboard = { FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION, DASHBOARD_NAME, buildFlightWorkflowSupportTriageDashboard, evaluateFlightWorkflowSupportTriage, buildFlightWorkflowSupportTriageRows, buildFlightWorkflowSupportTriageDashboardAuditDraft, sanitizeFlightWorkflowSupportTriageDashboard };
})();
