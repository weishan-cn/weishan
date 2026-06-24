;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION = "2.1.79";
  const BOARD_NAME = "flight_workflow_public_pilot_issue_review_board_v1";
  const CAVEAT = "问题复核只用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。";
  const SENSITIVE_RE = /token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/i;
  const CATEGORY_LABELS = {
    candidate_unclear:"看不懂候选证据",
    platform_mismatch:"平台页面与候选证据不一致",
    safety_copy_unclear:"安全说明不清楚",
    consent_blocked:"只读范围确认无法完成",
    feedback_error:"反馈填写异常",
    other:"其它问题",
    unknown:"暂无问题反馈"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function issueSource(input) { const safe = obj(input); return first(safe.issueIntake, safe.safeIssueIntake, safe.issueIntakeSummary, safe.safeIssueIntakeSummary, safe.safeIssueIntakeFlow); }
  function fallbackSource(input) { const safe = obj(input); return first(safe.supportFallbackRecommendation, safe.supportFallbackSummary, safe.supportFallback, safe.fallbackRecommendation); }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function categoryOf(issue) {
    const safe = obj(issue);
    return text(safe.issueCategory || safe.category || safe.issueType || (safe.issueSummary && safe.issueSummary.issueCategory) || "unknown") || "unknown";
  }
  function statusOf(issue, fallback) {
    const issueStatus = text(obj(issue).status);
    const fallbackStatus = text(obj(fallback).status);
    const recommendationId = text(obj(obj(fallback).recommendation).recommendationId);
    if (issueStatus === "blocked") return "blocked";
    if (issueStatus === "redacted" || fallbackStatus === "needs_review" || recommendationId === "internal_review") return "needs_review";
    if (issueStatus === "failed_safe" || fallbackStatus === "failed_safe") return "failed_safe";
    return issueStatus === "ready" || fallbackStatus === "ready" || categoryOf(issue) !== "unknown" ? "ready" : "ready";
  }
  function evaluateFlightWorkflowPublicPilotIssueReview(input) {
    const safe = obj(input);
    const issue = issueSource(safe);
    const fallback = fallbackSource(safe);
    const category = categoryOf(issue);
    const issueStatus = text(issue.status);
    const fallbackRecommendation = obj(fallback.recommendation);
    const blockedSensitive = safe.rawUserTextStored === true || safe.secretStored === true || issue.rawUserTextStored === true || issue.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(issue) || hasTradingUrl(fallback);
    const sensitiveText = SENSITIVE_RE.test(JSON.stringify({ category:category, status:issueStatus, fallbackStatus:fallback.status || "", recommendationId:fallbackRecommendation.recommendationId || "" }));
    const affectsPilotExpansion = category === "platform_mismatch" || category === "safety_copy_unclear" || safe.issueAffectsPilotExpansion === true;
    const requiresInternalReview = issueStatus === "redacted" || fallback.status === "needs_review" || fallbackRecommendation.recommendationId === "internal_review" || safe.issueRequiresInternalReview === true;
    let status = statusOf(issue, fallback);
    if (blockedSensitive || issueStatus === "blocked" || sensitiveText) status = "blocked";
    return clone({
      status:status,
      issueCategory:category,
      issueHealth:{
        hasIssue:category !== "unknown" || issueStatus === "ready" || issueStatus === "redacted" || issueStatus === "blocked",
        issueRedacted:issueStatus === "redacted" || obj(issue.issueSummary).redacted === true || issue.redacted === true,
        safeForSupportReview:status === "ready" || status === "needs_review",
        requiresInternalReview:status === "blocked" || requiresInternalReview,
        affectsPilotExpansion:affectsPilotExpansion,
        hasBlockedSensitiveInput:status === "blocked"
      },
      redacted:true
    });
  }
  function row(rowId, label, value, status) { return { rowId:rowId, label:label, value:text(value), status:status || "pass" }; }
  function buildFlightWorkflowPublicPilotIssueReviewRows(input) {
    const evaluation = evaluateFlightWorkflowPublicPilotIssueReview(input || {});
    const categoryLabel = CATEGORY_LABELS[evaluation.issueCategory] || CATEGORY_LABELS.unknown;
    return clone([
      row("issue_status", "问题状态", evaluation.status === "blocked" ? "问题已安全阻断" : (evaluation.status === "needs_review" ? "需要内部复核" : "问题可用于改进参考"), evaluation.status === "blocked" ? "blocked" : (evaluation.status === "needs_review" ? "warning" : "pass")),
      row("issue_category", "问题类型", categoryLabel, evaluation.issueCategory === "unknown" ? "pass" : "warning"),
      row("redacted", "已脱敏", evaluation.issueHealth.issueRedacted || evaluation.issueHealth.safeForSupportReview ? "问题反馈已脱敏" : "暂无问题反馈", "pass"),
      row("pilot_expansion", "影响试点扩大", evaluation.issueHealth.affectsPilotExpansion ? "问题影响试点扩大" : "暂不影响试点扩大", evaluation.issueHealth.affectsPilotExpansion ? "warning" : "pass"),
      row("internal_review", "内部复核", evaluation.issueHealth.requiresInternalReview ? "需要内部复核" : "无需内部复核", evaluation.issueHealth.requiresInternalReview ? "warning" : "pass")
    ]);
  }
  function finding(findingId, severity, title, message) { return { findingId:findingId, severity:severity, title:title, message:message }; }
  function buildFlightWorkflowPublicPilotIssueFindings(input) {
    const evaluation = evaluateFlightWorkflowPublicPilotIssueReview(input || {});
    const findings = [finding("redacted_feedback", "info", "问题反馈已脱敏", "问题反馈仅保留脱敏后的分类与处理状态。")];
    if (evaluation.status === "blocked") findings.push(finding("blocked_sensitive_input", "blocked", "问题已安全阻断", "检测到敏感输入或交易字段，已阻断复核输出。"));
    if (evaluation.issueHealth.requiresInternalReview) findings.push(finding("internal_review", "warning", "问题需要内部复核", "该问题需要运营或产品内部复核后再用于试点改进。"));
    if (evaluation.issueHealth.affectsPilotExpansion) findings.push(finding("pilot_expansion", "warning", "问题影响试点扩大", "平台核对差异或安全文案问题会影响继续扩大试点。"));
    if (findings.length === 1 && !evaluation.issueHealth.hasIssue) findings.push(finding("no_issue", "info", "暂无问题反馈", "当前只读试点暂无可复核问题。"));
    return clone(findings);
  }
  function labelFor(status) {
    if (status === "blocked") return "问题已安全阻断";
    if (status === "needs_review") return "需要内部复核";
    return "问题可用于改进参考";
  }
  function sanitizeFlightWorkflowPublicPilotIssueReviewBoard(board) {
    const safe = obj(board);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const health = Object.assign({ hasIssue:false, issueRedacted:false, safeForSupportReview:false, requiresInternalReview:false, affectsPilotExpansion:false, hasBlockedSensitiveInput:false }, obj(safe.issueHealth));
    return clone({ boardName:BOARD_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION, status:status, issueHealth:health, rows:Array.isArray(safe.rows) ? safe.rows.map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : [], findings:Array.isArray(safe.findings) ? safe.findings.map(function (item) { return finding(text(item.findingId), /^(info|warning|blocked)$/.test(item.severity) ? item.severity : "info", text(item.title), text(item.message)); }) : [], userFacingSummary:{ title:"只读试点问题复核", resultLabel:labelFor(status), caveat:CAVEAT }, safety:safety(), redacted:true });
  }
  function buildFlightWorkflowPublicPilotIssueReviewBoard(input) {
    try {
      const evaluation = evaluateFlightWorkflowPublicPilotIssueReview(input || {});
      return sanitizeFlightWorkflowPublicPilotIssueReviewBoard({ status:evaluation.status, issueHealth:evaluation.issueHealth, rows:buildFlightWorkflowPublicPilotIssueReviewRows(input || {}), findings:buildFlightWorkflowPublicPilotIssueFindings(input || {}) });
    } catch (error) {
      return sanitizeFlightWorkflowPublicPilotIssueReviewBoard({ status:"failed_safe", rows:[], findings:[finding("failed_safe", "blocked", "问题复核失败安全降级", "问题复核输入异常，已安全降级。")] });
    }
  }
  function buildFlightWorkflowPublicPilotIssueReviewBoardAuditDraft(input) {
    const board = buildFlightWorkflowPublicPilotIssueReviewBoard(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_AUDIT_DRAFT", boardName:BOARD_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION, status:board.status, issueHealth:board.issueHealth, rowCount:board.rows.length, findingCount:board.findings.length, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowPublicPilotIssueReviewBoard = { FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION, BOARD_NAME, buildFlightWorkflowPublicPilotIssueReviewBoard, evaluateFlightWorkflowPublicPilotIssueReview, buildFlightWorkflowPublicPilotIssueReviewRows, buildFlightWorkflowPublicPilotIssueFindings, buildFlightWorkflowPublicPilotIssueReviewBoardAuditDraft, sanitizeFlightWorkflowPublicPilotIssueReviewBoard };
})();
