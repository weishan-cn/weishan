;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION = "3.3.0";
  const INTAKE_NAME = "flight_workflow_safe_issue_intake_flow_v1";
  const CATEGORY_LABELS = {
    candidate_unclear:"看不懂候选证据",
    platform_mismatch:"平台页面与候选证据不一致",
    safety_copy_unclear:"安全说明不清楚",
    consent_blocked:"只读范围确认无法完成",
    feedback_error:"反馈填写异常",
    other:"其它问题",
    unknown:"请选择问题类型"
  };
  const SENSITIVE_RE = /身份证|护照|银行卡|登录凭据|payment\s*link|order\s*link|token|apiKey|key|secret|password|credential|passport|cardNumber|https?:\/\/\S+/ig;
  const BLOCK_RE = /身份证|护照|银行卡|payment\s*link|order\s*link|token|apiKey|key|secret|password|credential|passport|cardNumber|https?:\/\/\S+/i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function normalizeCategory(value) { const key = text(value); return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, key) && key !== "unknown" ? key : "unknown"; }
  function buildFlightWorkflowIssueCategories() { return Object.keys(CATEGORY_LABELS).filter(function (key) { return key !== "unknown"; }).map(function (key) { return { categoryId:key, label:CATEGORY_LABELS[key], redacted:true }; }); }
  function nextStepFor(category, status) {
    if (status === "blocked") return { nextStepId:"blocked", label:"需要内部复核", message:"反馈包含敏感或交易字段，已阻断并仅保留脱敏摘要。" };
    if (category === "candidate_unclear") return { nextStepId:"review_candidate_evidence", label:"建议重新查看候选证据", message:"请回到只读候选证据摘要重新核对来源、价格与限制说明。" };
    if (category === "platform_mismatch") return { nextStepId:"record_platform_check", label:"建议记录平台核对结果", message:"请只记录平台核对差异摘要，不保存截图、链接或敏感信息。" };
    if (category === "safety_copy_unclear") return { nextStepId:"review_safety_copy", label:"建议查看安全说明", message:"请查看只读范围、安全限制与禁止能力说明。" };
    if (category === "consent_blocked") return { nextStepId:"retry_consent", label:"建议重新确认只读范围", message:"请重新查看只读范围确认，不代表交易授权。" };
    return { nextStepId:"continue_internal_review", label:"需要内部复核", message:"问题反馈仅用于改进只读候选证据流程。" };
  }
  function evaluateFlightWorkflowIssueIntake(input) {
    const safe = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const category = normalizeCategory(safe.issueCategory || safe.category || safe.issueType);
    const note = text(safe.userNote || safe.note || safe.rawUserText || "");
    const sensitive = BLOCK_RE.test(note) || safe.rawUserTextStored === true || safe.secretStored === true;
    let status = category === "unknown" ? "needs_category" : "ready";
    if (sensitive) status = /token|key|secret|password|银行卡|身份证|护照|payment|order|https?:\/\//i.test(note) || safe.secretStored === true ? "blocked" : "redacted";
    return clone({ status:status, issueCategory:category, sensitive:sensitive, redactedUserNote:note ? safeText(note) : "", redacted:true });
  }
  function buildFlightWorkflowIssueIntakeSummary(input) {
    const evaluation = evaluateFlightWorkflowIssueIntake(input || {});
    const severity = evaluation.status === "blocked" ? "blocked" : (evaluation.status === "redacted" || evaluation.issueCategory === "platform_mismatch" || evaluation.issueCategory === "safety_copy_unclear" ? "warning" : "info");
    return clone({ categoryLabel:CATEGORY_LABELS[evaluation.issueCategory] || CATEGORY_LABELS.unknown, severity:severity, redactedUserNote:evaluation.redactedUserNote ? "redacted" : "", safeForSupportReview:evaluation.status === "ready" || evaluation.status === "redacted", redacted:true });
  }
  function sanitizeFlightWorkflowIssueIntake(intake) {
    const safe = intake && typeof intake === "object" ? intake : {};
    const status = /^(ready|needs_category|redacted|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const category = normalizeCategory(safe.issueCategory);
    return clone({ intakeName:INTAKE_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION, status:status, issueCategory:category, issueSummary:Object.assign({ categoryLabel:CATEGORY_LABELS[category] || CATEGORY_LABELS.unknown, severity:status === "blocked" ? "blocked" : "info", redactedUserNote:"", safeForSupportReview:status === "ready" || status === "redacted" }, safe.issueSummary || {}), suggestedNextStep:Object.assign(nextStepFor(category, status), safe.suggestedNextStep || {}), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowSafeIssueIntakeFlow(input) {
    try { const evaluation = evaluateFlightWorkflowIssueIntake(input || {}); return sanitizeFlightWorkflowIssueIntake({ status:evaluation.status, issueCategory:evaluation.issueCategory, issueSummary:buildFlightWorkflowIssueIntakeSummary(input || {}), suggestedNextStep:nextStepFor(evaluation.issueCategory, evaluation.status) }); }
    catch (error) { return sanitizeFlightWorkflowIssueIntake({ status:"failed_safe", issueCategory:"unknown" }); }
  }
  function buildFlightWorkflowSafeIssueIntakeFlowAuditDraft(input) { const intake = buildFlightWorkflowSafeIssueIntakeFlow(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_AUDIT_DRAFT", intakeName:INTAKE_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION, status:intake.status, issueCategory:intake.issueCategory, nextStepId:intake.suggestedNextStep.nextStepId, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }
  window.WeishanFlightWorkflowSafeIssueIntakeFlow = { FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION, INTAKE_NAME, buildFlightWorkflowSafeIssueIntakeFlow, evaluateFlightWorkflowIssueIntake, buildFlightWorkflowIssueCategories, buildFlightWorkflowIssueIntakeSummary, buildFlightWorkflowSafeIssueIntakeFlowAuditDraft, sanitizeFlightWorkflowIssueIntake };
})();
