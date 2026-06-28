;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION = "2.1.88";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_invitation_view_model_v1";
  const CAVEAT = "该视图模型只用于只读试点邀请与测试批次登记，不代表真实身份、联系方式、证件、支付或外部平台链接。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function invitationGateApi() { return window.WeishanFlightWorkflowReadOnlyPilotInvitationGate || {}; }
  function cohortApi() { return window.WeishanFlightWorkflowTesterCohortEnrollmentConsole || {}; }
  function snapshotApi() { return window.WeishanFlightWorkflowPublicPilotReadinessSnapshot || {}; }
  function playbookApi() { return window.WeishanFlightWorkflowSupportPlaybookConsole || {}; }
  function consentApi() { return window.WeishanFlightWorkflowReadOnlyUserConsentFlow || {}; }

  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary, typeof invitationGateApi().buildFlightWorkflowReadOnlyPilotInvitationGate === "function" ? invitationGateApi().buildFlightWorkflowReadOnlyPilotInvitationGate(safe) : null); }
  function cohortConsole(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary, typeof cohortApi().buildFlightWorkflowTesterCohortEnrollmentConsole === "function" ? cohortApi().buildFlightWorkflowTesterCohortEnrollmentConsole(safe) : null); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary, typeof snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot(safe) : null); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary, typeof playbookApi().buildFlightWorkflowSupportPlaybookConsole === "function" ? playbookApi().buildFlightWorkflowSupportPlaybookConsole(safe) : null); }
  function consent(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary, typeof consentApi().buildFlightWorkflowReadOnlyUserConsentFlow === "function" ? consentApi().buildFlightWorkflowReadOnlyUserConsentFlow(safe) : null); }

  function statusOf(gateSummary, cohortSummary, snapshotSummary, playbookSummary, consentSummary) {
    const gateStatus = text(obj(gateSummary).status || "failed_safe");
    const cohortStatus = text(obj(cohortSummary).status || "needs_more_testers");
    const snapshotStatus = text(obj(snapshotSummary).status || "failed_safe");
    const playbookStatus = text(obj(playbookSummary).status || "ready");
    const consentStatus = text(obj(consentSummary).status || "not_started");
    if (gateStatus === "blocked" || cohortStatus === "blocked" || snapshotStatus === "blocked" || playbookStatus === "blocked" || consentStatus === "blocked") return "blocked";
    if (gateStatus === "needs_consent" || consentStatus === "missing_required_items" || consentStatus === "not_started") return "needs_consent";
    if (gateStatus === "needs_support_review" || cohortStatus === "needs_review" || playbookStatus === "needs_review") return "needs_review";
    if (cohortStatus === "needs_more_testers" || gateStatus === "waitlist") return "needs_more_testers";
    return "ready";
  }

  function card(cardId, label, value) { return { cardId: cardId, label: text(label), value: text(value), redacted: true }; }
  function safeRows(items) { return clone(toArray(items).map(function (row) { return { rowId: text(row.rowId || "row"), label: text(row.label || ""), value: text(row.value || row.result || ""), status: text(row.status || ""), redacted: true }; })); }

  function buildFlightWorkflowPilotInvitationCards(input) {
    const gateSummary = invitationGate(input || {});
    const cohortSummary = cohortConsole(input || {});
    const snapshotSummary = snapshot(input || {});
    const playbookSummary = playbook(input || {});
    const consentSummary = consent(input || {});
    const status = statusOf(gateSummary, cohortSummary, snapshotSummary, playbookSummary, consentSummary);
    const cohort = obj(cohortSummary.cohort);
    return clone([
      card("invitation", "试点邀请", obj(gateSummary.userFacingSummary).resultLabel || status),
      card("cohort", "测试批次", cohort.totalCount ? "已登记 " + String(cohort.totalCount) + " 位测试用户" : obj(cohortSummary.userFacingSummary).resultLabel || "仍需更多测试用户"),
      card("consent", "只读确认", obj(consentSummary.userFacingSummary).resultLabel || consentSummary.status || "仍有必选项未确认"),
      card("issues", "问题与安全", obj(playbookSummary.userFacingSummary).resultLabel || obj(snapshotSummary.userFacingSummary).resultLabel || "需要复核")
    ]);
  }

  function buildRiskRows(input) {
    const gateSummary = invitationGate(input || {});
    const cohortSummary = cohortConsole(input || {});
    const snapshotSummary = snapshot(input || {});
    const playbookSummary = playbook(input || {});
    const consentSummary = consent(input || {});
    return clone([
      { rowId:"invitation_gate", label:"邀请闸门", value:obj(gateSummary.userFacingSummary).resultLabel || gateSummary.status || "待邀请", status:text(gateSummary.status || "waitlist"), redacted:true },
      { rowId:"tester_cohort", label:"测试批次", value:obj(cohortSummary.userFacingSummary).resultLabel || cohortSummary.status || "仍需更多测试用户", status:text(cohortSummary.status || "needs_more_testers"), redacted:true },
      { rowId:"consent", label:"只读确认", value:obj(consentSummary.userFacingSummary).resultLabel || consentSummary.status || "仍有必选项未确认", status:text(consentSummary.status || "not_started"), redacted:true },
      { rowId:"issue_review", label:"问题与支持", value:obj(playbookSummary.userFacingSummary).resultLabel || obj(snapshotSummary.userFacingSummary).resultLabel || "需要复核", status:text(playbookSummary.status || "ready"), redacted:true }
    ]);
  }

  function sanitizeFlightWorkflowPilotInvitationViewModel(vm) {
    const safe = obj(vm);
    const status = /^(ready|needs_more_testers|needs_review|needs_consent|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      viewModelName: VIEW_MODEL_NAME,
      appVersion: FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION,
      status: status,
      title: "只读试点邀请与测试批次",
      cards: Array.isArray(safe.cards) ? safe.cards.map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }) : [],
      cohortRows: toArray(safe.cohortRows),
      riskRows: toArray(safe.riskRows),
      caveat: text(safe.caveat || CAVEAT),
      redacted: true,
      invitationGateName: text(safe.invitationGateName || "flight_workflow_read_only_pilot_invitation_gate_v1"),
      cohortConsoleName: text(safe.cohortConsoleName || "flight_workflow_tester_cohort_enrollment_console_v1")
    });
  }

  function buildFlightWorkflowPilotInvitationViewModel(input) {
    try {
      const gateSummary = invitationGate(input || {});
      const cohortSummary = cohortConsole(input || {});
      const snapshotSummary = snapshot(input || {});
      const playbookSummary = playbook(input || {});
      const consentSummary = consent(input || {});
      const status = statusOf(gateSummary, cohortSummary, snapshotSummary, playbookSummary, consentSummary);
      return sanitizeFlightWorkflowPilotInvitationViewModel({
        viewModelName: VIEW_MODEL_NAME,
        appVersion: FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION,
        status: status,
        title: "只读试点邀请与测试批次",
        cards: buildFlightWorkflowPilotInvitationCards(input || {}),
        cohortRows: safeRows(cohortSummary.rows),
        riskRows: buildRiskRows(input || {}),
        caveat: CAVEAT,
        invitationGateName: obj(gateSummary).gateName || "flight_workflow_read_only_pilot_invitation_gate_v1",
        cohortConsoleName: obj(cohortSummary).consoleName || "flight_workflow_tester_cohort_enrollment_console_v1",
        redacted: true
      });
    } catch (error) {
      return sanitizeFlightWorkflowPilotInvitationViewModel({ viewModelName: VIEW_MODEL_NAME, appVersion: FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION, status: "failed_safe", title: "只读试点邀请与测试批次", cards: [], cohortRows: [], riskRows: [], caveat: CAVEAT, redacted: true });
    }
  }

  function buildFlightWorkflowPilotInvitationViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowPilotInvitationViewModel(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName: VIEW_MODEL_NAME,
      appVersion: FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION,
      status: vm.status,
      cardCount: vm.cards.length,
      cohortRowCount: vm.cohortRows.length,
      riskRowCount: vm.riskRows.length,
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

  window.WeishanFlightWorkflowPilotInvitationViewModel = {
    FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowPilotInvitationViewModel,
    buildFlightWorkflowPilotInvitationCards,
    buildFlightWorkflowPilotInvitationViewModelAuditDraft,
    sanitizeFlightWorkflowPilotInvitationViewModel
  };
})();
