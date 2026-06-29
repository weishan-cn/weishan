;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION = "2.2.8";
  const CONSOLE_NAME = "flight_workflow_tester_cohort_enrollment_console_v1";
  const CAVEAT = "该控制台只用于只读试点测试用户批次登记，不保存真实身份、联系方式、证件、支付或外部平台链接。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, realIdentityStored:false, invitationUrl:null, autoOpen:false, autoRefresh:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function hasTradingUrl(value) {
    const safe = obj(value);
    return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl)));
  }
  function first() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = obj(arguments[index]);
      if (Object.keys(value).length) return value;
    }
    return {};
  }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary, safe.invitationGate); }
  function consentFlow(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary); }
  function issueReview(input) { const safe = obj(input); return first(safe.issueReviewSummary, safe.issueReviewBoard, safe.publicPilotIssueReviewBoard); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function pilotSnapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary); }
  function operator(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsoleViewModel); }

  function buildRowFromInput(item, index) {
    const safe = obj(item);
    return {
      rowId: text(safe.rowId || safe.testerSlotId || safe.slotId || "tester_" + String(index + 1)),
      testerSlotId: text(safe.testerSlotId || safe.slotId || safe.rowId || "tester-slot-" + String(index + 1)),
      label: text(safe.label || safe.testerLabel || safe.slotLabel || "测试用户 " + String(index + 1)),
      invitationStatus: text(safe.invitationStatus || "invited"),
      consentStatus: text(safe.consentStatus || "pending"),
      feedbackStatus: text(safe.feedbackStatus || "pending"),
      issueStatus: text(safe.issueStatus || "none"),
      status: text(safe.status || "ready"),
      redacted: true
    };
  }

  function buildRows(input) {
    const safe = obj(input);
    const rows = toArray(safe.rows).map(buildRowFromInput);
    if (rows.length) return rows;
    const gate = invitationGate(safe);
    const slot = obj(gate.testerSlot || {});
    const invitationStatus = gate.status === "eligible" ? "invited" : (gate.status === "needs_consent" ? "waiting_consent" : gate.status === "needs_support_review" ? "waiting_review" : gate.status === "blocked" ? "blocked" : "waitlist");
    const consent = consentFlow(safe);
    const issue = issueReview(safe);
    const play = playbook(safe);
    const snapshot = pilotSnapshot(safe);
    return [{
      rowId: "tester_slot_001",
      testerSlotId: text(slot.slotId || "tester-slot-001"),
      label: "默认测试用户批次",
      invitationStatus: invitationStatus,
      consentStatus: text(consent.status || "pending"),
      feedbackStatus: text(play.status === "ready" ? "ready" : "pending"),
      issueStatus: text(issue.status || "none"),
      status: snapshot.status === "blocked" || issue.status === "blocked" ? "blocked" : (gate.status === "eligible" ? "ready" : "review"),
      redacted: true
    }];
  }

  function buildCounts(rows) {
    const list = toArray(rows);
    return {
      totalCount: list.length,
      invitedCount: list.filter(function (row) { return row.invitationStatus === "invited" || row.invitationStatus === "eligible"; }).length,
      consentedCount: list.filter(function (row) { return row.consentStatus === "accepted" || row.consentStatus === "confirmed"; }).length,
      feedbackReadyCount: list.filter(function (row) { return row.feedbackStatus === "ready"; }).length,
      blockedCount: list.filter(function (row) { return row.status === "blocked"; }).length
    };
  }

  function evaluateFlightWorkflowTesterCohortEnrollmentConsole(input) {
    const safe = obj(input);
    const gate = invitationGate(safe);
    const snapshot = pilotSnapshot(safe);
    const play = playbook(safe);
    const issue = issueReview(safe);
    const pattern = issuePattern(safe);
    const readiness = supportReadiness(safe);
    const operatorSummary = operator(safe);
    const rows = buildRows(safe);
    const counts = buildCounts(rows);
    const blockedRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(gate) || hasTradingUrl(snapshot) || hasTradingUrl(play) || hasTradingUrl(issue) || hasTradingUrl(pattern) || hasTradingUrl(readiness) || hasTradingUrl(operatorSummary);
    let status = "needs_more_testers";
    if (blockedRisk || gate.status === "blocked" || snapshot.status === "blocked" || play.status === "blocked" || issue.status === "blocked" || readiness.status === "blocked" || pattern.status === "blocked" || operatorSummary.status === "blocked") {
      status = "blocked";
    } else if (counts.totalCount >= 3 && counts.invitedCount >= 2 && counts.consentedCount >= 2 && counts.blockedCount === 0 && gate.status === "eligible") {
      status = "ready";
    } else if (gate.status === "needs_support_review" || issue.status === "needs_review" || readiness.status === "needs_review" || operatorSummary.status === "warning") {
      status = "needs_review";
    } else if (counts.totalCount === 0 || counts.invitedCount < 2) {
      status = "needs_more_testers";
    }
    const cohort = {
      cohortId: text(safe.cohortId || safe.testerCohortId || "tester-cohort-001"),
      totalCount: counts.totalCount,
      invitedCount: counts.invitedCount,
      consentedCount: counts.consentedCount,
      feedbackReadyCount: counts.feedbackReadyCount,
      blockedCount: counts.blockedCount,
      realIdentityStored: false,
      redacted: true
    };
    return clone({
      status: status,
      cohort: cohort,
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      rows: rows,
      userFacingSummary: {
        title: "测试用户批次登记控制台",
        resultLabel: status === "ready" ? "测试用户批次可用" : (status === "needs_more_testers" ? "仍需更多测试用户" : status === "needs_review" ? "需要复核后登记" : status === "blocked" ? "测试批次已阻断" : "仍需更多测试用户"),
        caveat: CAVEAT,
        redacted: true
      },
      safety: safety(),
      redacted: true
    });
  }

  function sanitizeFlightWorkflowTesterCohortEnrollmentConsole(console) {
    const safe = obj(console);
    const status = /^(ready|needs_more_testers|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      consoleName: CONSOLE_NAME,
      appVersion: FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION,
      status: status,
      cohort: Object.assign({ cohortId:"tester-cohort-001", totalCount:0, invitedCount:0, consentedCount:0, feedbackReadyCount:0, blockedCount:0, realIdentityStored:false, redacted:true }, safe.cohort || {}),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      rows: toArray(safe.rows).map(function (item) {
        return buildRowFromInput(item, 0);
      }),
      userFacingSummary: Object.assign({ title:"测试用户批次登记控制台", resultLabel:status === "ready" ? "测试用户批次可用" : (status === "needs_more_testers" ? "仍需更多测试用户" : status === "needs_review" ? "需要复核后登记" : status === "blocked" ? "测试批次已阻断" : "仍需更多测试用户"), caveat:CAVEAT, redacted:true }, safe.userFacingSummary || {}),
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
      autoOpen:false,
      autoRefresh:false,
      invitationGateSummary: clone(safe.invitationGateSummary || null),
      pilotInvitationViewModelSummary: clone(safe.pilotInvitationViewModelSummary || null),
      redacted: true
    });
  }

  function buildFlightWorkflowTesterCohortEnrollmentConsole(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowTesterCohortEnrollmentConsole({ status:"failed_safe", rows:[] });
      const evaluation = evaluateFlightWorkflowTesterCohortEnrollmentConsole(input || {});
      return sanitizeFlightWorkflowTesterCohortEnrollmentConsole(evaluation);
    } catch (error) {
      return sanitizeFlightWorkflowTesterCohortEnrollmentConsole({ status:"failed_safe", rows:[] });
    }
  }

  function buildFlightWorkflowTesterCohortEnrollmentConsoleAuditDraft(input) {
    const console = buildFlightWorkflowTesterCohortEnrollmentConsole(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_AUDIT_DRAFT",
      consoleName: CONSOLE_NAME,
      appVersion: FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION,
      status: console.status,
      cohortId: obj(console.cohort).cohortId || "",
      totalCount: obj(console.cohort).totalCount || 0,
      invitedCount: obj(console.cohort).invitedCount || 0,
      consentedCount: obj(console.cohort).consentedCount || 0,
      blockedCount: obj(console.cohort).blockedCount || 0,
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

  window.WeishanFlightWorkflowTesterCohortEnrollmentConsole = {
    FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildFlightWorkflowTesterCohortEnrollmentConsole,
    evaluateFlightWorkflowTesterCohortEnrollmentConsole,
    buildRows: buildRows,
    buildFlightWorkflowTesterCohortEnrollmentConsoleAuditDraft,
    sanitizeFlightWorkflowTesterCohortEnrollmentConsole
  };
})();
