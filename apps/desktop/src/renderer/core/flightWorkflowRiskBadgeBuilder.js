;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RISK_BADGE_BUILDER_VERSION = "2.1.77";
  const BUILDER_NAME = "flight_workflow_risk_badge_builder_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
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
      const beta = safe.betaAcceptanceSummary || releaseReadiness.betaAcceptanceSummary || {};
      const guided = safe.guidedUserTestSummary || releaseReadiness.guidedUserTestSummary || {};
      const feedback = safe.feedbackSanitizerSummary || releaseReadiness.feedbackSanitizerSummary || {};
      if (beta.status === "ready" || releaseReadiness.betaAcceptanceReady === true || safe.betaAcceptanceReady === true) badges.push(badge("beta_acceptance_ready", "Beta 验收可开始", "info"));
      if (guided.status === "in_progress") badges.push(badge("guided_user_test_in_progress", "Beta 验收进行中", "warning"));
      if (guided.status === "completed") badges.push(badge("guided_user_test_completed", "Beta 验收完成", "info"));
      if (feedback.status === "ready" || feedback.status === "redacted") badges.push(badge("feedback_sanitized", "测试反馈已脱敏", "info"));
      const feedbackReview = safe.feedbackReviewSummary || releaseReadiness.feedbackReviewSummary || {};
      const sessionSummary = safe.acceptanceSessionSummary || releaseReadiness.acceptanceSessionSummary || {};
      if (feedbackReview.status === "ready") badges.push(badge("beta_feedback_ready", "测试反馈可用", "info"));
      if (feedbackReview.status === "needs_review") badges.push(badge("beta_feedback_needs_review", "测试反馈需复核", "warning"));
      if (sessionSummary.status === "completed") badges.push(badge("acceptance_session_completed", "验收会话完成", "info"));
      if (sessionSummary.status === "needs_review" || sessionSummary.status === "in_progress") badges.push(badge("acceptance_session_needs_review", "验收仍需复核", "warning"));
      if (feedbackReview.status === "blocked" || sessionSummary.status === "blocked") badges.push(badge("acceptance_session_blocked", "验收已阻断", "blocked"));
      const cohort = safe.betaCohortSummary || releaseReadiness.betaCohortSummary || {};
      const trend = safe.feedbackTrendSummary || releaseReadiness.feedbackTrendSummary || {};
      const cohortHealth = cohort.cohortHealth || {};
      if (cohort.status === "ready" || cohortHealth.safeToExpandBeta === true || trend.recommendation && trend.recommendation.recommendationId === "expand_read_only_beta") badges.push(badge("beta_cohort_expand_ready", "Beta 反馈可扩大测试", "info"));
      if (cohort.status === "needs_more_feedback" || trend.status === "insufficient_data") badges.push(badge("beta_cohort_insufficient", "趋势数据不足", "warning"));
      if (cohort.status === "needs_review" || trend.status === "needs_review") badges.push(badge("beta_cohort_watch", "Beta 反馈仍需观察", "warning"));
      if (cohort.findings && JSON.stringify(cohort.findings).indexOf("安全文案理解不足") >= 0 || trend.trends && trend.trends.safetyCopyTrend === "not_understood") badges.push(badge("beta_safety_copy_low", "安全文案理解不足", "warning"));
      if (cohort.findings && JSON.stringify(cohort.findings).indexOf("可用性反馈偏弱") >= 0 || trend.trends && trend.trends.usabilityTrend === "negative") badges.push(badge("beta_usability_low", "可用性反馈偏弱", "warning"));
      const expansionGate = safe.betaExpansionGateSummary || releaseReadiness.betaExpansionGateSummary || {};
      const publicPilot = safe.publicPilotChecklistSummary || releaseReadiness.publicPilotChecklistSummary || {};
      const pilotReadiness = safe.pilotReadinessSummary || releaseReadiness.pilotReadinessSummary || {};
      const onboarding = safe.pilotOnboardingSummary || releaseReadiness.pilotOnboardingSummary || {};
      const consent = safe.readOnlyConsentSummary || releaseReadiness.readOnlyConsentSummary || {};
      if (expansionGate.status === "approved" || expansionGate.decision && expansionGate.decision.safeToExpandReadOnlyBeta === true) badges.push(badge("beta_expansion_approved", "可以小范围扩大只读测试", "info"));
      if (expansionGate.status === "continue_internal_testing" || publicPilot.status === "needs_internal_testing" || pilotReadiness.status === "needs_internal_testing") badges.push(badge("pilot_continue_internal", "继续内部测试", "warning"));
      if (expansionGate.status === "needs_review" || publicPilot.status === "needs_review" || pilotReadiness.status === "needs_review") badges.push(badge("pilot_needs_review", "仍需复核", "warning"));
      if (expansionGate.status === "blocked" || publicPilot.status === "blocked" || pilotReadiness.status === "blocked") badges.push(badge("pilot_blocked", "暂不可扩大测试", "blocked"));
      if (publicPilot.status === "ready" || publicPilot.readiness && publicPilot.readiness.safeForSmallPublicPilot === true) badges.push(badge("public_pilot_checklist_ready", "试点检查清单通过", "info"));
      if (publicPilot.checklistName || pilotReadiness.viewModelName || expansionGate.gateName) badges.push(badge("public_pilot_read_only", "公开试点仍为只读", "info"));
      if (consent.status === "accepted" || consent.consentSummary && consent.consentSummary.allRequiredAccepted === true) badges.push(badge("pilot_consent_accepted", "已确认只读范围", "info"));
      else if (consent.consentFlowName || onboarding.guardName) badges.push(badge("pilot_consent_required", "仍需确认只读范围", "warning"));
      if (onboarding.status === "allowed" || onboarding.decision && onboarding.decision.canEnterReadOnlyPilot === true) badges.push(badge("pilot_entry_allowed", "可以进入只读试点", "info"));
      if (onboarding.status === "blocked" || onboarding.status === "failed_safe") badges.push(badge("pilot_entry_blocked", "暂不可进入只读试点", "blocked"));
      if (onboarding.guardName || consent.consentFlowName) badges.push(badge("pilot_consent_not_transaction", "只读试点不代表交易授权", "info"));
      const issueIntake = safe.issueIntakeSummary || releaseReadiness.issueIntakeSummary || {};
      const supportFallback = safe.supportFallbackSummary || releaseReadiness.supportFallbackSummary || {};
      const pilotSupport = safe.pilotSupportSummary || releaseReadiness.pilotSupportSummary || {};
      if (issueIntake.status === "ready" || issueIntake.status === "redacted" || pilotSupport.viewModelName) badges.push(badge("pilot_support_redacted", "问题反馈已脱敏", "info"));
      if (supportFallback.status === "ready") badges.push(badge("pilot_support_ready", "支持兜底正常", "info"));
      if (supportFallback.status === "needs_review" || supportFallback.status === "blocked" || issueIntake.status === "blocked") badges.push(badge("pilot_support_internal_review", "需要内部复核", "warning"));
      if (issueIntake.issueCategory === "platform_mismatch") badges.push(badge("pilot_platform_mismatch", "平台核对差异待处理", "warning"));
      if (issueIntake.issueCategory === "safety_copy_unclear") badges.push(badge("pilot_safety_copy_review", "安全文案需优化", "warning"));
      const issueReview = safe.issueReviewSummary || releaseReadiness.issueReviewSummary || {};
      const issueHealth = issueReview.issueHealth || {};
      const supportTriage = safe.supportTriageSummary || releaseReadiness.supportTriageSummary || {};
      const triage = supportTriage.triage || {};
      if (issueReview.status === "ready" || safe.pilotIssueReviewStatus === "ready") badges.push(badge("pilot_issue_review_ready", "问题可用于改进参考", "info"));
      if (issueReview.status === "needs_review" || supportTriage.status === "needs_internal_review" || safe.issueRequiresInternalReview === true || issueHealth.requiresInternalReview === true || triage.requiresInternalReview === true) badges.push(badge("pilot_issue_internal_review", "问题需要内部复核", "warning"));
      if (safe.issueAffectsPilotExpansion === true || issueHealth.affectsPilotExpansion === true || triage.affectsPilotExpansion === true) badges.push(badge("pilot_issue_affects_expansion", "问题影响试点扩大", "warning"));
      if (supportTriage.status === "ready" || triage.triageId) badges.push(badge("pilot_issue_triage_done", "问题分流完成", "info"));
      if (issueReview.status === "blocked" || supportTriage.status === "blocked") badges.push(badge("pilot_issue_blocked", "问题已安全阻断", "blocked"));
      const issuePattern = obj(safe.issuePatternSummary);
      const supportReadiness = obj(safe.supportReadinessSummary);
      if (issuePattern.status === "ready" || safe.issuePatternStatus === "ready") badges.push(badge("pilot_issue_pattern_ready", "试点问题趋势正常", "info"));
      if (issuePattern.status === "needs_review" || safe.repeatedIssueRisk === true) badges.push(badge("pilot_issue_pattern_repeated", "发现高频问题", "warning"));
      if (supportReadiness.status === "ready" || safe.supportReadyForPublicPilot === true) badges.push(badge("support_readiness_ready", "支持兜底准备就绪", "info"));
      if (supportReadiness.status === "continue_small_pilot" || safe.supportReadinessStatus === "continue_small_pilot") badges.push(badge("support_readiness_small_pilot", "继续小范围试点", "warning"));
      if (supportReadiness.status === "needs_review" || safe.supportReadinessStatus === "needs_review") badges.push(badge("support_readiness_pause_expansion", "需要暂停扩大测试", "warning"));
      if (beta.status === "blocked" || guided.status === "blocked" || guided.status === "failed_safe") badges.push(badge("beta_acceptance_blocked", "Beta 验收被阻断", "blocked"));
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
