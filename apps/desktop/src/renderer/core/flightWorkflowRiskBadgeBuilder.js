;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION = "2.1.69";
  const BUILDER_NAME = "flight_workflow_risk_badge_builder_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function safety() { return { bookingUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, secretStored:false, redacted:true }; }
  function badge(badgeId, label, severity) { return { badgeId:badgeId, label:label, severity:severity || "info", redacted:true }; }
  function healthOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.auditHealth || safe.auditReview && safe.auditReview.auditHealth || safe.auditReviewCenter && safe.auditReviewCenter.auditHealth || {}; }
  function buildFlightWorkflowRiskBadges(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const health = healthOf(safe);
      const preview = safe.safeSessionExportPreview || safe.exportPreview || {};
      const badges = [badge("read_only_safe", "只读安全", "info")];
      if (health.hasConfirmationRequiredActions || safe.requiresConfirmation === true) badges.push(badge("confirmation_required", "需要二次确认", "warning"));
      if (health.hasBlockedActions || health.hasPaymentRisk || health.hasOrderRisk || health.hasTicketingRisk || safe.tradingBlocked === true) badges.push(badge("trading_blocked", "交易动作已阻断", "blocked"));
      if (health.hasSensitiveInputBlocked || health.hasIdentityUploadRisk) badges.push(badge("sensitive_input_blocked", "敏感输入已阻断", "blocked"));
      const checklist = safe.humanReviewChecklistSummary || safe.humanReviewChecklist || {};
      const packet = safe.finalSafeHandoffPacketSummary || safe.finalSafeHandoffPacket || {};
      const policy = safe.handoffPacketPolicyDecision || {};
      const sentinel = safe.safetyRegressionSummary || safe.sentinelReport || {};
      const operator = safe.operatorConsoleSummary || {};
      if (sentinel.status === "pass") badges.push(badge("safety_regression_pass", "安全回归通过", "info"));
      if (sentinel.status === "fail" || sentinel.status === "failed_safe") badges.push(badge("safety_regression_fail", "安全回归失败", "blocked"));
      if (operator.status === "ready") badges.push(badge("operator_console_ready", "运营控制台正常", "info"));
      if (operator.status === "warning" || checklist.status === "needs_review") badges.push(badge("manual_review_required", "需要人工复核", "warning"));
      if (checklist.status === "ready") badges.push(badge("human_review_done", "人工复核完成", "info"));
      if (checklist.status === "needs_review" || packet.status === "needs_review" || policy.status === "needs_review") badges.push(badge("human_review_needed", "仍需复核", "warning"));
      if (packet.status === "ready" && policy.status === "allowed") badges.push(badge("platform_confirmation_ready", "可进入平台确认", "info"));
      if (packet.status === "blocked" || policy.status === "blocked") badges.push(badge("handoff_packet_blocked", "交接包已阻断", "blocked"));
      if (preview.status === "ready" || safe.canPreviewExport === true) badges.push(badge("export_preview", "可预览脱敏摘要", "info"));
      const releaseReadiness = safe.releaseReadinessSummary || safe.releaseReadiness || {};
      const betaReadiness = safe.userFacingBetaReadiness || releaseReadiness.userFacingBetaReadiness || {};
      const copyStatus = safe.copyValidationStatus || releaseReadiness.copyValidationStatus || "";
      if (releaseReadiness.status === "ready" || betaReadiness.safeForUserFacingBeta === true || releaseReadiness.safeForUserFacingBeta === true) {
        badges.push(badge("release_ready", "发布就绪", "info"));
        badges.push(badge("read_only_beta_ready", "只读 Beta 可验收", "info"));
      } else if (releaseReadiness.status === "warning" || betaReadiness.status === "warning") {
        badges.push(badge("release_needs_review", "仍需复核", "warning"));
      } else if (releaseReadiness.status === "blocked" || releaseReadiness.status === "failed_safe" || betaReadiness.status === "blocked") {
        badges.push(badge("release_not_ready", "暂不可验收", "blocked"));
      }
      if (copyStatus === "pass" || releaseReadiness.copyValidationStatus === "pass") badges.push(badge("safety_copy_unified", "安全文案已统一", "info"));
      badges.push(badge("not_exportable", "不可导出", "warning"));
      return clone({ builderName:BUILDER_NAME, appVersion:FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, status:health.overall === "blocked" ? "blocked" : "ready", badges:badges, summaryLabel:summarizeFlightWorkflowRiskBadges(badges).summaryLabel, safety:safety(), bookingUrl:null, redacted:true });
    } catch (error) {
      return clone({ builderName:BUILDER_NAME, appVersion:FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, status:"failed_safe", badges:[badge("read_only_safe", "只读安全", "info"), badge("not_exportable", "不可导出", "warning")], summaryLabel:"只读安全 / 不可导出", safety:safety(), bookingUrl:null, redacted:true });
    }
  }
  function summarizeFlightWorkflowRiskBadges(badges) {
    const list = Array.isArray(badges) ? badges : [];
    return clone({ builderName:BUILDER_NAME, appVersion:FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, badgeCount:list.length, summaryLabel:list.map(function (item) { return safeText(item && item.label || ""); }).filter(Boolean).join(" / ") || "只读安全", safety:safety(), bookingUrl:null, redacted:true });
  }
  function buildFlightWorkflowRiskBadgeBuilderAuditDraft(input) {
    const model = buildFlightWorkflowRiskBadges(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_AUDIT_DRAFT", builderName:BUILDER_NAME, appVersion:FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, status:model.status, badgeCount:model.badges.length, summaryLabel:model.summaryLabel, bookingUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowRiskBadgeBuilder = { FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION, BUILDER_NAME, buildFlightWorkflowRiskBadges, summarizeFlightWorkflowRiskBadges, buildFlightWorkflowRiskBadgeBuilderAuditDraft };
})();
