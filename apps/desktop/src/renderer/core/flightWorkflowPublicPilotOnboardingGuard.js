;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION = "4.1.0";
  const GUARD_NAME = "flight_workflow_public_pilot_onboarding_guard_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  const TRADING_URL_RE = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"https?:\/\//i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function blockedInput(input) {
    const source = JSON.stringify(input && typeof input === "object" ? input : {});
    return /rawUserTextStored"?\s*:?\s*true/i.test(source) || /secretStored"?\s*:?\s*true/i.test(source) || TRADING_URL_RE.test(source);
  }
  function firstObject(input, names) {
    const safe = input && typeof input === "object" ? input : {};
    for (let i = 0; i < names.length; i += 1) if (safe[names[i]] && typeof safe[names[i]] === "object") return safe[names[i]];
    return {};
  }
  function bool(value) { return value === true; }
  function buildFlightWorkflowPublicPilotOnboardingRequirements(input) {
    const safe = input && typeof input === "object" ? input : {};
    const beta = firstObject(safe, ["betaExpansionGateSummary", "betaExpansionGate", "expansionGateSummary"]);
    const checklist = firstObject(safe, ["publicPilotChecklistSummary", "publicPilotChecklist", "pilotChecklistSummary"]);
    const pilot = firstObject(safe, ["pilotReadinessSummary", "pilotReadinessViewModel"]);
    const release = firstObject(safe, ["releaseReadinessSummary", "releaseReadinessDashboard", "releaseReadiness"]);
    const copy = firstObject(safe, ["userSafetyCopySummary", "safetyCopyRegistry", "forbiddenCapabilitySummary"]);
    const operator = firstObject(safe, ["operatorConsoleSummary", "operatorConsole"]);
    const consent = firstObject(safe, ["readOnlyConsentSummary", "userConsentSummary", "consentFlowSummary"]);
    const blocked = blockedInput(safe) || release.status === "blocked" || release.status === "failed_safe" || operator.status === "blocked";
    return clone({
      betaExpansionApproved: bool(safe.betaExpansionApproved) || beta.status === "approved" || !!(beta.decision && beta.decision.safeToExpandReadOnlyBeta === true),
      publicPilotChecklistReady: bool(safe.publicPilotChecklistReady) || checklist.status === "ready" || !!(checklist.readiness && checklist.readiness.safeForSmallPublicPilot === true),
      releaseReadinessReady: safe.releaseReadinessReady === false ? false : (bool(safe.releaseReadinessReady) || release.status === "ready" || release.releaseReady === true || release.safeForUserFacingBeta === true || pilot.status === "ready"),
      safetyCopyReady: safe.safetyCopyReady === false ? false : (bool(safe.safetyCopyReady) || copy.status === "ready" || copy.status === "pass" || copy.copyValidationStatus === "pass" || release.copyValidationStatus === "pass"),
      forbiddenCapabilitiesVisible: safe.forbiddenCapabilitiesVisible !== false,
      userConsentReady: bool(safe.userConsentReady) || consent.status === "accepted" || consent.allRequiredAccepted === true || !!(consent.consentSummary && consent.consentSummary.allRequiredAccepted === true),
      noBlockedSafetyRisk: safe.noBlockedSafetyRisk === false ? false : !blocked
    });
  }
  function evaluateFlightWorkflowPublicPilotOnboarding(input) {
    const requirements = buildFlightWorkflowPublicPilotOnboardingRequirements(input || {});
    const unmetRequirements = [];
    Object.keys(requirements).forEach(function (name) { if (requirements[name] !== true) unmetRequirements.push(name); });
    const blocked = blockedInput(input || {}) || requirements.noBlockedSafetyRisk !== true;
    let status = "needs_review";
    let decisionId = "blocked";
    let label = "暂不可进入";
    let message = "只读试点进入条件仍需复核。";
    if (blocked) { status = "blocked"; decisionId = "blocked"; label = "暂不可进入只读试点"; message = "存在安全阻断或交易字段风险。"; }
    else if (!requirements.betaExpansionApproved) { status = "needs_internal_testing"; decisionId = "continue_internal_testing"; label = "继续内部测试"; message = "只读 Beta 扩大测试尚未批准。"; }
    else if (!requirements.publicPilotChecklistReady || !requirements.releaseReadinessReady || !requirements.safetyCopyReady || !requirements.forbiddenCapabilitiesVisible) { status = "needs_review"; decisionId = "blocked"; label = "暂不可进入"; message = "公开试点清单、发布就绪或安全文案仍需复核。"; }
    else if (!requirements.userConsentReady) { status = "needs_consent"; decisionId = "require_user_consent"; label = "需要确认只读范围"; message = "进入前需要用户确认只读范围。"; }
    else { status = "allowed"; decisionId = "allow_read_only_pilot_entry"; label = "可以进入只读试点"; message = "只读公开试点进入条件已满足。"; }
    return clone({ status:status, decision:{ decisionId:decisionId, label:label, message:message, canEnterReadOnlyPilot:status === "allowed" }, requirements:requirements, unmetRequirements:unmetRequirements, redacted:true });
  }
  function sanitizeFlightWorkflowPublicPilotOnboardingGuard(guard) {
    const safe = guard && typeof guard === "object" ? guard : {};
    return clone({ guardName:GUARD_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION, status:safeText(safe.status || "failed_safe"), decision:Object.assign({ decisionId:"blocked", label:"暂不可进入", message:"安全降级。", canEnterReadOnlyPilot:false }, safe.decision || {}), requirements:Object.assign({ betaExpansionApproved:false, publicPilotChecklistReady:false, releaseReadinessReady:false, safetyCopyReady:false, forbiddenCapabilitiesVisible:false, userConsentReady:false, noBlockedSafetyRisk:false }, safe.requirements || {}), unmetRequirements:toArray(safe.unmetRequirements).map(safeText), userFacingSummary:Object.assign({ title:"进入只读试点前请确认", resultLabel:"暂不可进入", caveat:"只读试点不提供付款、下单或出票能力。", redacted:true }, safe.userFacingSummary || {}), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowPublicPilotOnboardingGuard(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowPublicPilotOnboardingGuard({ status:"failed_safe", unmetRequirements:["input"] });
      const evaluation = evaluateFlightWorkflowPublicPilotOnboarding(input);
      const resultLabel = evaluation.status === "allowed" ? "可以进入只读试点" : (evaluation.status === "needs_consent" ? "需要确认只读范围" : (evaluation.status === "needs_internal_testing" ? "继续内部测试" : "暂不可进入"));
      return sanitizeFlightWorkflowPublicPilotOnboardingGuard(Object.assign({}, evaluation, { userFacingSummary:{ title:"进入只读试点前请确认", resultLabel:resultLabel, caveat:"只读试点不提供付款、下单或出票能力。", redacted:true } }));
    } catch (error) { return sanitizeFlightWorkflowPublicPilotOnboardingGuard({ status:"failed_safe" }); }
  }
  function buildFlightWorkflowPublicPilotOnboardingGuardAuditDraft(input) {
    const guard = buildFlightWorkflowPublicPilotOnboardingGuard(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_AUDIT_DRAFT", guardName:GUARD_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION, status:guard.status, decisionId:guard.decision.decisionId, canEnterReadOnlyPilot:guard.decision.canEnterReadOnlyPilot === true, unmetRequirements:guard.unmetRequirements, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  window.WeishanFlightWorkflowPublicPilotOnboardingGuard = { FLIGHT_WORKFLOW_PUBLIC_PILOT_ONBOARDING_GUARD_VERSION, GUARD_NAME, buildFlightWorkflowPublicPilotOnboardingGuard, evaluateFlightWorkflowPublicPilotOnboarding, buildFlightWorkflowPublicPilotOnboardingRequirements, buildFlightWorkflowPublicPilotOnboardingGuardAuditDraft, sanitizeFlightWorkflowPublicPilotOnboardingGuard };
})();
