;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION = "2.1.90";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_onboarding_view_model_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function guardOf(input) { const safe = input && typeof input === "object" ? input : {}; if (safe.pilotOnboardingSummary) return safe.pilotOnboardingSummary; if (safe.onboardingGuardSummary) return safe.onboardingGuardSummary; const api = window.WeishanFlightWorkflowPublicPilotOnboardingGuard || {}; return typeof api.buildFlightWorkflowPublicPilotOnboardingGuard === "function" ? api.buildFlightWorkflowPublicPilotOnboardingGuard(safe) : { status:"needs_internal_testing", decision:{ label:"继续内部测试", canEnterReadOnlyPilot:false }, requirements:{}, unmetRequirements:[], userFacingSummary:{ resultLabel:"继续内部测试" }, redacted:true }; }
  function consentOf(input) { const safe = input && typeof input === "object" ? input : {}; if (safe.readOnlyConsentSummary) return safe.readOnlyConsentSummary; if (safe.consentFlowSummary) return safe.consentFlowSummary; const api = window.WeishanFlightWorkflowReadOnlyUserConsentFlow || {}; return typeof api.buildFlightWorkflowReadOnlyUserConsentFlow === "function" ? api.buildFlightWorkflowReadOnlyUserConsentFlow(safe.userConsentInput || safe) : { status:"not_started", consentItems:[], consentSummary:{ requiredCount:5, acceptedCount:0, allRequiredAccepted:false, redacted:true }, userFacingSummary:{ resultLabel:"仍有必选项未确认" }, redacted:true }; }
  function card(cardId, label, value) { return { cardId:cardId, label:safeText(label), value:safeText(value), redacted:true }; }
  function buildFlightWorkflowPilotOnboardingCards(input) {
    const guard = guardOf(input || {});
    const consent = consentOf(input || {});
    const canEnter = guard.decision && guard.decision.canEnterReadOnlyPilot === true;
    return clone([
      card("entry", "进入状态", guard.userFacingSummary && guard.userFacingSummary.resultLabel || guard.decision && guard.decision.label || "暂不可进入"),
      card("consent", "用户确认", consent.userFacingSummary && consent.userFacingSummary.resultLabel || "仍有必选项未确认"),
      card("safety", "安全边界", "只读试点不代表交易授权"),
      card("next_step", "下一步", canEnter ? "可以进入只读试点" : (consent.status === "accepted" ? "等待试点准备完成" : "确认只读范围"))
    ]);
  }
  function buildFlightWorkflowPilotConsentRows(input) {
    const consent = consentOf(input || {});
    return clone(toArray(consent.consentItems).map(function (item) { return { rowId:safeText(item.itemId || ""), label:safeText(item.label || ""), value:item.accepted === true ? "已确认只读范围" : "仍有必选项未确认", status:item.accepted === true ? "accepted" : "missing_required_items", redacted:true }; }));
  }
  function buildFlightWorkflowPilotOnboardingRiskRows(input) {
    const guard = guardOf(input || {});
    const consent = consentOf(input || {});
    const risks = toArray(guard.unmetRequirements).map(function (name) { return "未满足项: " + name; });
    if (consent.status !== "accepted") risks.push("只读试点不代表交易授权");
    if (!risks.length) risks.push("只读试点不提供付款、下单或出票能力。");
    return clone(risks.map(function (value, index) { return { rowId:"risk_" + index, label:index === 0 ? "风险说明" : "未满足项", value:safeText(value), status:guard.status === "allowed" && consent.status === "accepted" ? "checked" : "needs_review", redacted:true }; }));
  }
  function buildFlightWorkflowPilotOnboardingViewModel(input) {
    const guard = guardOf(input || {});
    const consent = consentOf(input || {});
    const status = guard.status === "allowed" && consent.status === "accepted" ? "allowed" : (guard.status === "blocked" || consent.status === "blocked" ? "blocked" : (consent.status === "accepted" ? guard.status : "needs_consent"));
    return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION, status:status, title:"只读试点进入确认", cards:buildFlightWorkflowPilotOnboardingCards({ pilotOnboardingSummary:guard, readOnlyConsentSummary:consent }), consentRows:buildFlightWorkflowPilotConsentRows({ readOnlyConsentSummary:consent }), riskRows:buildFlightWorkflowPilotOnboardingRiskRows({ pilotOnboardingSummary:guard, readOnlyConsentSummary:consent }), caveat:"只读试点不代表真实票价、库存或可出票，也不提供付款、下单或出票能力。", safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowPilotOnboardingViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowPilotOnboardingViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, consentRowCount:vm.consentRows.length, riskRowCount:vm.riskRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  window.WeishanFlightWorkflowPilotOnboardingViewModel = { FLIGHT_WORKFLOW_PILOT_ONBOARDING_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowPilotOnboardingViewModel, buildFlightWorkflowPilotOnboardingCards, buildFlightWorkflowPilotConsentRows, buildFlightWorkflowPilotOnboardingRiskRows, buildFlightWorkflowPilotOnboardingViewModelAuditDraft };
})();
