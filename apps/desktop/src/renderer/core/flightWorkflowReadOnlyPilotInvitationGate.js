;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION = "4.0.0";
  const GATE_NAME = "flight_workflow_read_only_pilot_invitation_gate_v1";
  const CAVEAT = "该判断只用于只读试点邀请与测试批次登记，不代表真实身份、联系方式、证件、支付或外部平台链接。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, realIdentityStored:false, invitationUrl:null, autoOpen:false, autoRefresh:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }

  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }

  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary); }
  function onboarding(input) { const safe = obj(input); return first(safe.pilotOnboardingSummary, safe.pilotOnboardingGuard, safe.pilotOnboardingViewModel); }
  function consent(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary); }
  function issueReview(input) { const safe = obj(input); return first(safe.issueReviewSummary, safe.issueReviewBoard, safe.publicPilotIssueReviewBoard); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function operator(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsoleViewModel); }

  function testerSlot(input) {
    const safe = obj(input);
    const slot = obj(safe.testerSlot);
    return {
      slotId: text(slot.slotId || safe.testerSlotId || safe.slotId || "tester-slot-001"),
      slotType: text(slot.slotType || safe.slotType || "invited_tester"),
      realIdentityStored: false,
      redacted: true
    };
  }

  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }

  function safetySummary(input) {
    const safe = obj(input);
    return safe.safety && typeof safe.safety === "object" ? safe.safety : {};
  }

  function buildRequirements(input) {
    const safe = obj(input);
    const s = snapshot(safe);
    const p = playbook(safe);
    const o = onboarding(safe);
    const c = consent(safe);
    const r = issueReview(safe);
    const g = supportReadiness(safe);
    const i = issuePattern(safe);
    const op = operator(safe);
    const sensitiveRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || obj(safetySummary(safe)).rawUserTextStored === true || obj(safetySummary(safe)).rawResponseStored === true || obj(safetySummary(safe)).secretStored === true;
    const tradingRisk = hasTradingUrl(safe) || hasTradingUrl(s) || hasTradingUrl(p) || hasTradingUrl(o) || hasTradingUrl(c) || hasTradingUrl(r) || hasTradingUrl(g) || hasTradingUrl(i) || hasTradingUrl(op);
    return {
      pilotSnapshotReady: s.status === "ready" || s.status === "continue_small_pilot",
      supportPlaybookReady: p.status === "ready",
      onboardingConsentReady: c.status === "accepted" || c.consentSummary && c.consentSummary.allRequiredAccepted === true,
      noOpenBlockingIssue: r.status !== "blocked" && g.status !== "blocked" && i.status !== "blocked" && op.status !== "blocked",
      noSensitiveDataRisk: !sensitiveRisk && !tradingRisk,
      safeToInviteTesterSlot: false
    };
  }

  function evaluateFlightWorkflowReadOnlyPilotInvitationGate(input) {
    const safe = obj(input);
    const slot = testerSlot(safe);
    const snapshotSummary = snapshot(safe);
    const playbookSummary = playbook(safe);
    const onboardingSummary = onboarding(safe);
    const consentSummary = consent(safe);
    const issueReviewSummary = issueReview(safe);
    const supportReadinessSummary = supportReadiness(safe);
    const issuePatternSummary = issuePattern(safe);
    const operatorSummary = operator(safe);
    const requirements = buildRequirements(safe);
    const eligibility = Object.assign({}, requirements, {
      pilotSnapshotReady: requirements.pilotSnapshotReady === true,
      supportPlaybookReady: requirements.supportPlaybookReady === true,
      onboardingConsentReady: requirements.onboardingConsentReady === true,
      noOpenBlockingIssue: requirements.noOpenBlockingIssue === true,
      noSensitiveDataRisk: requirements.noSensitiveDataRisk === true
    });
    eligibility.safeToInviteTesterSlot = Boolean(
      eligibility.pilotSnapshotReady &&
      eligibility.supportPlaybookReady &&
      eligibility.onboardingConsentReady &&
      eligibility.noOpenBlockingIssue &&
      eligibility.noSensitiveDataRisk &&
      slot.realIdentityStored === false
    );
    const blocked = hasTradingUrl(safe) || hasTradingUrl(snapshotSummary) || hasTradingUrl(playbookSummary) || hasTradingUrl(onboardingSummary) || hasTradingUrl(consentSummary) || hasTradingUrl(issueReviewSummary) || hasTradingUrl(supportReadinessSummary) || hasTradingUrl(issuePatternSummary) || hasTradingUrl(operatorSummary) || safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true;
    let status = "waitlist";
    let decisionId = "waitlist";
    let label = "待邀请";
    let message = "当前只读试点邀请条件仍需复核。";
    if (blocked) {
      status = "blocked";
      decisionId = "blocked";
      label = "暂不可邀请测试用户";
      message = "存在敏感输入或交易字段风险，已阻断邀请。";
    } else if (eligibility.safeToInviteTesterSlot) {
      status = "eligible";
      decisionId = "allow_tester_invitation";
      label = "可以邀请测试用户";
      message = "只读试点邀请与测试批次登记条件已满足。";
    } else if (eligibility.onboardingConsentReady !== true) {
      status = "needs_consent";
      decisionId = "require_read_only_consent";
      label = "需要确认只读范围";
      message = "邀请前需要完成只读范围确认。";
    } else if (eligibility.supportPlaybookReady !== true || eligibility.noOpenBlockingIssue !== true) {
      status = "needs_support_review";
      decisionId = "require_support_review";
      label = "需要支持复核";
      message = "支持处理手册或问题复核仍需确认。";
    } else if (eligibility.pilotSnapshotReady !== true || eligibility.noSensitiveDataRisk !== true) {
      status = "waitlist";
      decisionId = "waitlist";
      label = "进入等待名单";
      message = "试点状态或安全条件还未完全就绪。";
    }
    return clone({
      status: status,
      decision: {
        decisionId: decisionId,
        label: label,
        message: message,
        testerSlotEligible: status === "eligible"
      },
      testerSlot: slot,
      eligibility: eligibility,
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      requirements: [
        { requirementId:"pilot_snapshot_ready", label:"试点状态快照就绪", satisfied:eligibility.pilotSnapshotReady === true, redacted:true },
        { requirementId:"support_playbook_ready", label:"支持处理手册就绪", satisfied:eligibility.supportPlaybookReady === true, redacted:true },
        { requirementId:"onboarding_consent_ready", label:"只读范围确认完成", satisfied:eligibility.onboardingConsentReady === true, redacted:true },
        { requirementId:"no_open_blocking_issue", label:"无未解决阻断问题", satisfied:eligibility.noOpenBlockingIssue === true, redacted:true },
        { requirementId:"no_sensitive_data_risk", label:"无敏感数据风险", satisfied:eligibility.noSensitiveDataRisk === true, redacted:true }
      ],
      userFacingSummary: {
        title: "只读试点邀请闸门",
        resultLabel: label,
        caveat: CAVEAT,
        redacted: true
      },
      safety: safety(),
      redacted: true
    });
  }

  function sanitizeFlightWorkflowReadOnlyPilotInvitationGate(gate) {
    const safe = obj(gate);
    const status = /^(eligible|needs_consent|needs_support_review|waitlist|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const label = obj(safe.decision).label || (status === "eligible" ? "可以邀请测试用户" : status === "needs_consent" ? "需要确认只读范围" : status === "needs_support_review" ? "需要支持复核" : status === "blocked" ? "暂不可邀请测试用户" : "进入等待名单");
    return clone({
      gateName: GATE_NAME,
      appVersion: FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION,
      status: status,
      decision: Object.assign({ decisionId:"blocked", label:label, message:"安全降级。", testerSlotEligible:false }, safe.decision || {}),
      testerSlot: Object.assign({ slotId:"tester-slot-001", slotType:"invited_tester", realIdentityStored:false, redacted:true }, safe.testerSlot || {}),
      eligibility: Object.assign({ pilotSnapshotReady:false, supportPlaybookReady:false, onboardingConsentReady:false, noOpenBlockingIssue:false, noSensitiveDataRisk:false, safeToInviteTesterSlot:false }, safe.eligibility || {}),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      requirements: toArray(safe.requirements).map(function (item) {
        return {
          requirementId: text(item.requirementId || ""),
          label: text(item.label || ""),
          satisfied: item.satisfied === true,
          redacted: true
        };
      }),
      userFacingSummary: Object.assign({ title:"只读试点邀请闸门", resultLabel:label, caveat:CAVEAT, redacted:true }, safe.userFacingSummary || {}),
      safety: Object.assign(safety(), safe.safety || {}),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      invitationUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    });
  }

  function buildFlightWorkflowReadOnlyPilotInvitationGate(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowReadOnlyPilotInvitationGate({ status:"failed_safe" });
      const evaluation = evaluateFlightWorkflowReadOnlyPilotInvitationGate(input || {});
      return sanitizeFlightWorkflowReadOnlyPilotInvitationGate(evaluation);
    } catch (error) {
      return sanitizeFlightWorkflowReadOnlyPilotInvitationGate({ status:"failed_safe" });
    }
  }

  function buildFlightWorkflowReadOnlyPilotInvitationGateAuditDraft(input) {
    const gate = buildFlightWorkflowReadOnlyPilotInvitationGate(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_AUDIT_DRAFT",
      gateName: GATE_NAME,
      appVersion: FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION,
      status: gate.status,
      decisionId: obj(gate.decision).decisionId || "blocked",
      testerSlotId: obj(gate.testerSlot).slotId || "",
      eligibility: gate.eligibility,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      invitationUrl: null,
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

  window.WeishanFlightWorkflowReadOnlyPilotInvitationGate = {
    FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION,
    GATE_NAME,
    buildFlightWorkflowReadOnlyPilotInvitationGate,
    evaluateFlightWorkflowReadOnlyPilotInvitationGate,
    buildFlightWorkflowReadOnlyPilotInvitationGateAuditDraft,
    sanitizeFlightWorkflowReadOnlyPilotInvitationGate
  };
})();
