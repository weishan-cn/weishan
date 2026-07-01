;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION = "3.5.0";
  const RADAR_NAME = "flight_workflow_public_pilot_issue_pattern_radar_v1";
  const CAVEAT = "问题趋势仅用于改进只读候选证据流程，不代表真实票价、库存或交易结果。";
  const SENSITIVE_RE = /token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/i;
  const PATTERNS = ["candidate_unclear", "platform_mismatch", "safety_copy_unclear", "consent_blocked", "feedback_error", "sensitive_input"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function categoryOf(issue) {
    const safe = obj(issue);
    const triage = obj(safe.triage);
    const recommendation = obj(obj(safe.supportFallbackRecommendation).recommendation);
    const category = text(safe.issueCategory || safe.category || safe.issueType || safe.dominantPattern || (safe.patternSummary && safe.patternSummary.dominantPattern) || recommendation.issueCategory || triage.issueCategory || "unknown");
    return PATTERNS.indexOf(category) >= 0 ? category : "unknown";
  }
  function collectIssues(input) {
    const safe = obj(input);
    const items = [];
    ["issues", "issueReviews", "issueReviewBoards", "supportTriages", "triageDashboards", "safeIssueIntakes", "supportFallbacks"].forEach(function (key) {
      if (Array.isArray(safe[key])) safe[key].forEach(function (item) { items.push(item); });
    });
    ["issueReviewBoard", "publicPilotIssueReviewBoard", "issueReviewSummary", "supportTriageDashboard", "supportTriageSummary", "issueIntakeSummary", "safeIssueIntakeSummary", "supportFallbackSummary"].forEach(function (key) {
      if (safe[key] && typeof safe[key] === "object") items.push(safe[key]);
    });
    return items.map(obj);
  }
  function countCategory(issues, category) {
    return issues.filter(function (issue) { return categoryOf(issue) === category || issue[category] === true; }).length;
  }
  function evaluateFlightWorkflowIssuePatterns(input) {
    const safe = obj(input);
    const issues = collectIssues(safe);
    const issueCount = issues.length;
    const blockedIssueCount = issues.filter(function (issue) { return issue.status === "blocked" || obj(issue.issueHealth).hasBlockedSensitiveInput === true; }).length;
    const redactedIssueCount = issues.filter(function (issue) { return issue.redacted === true || obj(issue.issueHealth).issueRedacted === true || issue.status === "redacted"; }).length;
    const platformMismatchCount = countCategory(issues, "platform_mismatch");
    const safetyCopyUnclearCount = countCategory(issues, "safety_copy_unclear");
    const consentBlockedCount = countCategory(issues, "consent_blocked");
    const feedbackErrorCount = countCategory(issues, "feedback_error");
    const candidateUnclearCount = countCategory(issues, "candidate_unclear");
    const sensitiveInputCount = countCategory(issues, "sensitive_input") + issues.filter(function (issue) { return issue.rawUserTextStored === true || issue.secretStored === true; }).length;
    const affectsPilotExpansionCount = issues.filter(function (issue) { return obj(issue.issueHealth).affectsPilotExpansion === true || obj(issue.triage).affectsPilotExpansion === true || issue.issueAffectsPilotExpansion === true; }).length;
    const tradingRisk = hasTradingUrl(safe) || issues.some(hasTradingUrl);
    const sensitiveRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || sensitiveInputCount > 0;
    const usableIssueCount = issues.filter(function (issue) { return issue.status !== "failed_safe" && issue.status !== "redacted" && !hasTradingUrl(issue); }).length;
    const ratios = {
      platform_mismatch:usableIssueCount ? platformMismatchCount / usableIssueCount : 0,
      safety_copy_unclear:usableIssueCount ? safetyCopyUnclearCount / usableIssueCount : 0,
      consent_blocked:usableIssueCount ? consentBlockedCount / usableIssueCount : 0,
      feedback_error:usableIssueCount ? feedbackErrorCount / usableIssueCount : 0,
      candidate_unclear:usableIssueCount ? candidateUnclearCount / usableIssueCount : 0,
      sensitive_input:usableIssueCount ? sensitiveInputCount / usableIssueCount : 0
    };
    const repeated = usableIssueCount >= 3 && (ratios.platform_mismatch >= 0.4 || ratios.safety_copy_unclear >= 0.3 || ratios.consent_blocked >= 0.3 || ratios.feedback_error >= 0.3 || ratios.candidate_unclear >= 0.4);
    let dominantPattern = "none";
    const counts = { candidate_unclear:candidateUnclearCount, platform_mismatch:platformMismatchCount, safety_copy_unclear:safetyCopyUnclearCount, consent_blocked:consentBlockedCount, feedback_error:feedbackErrorCount, sensitive_input:sensitiveInputCount };
    const sorted = PATTERNS.map(function (id) { return { id:id, count:counts[id] || 0 }; }).sort(function (a, b) { return b.count - a.count; });
    if (sorted[0] && sorted[0].count > 0) dominantPattern = sorted[1] && sorted[1].count === sorted[0].count && sorted[1].count > 0 ? "mixed" : sorted[0].id;
    let status = "ready";
    if (issueCount === 0 || usableIssueCount < 3) status = "insufficient_data";
    if (blockedIssueCount > 0 || repeated) status = "needs_review";
    if (sensitiveRisk || tradingRisk) status = "blocked";
    const severity = status === "blocked" ? "blocked" : (status === "needs_review" ? "warning" : "info");
    return clone({
      status:status,
      dominantPattern:dominantPattern,
      severity:severity,
      issuePatternHealth:{
        issueCount:issueCount,
        usableIssueCount:usableIssueCount,
        redactedIssueCount:redactedIssueCount,
        blockedIssueCount:blockedIssueCount,
        platformMismatchCount:platformMismatchCount,
        safetyCopyUnclearCount:safetyCopyUnclearCount,
        consentBlockedCount:consentBlockedCount,
        feedbackErrorCount:feedbackErrorCount,
        affectsPilotExpansionCount:affectsPilotExpansionCount,
        hasRepeatedPattern:repeated,
        safeToContinuePilot:status === "ready" || status === "insufficient_data"
      },
      counts:counts,
      tradingRisk:tradingRisk,
      sensitiveRisk:sensitiveRisk,
      redacted:true
    });
  }
  function signal(signalId, label, value, status) { return { signalId:signalId, label:label, value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "pass" }; }
  function buildFlightWorkflowIssuePatternSignals(input) {
    const evaluation = evaluateFlightWorkflowIssuePatterns(input || {});
    const health = evaluation.issuePatternHealth;
    return clone([
      signal("issue_count", "问题数量", String(health.issueCount), health.usableIssueCount < 3 ? "warning" : "pass"),
      signal("candidate_unclear", "候选证据看不懂", String(evaluation.counts.candidate_unclear || 0), evaluation.counts.candidate_unclear >= 2 ? "warning" : "pass"),
      signal("platform_mismatch", "平台核对不一致", String(health.platformMismatchCount), health.platformMismatchCount / Math.max(health.usableIssueCount, 1) >= 0.4 ? "warning" : "pass"),
      signal("safety_copy_unclear", "安全文案不清楚", String(health.safetyCopyUnclearCount), health.safetyCopyUnclearCount / Math.max(health.usableIssueCount, 1) >= 0.3 ? "warning" : "pass"),
      signal("consent_blocked", "只读范围确认失败", String(health.consentBlockedCount), health.consentBlockedCount / Math.max(health.usableIssueCount, 1) >= 0.3 ? "warning" : "pass"),
      signal("blocked_risk", "阻断性问题", String(health.blockedIssueCount), evaluation.status === "blocked" ? "blocked" : (health.blockedIssueCount > 0 ? "warning" : "pass"))
    ]);
  }
  function labelFor(status) {
    if (status === "blocked") return "发现阻断性问题";
    if (status === "needs_review") return "发现需要关注的问题趋势";
    return "暂无明显共性问题";
  }
  function messageFor(evaluation) {
    if (evaluation.status === "blocked") return "发现敏感输入或交易字段风险，已安全阻断。";
    if (evaluation.status === "needs_review") return "发现高频问题，建议复核后再扩大只读试点。";
    if (evaluation.status === "insufficient_data") return "可用问题数量不足，继续观察只读试点反馈。";
    return "暂无明显共性问题，可继续只读试点观察。";
  }
  function sanitizeFlightWorkflowIssuePatternRadar(radar) {
    const safe = obj(radar);
    const status = /^(ready|insufficient_data|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const health = Object.assign({ issueCount:0, usableIssueCount:0, redactedIssueCount:0, blockedIssueCount:0, platformMismatchCount:0, safetyCopyUnclearCount:0, consentBlockedCount:0, feedbackErrorCount:0, affectsPilotExpansionCount:0, hasRepeatedPattern:false, safeToContinuePilot:false }, obj(safe.issuePatternHealth));
    const pattern = obj(safe.patternSummary);
    return clone({
      radarName:RADAR_NAME,
      appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION,
      status:status,
      issuePatternHealth:health,
      signals:Array.isArray(safe.signals) ? safe.signals.map(function (item) { return signal(item.signalId, item.label, item.value, item.status); }) : [],
      patternSummary:{ dominantPattern:PATTERNS.indexOf(pattern.dominantPattern) >= 0 || pattern.dominantPattern === "none" || pattern.dominantPattern === "mixed" ? pattern.dominantPattern : "none", severity:/^(info|warning|blocked)$/.test(pattern.severity) ? pattern.severity : "info", message:text(pattern.message || labelFor(status)) },
      userFacingSummary:{ title:"试点问题趋势雷达", resultLabel:labelFor(status), caveat:CAVEAT },
      safety:safety(),
      redacted:true
    });
  }
  function buildFlightWorkflowPublicPilotIssuePatternRadar(input) {
    try {
      const evaluation = evaluateFlightWorkflowIssuePatterns(input || {});
      return sanitizeFlightWorkflowIssuePatternRadar({ status:evaluation.status, issuePatternHealth:evaluation.issuePatternHealth, signals:buildFlightWorkflowIssuePatternSignals(input || {}), patternSummary:{ dominantPattern:evaluation.dominantPattern, severity:evaluation.severity, message:messageFor(evaluation) } });
    } catch (error) {
      return sanitizeFlightWorkflowIssuePatternRadar({ status:"failed_safe", issuePatternHealth:{}, signals:[], patternSummary:{ dominantPattern:"none", severity:"blocked", message:"问题趋势输入异常，已安全降级。" } });
    }
  }
  function buildFlightWorkflowIssuePatternRadarAuditDraft(input) {
    const radar = buildFlightWorkflowPublicPilotIssuePatternRadar(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_AUDIT_DRAFT", radarName:RADAR_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION, status:radar.status, issuePatternHealth:radar.issuePatternHealth, dominantPattern:radar.patternSummary.dominantPattern, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowPublicPilotIssuePatternRadar = { FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION, RADAR_NAME, buildFlightWorkflowPublicPilotIssuePatternRadar, evaluateFlightWorkflowIssuePatterns, buildFlightWorkflowIssuePatternSignals, buildFlightWorkflowIssuePatternRadarAuditDraft, sanitizeFlightWorkflowIssuePatternRadar };
})();
