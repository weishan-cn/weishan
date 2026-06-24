;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION = "2.1.81";
  const CONSOLE_NAME = "flight_workflow_support_playbook_console_v1";
  const CAVEAT = "该手册只用于只读试点问题处理，不代表客服工单、交易请求或出票请求。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary); }
  function testerCohort(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary); }
  function pilotInvitation(input) { const safe = obj(input); return first(safe.pilotInvitationViewModelSummary, safe.pilotInvitationSummary); }
  function cohortProgressTracker(input) { const safe = obj(input); return first(safe.cohortProgressSummary, safe.cohortProgressTrackerSummary, safe.publicPilotCohortProgressTrackerSummary); }
  function trialMilestoneBoard(input) { const safe = obj(input); return first(safe.trialMilestoneSummary, safe.trialMilestoneBoardSummary, safe.readOnlyTrialMilestoneBoardSummary); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function issueReview(input) { const safe = obj(input); return first(safe.issueReviewSummary, safe.issueReviewBoard, safe.publicPilotIssueReviewBoard); }
  function triage(input) { const safe = obj(input); return first(safe.supportTriageSummary, safe.supportTriageDashboard); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function supportFallback(input) { const safe = obj(input); return first(safe.supportFallbackSummary, safe.supportFallbackRecommendation); }
  function categoryOf(input) {
    const safe = obj(input);
    const issue = first(safe.issueIntakeSummary, safe.issueIntake, safe.safeIssueIntakeSummary, safe.safeIssueIntake);
    return text(safe.issueCategory || issue.issueCategory || obj(issue.issueSummary).issueCategory || "unknown") || "unknown";
  }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function playbookItem(itemId, issueLabel, actionLabel, escalation, status, reason) {
    return {
      itemId: itemId,
      issueLabel: text(issueLabel),
      actionLabel: text(actionLabel),
      escalation: /^(none|internal_review|blocked)$/.test(escalation) ? escalation : "internal_review",
      status: /^(pass|warning|blocked)$/.test(status) ? status : "pass",
      reason: text(reason || ""),
      redacted: true
    };
  }
  function buildFlightWorkflowSupportPlaybookItems(input) {
    const safe = obj(input);
    const issueCategory = categoryOf(safe);
    const invitationGateSummary = invitationGate(safe);
    const testerCohortSummary = testerCohort(safe);
    const pilotInvitationSummary = pilotInvitation(safe);
    const issuePatternSummary = issuePattern(safe);
    const supportReadinessSummary = supportReadiness(safe);
    const issueReviewSummary = issueReview(safe);
    const triageSummary = triage(safe);
    const supportFallbackSummary = supportFallback(safe);
    const supportStatus = text(supportReadinessSummary.status || "");
    const patternStatus = text(issuePatternSummary.status || "");
    return clone([
      playbookItem("candidate_unclear", "看不懂候选证据", "引导用户查看候选证据摘要和平台最终为准提示", "none", issueCategory === "candidate_unclear" ? "warning" : "pass", "问题只用于改进只读候选证据流程。"),
      playbookItem("platform_mismatch", "平台页面与候选证据不一致", "引导用户记录平台核对结果，并提示平台页面为准", "internal_review", issueCategory === "platform_mismatch" || obj(triageSummary.triage).triageId === "platform_check_review" ? "warning" : "pass", "平台核对结果仅用于本地改进参考。"),
      playbookItem("safety_copy_unclear", "安全说明不清楚", "引导用户查看只读范围、禁止能力和反馈脱敏说明", "internal_review", issueCategory === "safety_copy_unclear" || patternStatus === "needs_review" ? "warning" : "pass", "安全文案只用于只读试点。"),
      playbookItem("consent_blocked", "只读范围确认无法完成", "引导用户重新确认必选项，不允许绕过确认", "internal_review", issueCategory === "consent_blocked" || obj(supportFallbackSummary.recommendation).recommendationId === "retry_consent" ? "warning" : "pass", "只读范围确认不代表交易授权。"),
      playbookItem("feedback_error", "反馈填写异常", "提示反馈只保存脱敏摘要，不要求输入敏感信息", "internal_review", issueCategory === "feedback_error" || issueReviewSummary.status === "needs_review" || supportStatus === "needs_review" ? "warning" : "pass", "反馈内容始终脱敏保存。")
    ]);
  }
  function evaluateFlightWorkflowSupportPlaybookReadiness(input) {
    const safe = obj(input);
    const invitationGateSummary = invitationGate(safe);
    const testerCohortSummary = testerCohort(safe);
    const pilotInvitationSummary = pilotInvitation(safe);
    const playbookItems = buildFlightWorkflowSupportPlaybookItems(safe);
    const cohortProgressSummary = cohortProgressTracker(safe);
    const trialMilestoneSummary = trialMilestoneBoard(safe);
    const issuePatternSummary = issuePattern(safe);
    const supportReadinessSummary = supportReadiness(safe);
    const issueReviewSummary = issueReview(safe);
    const triageSummary = triage(safe);
    const supportFallbackSummary = supportFallback(safe);
    const blockedRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(invitationGateSummary) || hasTradingUrl(testerCohortSummary) || hasTradingUrl(pilotInvitationSummary) || hasTradingUrl(cohortProgressSummary) || hasTradingUrl(trialMilestoneSummary) || hasTradingUrl(issuePatternSummary) || hasTradingUrl(issueReviewSummary) || hasTradingUrl(triageSummary) || hasTradingUrl(supportReadinessSummary) || hasTradingUrl(supportFallbackSummary);
    const blocked = blockedRisk || issuePatternSummary.status === "blocked" || issueReviewSummary.status === "blocked" || triageSummary.status === "blocked" || supportReadinessSummary.status === "blocked" || supportFallbackSummary.status === "blocked";
    const needsReview = !blocked && (issuePatternSummary.status === "needs_review" || supportReadinessSummary.status === "needs_review" || issueReviewSummary.status === "needs_review" || triageSummary.status === "needs_internal_review" || supportFallbackSummary.status === "needs_review");
    const playbookReady = !blocked && !needsReview && playbookItems.length > 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      status: status,
      playbookItems: playbookItems,
      forbiddenSupportActions: ["代用户付款", "代用户下单", "承诺出票", "索要证件或银行卡", "索要登录凭据", "提供真实客服工单编号"],
      supportPlaybookReady: playbookReady,
      issueCategory: categoryOf(safe),
      pilotInvitationGateSummary: clone(invitationGateSummary),
      testerCohortEnrollmentConsoleSummary: clone(testerCohortSummary),
      pilotInvitationViewModelSummary: clone(pilotInvitationSummary),
      cohortProgressSummary: clone(cohortProgressSummary),
      trialMilestoneSummary: clone(trialMilestoneSummary),
      cohortProgressStatus: text(cohortProgressSummary.status || ""),
      trialMilestoneStatus: text(trialMilestoneSummary.status || ""),
      safeToAdvanceNextCohort: trialMilestoneSummary.safeToAdvanceNextCohort === true || cohortProgressSummary.safeToAdvanceNextCohort === true,
      redacted: true
    });
  }
  function rowsFromItems(items) {
    return clone(toArray(items).map(function (item) {
      return { rowId: text(item.itemId || "item"), label: text(item.issueLabel || ""), value: text(item.actionLabel || ""), status: item.status === "blocked" ? "blocked" : (item.status === "warning" ? "warning" : "pass"), redacted: true };
    }));
  }
  function buildFlightWorkflowSupportPlaybookRows(input) { return rowsFromItems(buildFlightWorkflowSupportPlaybookItems(input || {})); }
  function sanitizeFlightWorkflowSupportPlaybookConsole(console) {
    const safe = obj(console);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      playbookName: CONSOLE_NAME,
      appVersion: FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION,
      status: status,
      playbookItems: Array.isArray(safe.playbookItems) ? safe.playbookItems.map(function (item) {
        return playbookItem(item.itemId || "item", item.issueLabel || "", item.actionLabel || "", item.escalation || "internal_review", item.status || "pass", item.reason || "");
      }) : [],
      forbiddenSupportActions: Array.isArray(safe.forbiddenSupportActions) ? safe.forbiddenSupportActions.map(text) : ["代用户付款", "代用户下单", "承诺出票", "索要证件或银行卡", "索要登录凭据", "提供真实客服工单编号"],
      userFacingSummary: Object.assign({ title: "只读试点支持处理手册", resultLabel: status === "ready" ? "支持处理路径已准备" : (status === "needs_review" ? "支持处理仍需复核" : "支持处理已阻断"), caveat: CAVEAT, redacted: true }, safe.userFacingSummary || {}),
      safety: Object.assign(safety(), safe.safety || {}),
      supportPlaybookStatus: text(safe.supportPlaybookStatus || status),
      supportPlaybookNextStep: text(safe.supportPlaybookNextStep || (status === "ready" ? "支持处理路径已准备" : (status === "needs_review" ? "支持处理仍需复核" : "支持处理已阻断"))),
      pilotInvitationGateSummary: clone(safe.pilotInvitationGateSummary || null),
      testerCohortEnrollmentConsoleSummary: clone(safe.testerCohortEnrollmentConsoleSummary || null),
      pilotInvitationViewModelSummary: clone(safe.pilotInvitationViewModelSummary || null),
      cohortProgressSummary: clone(safe.cohortProgressSummary || null),
      trialMilestoneSummary: clone(safe.trialMilestoneSummary || null),
      cohortProgressStatus: text(safe.cohortProgressStatus || ""),
      trialMilestoneStatus: text(safe.trialMilestoneStatus || ""),
      safeToAdvanceNextCohort: safe.safeToAdvanceNextCohort === true || obj(safe.cohortProgressSummary).safeToAdvanceNextCohort === true || obj(safe.trialMilestoneSummary).safeToAdvanceNextCohort === true,
      redacted: true
    });
  }
  function buildFlightWorkflowSupportPlaybookConsole(input) {
    try {
      const evaluation = evaluateFlightWorkflowSupportPlaybookReadiness(input || {});
      const resultLabel = evaluation.status === "ready" ? "支持处理路径已准备" : (evaluation.status === "needs_review" ? "支持处理仍需复核" : "支持处理已阻断");
      return sanitizeFlightWorkflowSupportPlaybookConsole({
        status: evaluation.status,
        playbookItems: evaluation.playbookItems,
        forbiddenSupportActions: evaluation.forbiddenSupportActions,
        userFacingSummary: { title: "只读试点支持处理手册", resultLabel: resultLabel, caveat: CAVEAT, redacted: true },
        safety: safety(),
        supportPlaybookStatus: evaluation.status,
        supportPlaybookNextStep: resultLabel,
        pilotInvitationGateSummary: invitationGate(input || {}),
        testerCohortEnrollmentConsoleSummary: testerCohort(input || {}),
        pilotInvitationViewModelSummary: pilotInvitation(input || {}),
        cohortProgressSummary: cohortProgressTracker(input || {}),
        trialMilestoneSummary: trialMilestoneBoard(input || {}),
        safeToAdvanceNextCohort: evaluation.status === "ready"
      });
    } catch (error) {
      return sanitizeFlightWorkflowSupportPlaybookConsole({ status: "failed_safe", playbookItems: [], forbiddenSupportActions: ["代用户付款", "代用户下单", "承诺出票", "索要证件或银行卡", "索要登录凭据", "提供真实客服工单编号"], userFacingSummary: { title: "只读试点支持处理手册", resultLabel: "支持处理已阻断", caveat: CAVEAT, redacted: true } });
    }
  }
  function buildFlightWorkflowSupportPlaybookConsoleAuditDraft(input) {
    const model = buildFlightWorkflowSupportPlaybookConsole(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_AUDIT_DRAFT",
      playbookName: CONSOLE_NAME,
      appVersion: FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION,
      status: model.status,
      playbookItemCount: model.playbookItems.length,
      forbiddenSupportActions: model.forbiddenSupportActions.slice(),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      rawUserTextStored: false,
      rawResponseStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      autoOpen: false,
      autoRefresh: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowSupportPlaybookConsole = {
    FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildFlightWorkflowSupportPlaybookConsole,
    buildFlightWorkflowSupportPlaybookItems,
    evaluateFlightWorkflowSupportPlaybookReadiness,
    buildFlightWorkflowSupportPlaybookConsoleAuditDraft,
    sanitizeFlightWorkflowSupportPlaybookConsole,
    buildFlightWorkflowSupportPlaybookRows
  };
})();
