;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_STATE_MACHINE_VERSION = "2.1.80";
  const STATE_MACHINE_NAME = "flight_workflow_state_machine_v1";
  const WORKFLOW_ID = "deterministic-flight-workflow-v2.1.80";
  const STEP_ORDER = ["intent", "clarification", "evidence", "decision", "handoff", "manual_platform_check"];
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /(token|key|secret|password|身份证|护照|银行卡|cardNumber|passport|credential)/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted").replace(/https?:\/\/\S+/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalseStored = /(Stored|Included)$/.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalseStored) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function safety() {
    return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true };
  }

  function normalizeIntent(input) {
    const safe = input && typeof input === "object" ? input : {};
    const intent = safe.intent && typeof safe.intent === "object" ? safe.intent : (safe.flightIntentSummary && typeof safe.flightIntentSummary === "object" ? safe.flightIntentSummary : safe);
    const route = intent.route && typeof intent.route === "object" ? intent.route : {};
    return stripUnsafe({
      status: safeText(intent.status || "idle"),
      intentType: safeText(intent.intentType || "flight"),
      route: { originCity:safeText(route.originCity || intent.origin || ""), destinationCity:safeText(route.destinationCity || intent.destination || "") },
      routeSummary: safeText(intent.routeSummary || ""),
      tripSummary: safeText(intent.tripSummary || intent.userIntentSummary || ""),
      departureDate: safeText(intent.departureDate || ""),
      dateDisplay: safeText(intent.dateDisplay || ""),
      directOnly: intent.directOnly === true,
      sortIntent: safeText(intent.sortIntent || "lowest_price"),
      missingFields: toArray(intent.missingFields).map(safeText),
      clarificationQuestions: toArray(intent.clarificationQuestions).map(safeText),
      safety: Object.assign(safety(), stripUnsafe(intent.safety || {})),
      redacted:true
    });
  }

  function collectedFields(intent) {
    const safe = intent && typeof intent === "object" ? intent : {};
    const route = safe.route && typeof safe.route === "object" ? safe.route : {};
    return { origin:!!route.originCity, destination:!!route.destinationCity, departureDate:!!safe.departureDate, directOnly:typeof safe.directOnly === "boolean", sortIntent:!!safe.sortIntent };
  }

  function missingFieldsFor(intent) {
    const fields = collectedFields(intent || {});
    const missing = [];
    if (!fields.origin) missing.push("origin");
    if (!fields.destination) missing.push("destination");
    if (!fields.departureDate) missing.push("departureDate");
    return missing;
  }

  function questionsFor(missing) {
    return missing.map(function (field) {
      if (field === "origin") return "从哪里出发？";
      if (field === "destination") return "到哪里？";
      if (field === "departureDate") return "哪一天出发？";
      return "请补充机票信息。";
    });
  }

  function statusForIntent(intent) {
    if (intent && intent.status === "blocked") return "blocked";
    const missing = missingFieldsFor(intent || {});
    return missing.length ? "needs_clarification" : "ready_for_evidence";
  }

  function stepState(status, stepId) {
    if (status === "blocked" || status === "failed_safe") return stepId === "intent" ? status : "skipped";
    if (status === "idle") return "pending";
    const index = STEP_ORDER.indexOf(stepId);
    const currentIndex = status === "needs_clarification" ? 1 : status === "ready_for_evidence" || status === "evidence_running" ? 2 : status === "evidence_ready" ? 3 : status === "provider_confirmation_ready" ? 4 : status === "manual_platform_check_ready" ? 5 : 0;
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return status === "evidence_ready" && stepId === "decision" ? "completed" : "pending";
    return "pending";
  }

  function currentStageFor(status, currentStep) {
    if (status === "blocked" || status === "failed_safe") return status;
    if (currentStep === "manual_platform_check") return "platform_check";
    return currentStep || "intent";
  }

  function nextStepLabelFor(status, currentStep) {
    if (status === "needs_clarification") return "补充缺失信息";
    if (status === "ready_for_evidence" || status === "evidence_running") return "生成候选证据";
    if (status === "evidence_ready") return "选择候选";
    if (status === "provider_confirmation_ready") return "确认前往平台";
    if (status === "manual_platform_check_ready") return "记录平台核对结果";
    if (status === "blocked") return "安全阻断";
    if (status === "failed_safe") return "安全降级";
    return currentStep === "handoff" ? "确认前往平台" : "识别机票需求";
  }

  function canResumeWorkflowFor(status) {
    return /^(needs_clarification|ready_for_evidence|evidence_running|evidence_ready|provider_confirmation_ready|manual_platform_check_ready)$/.test(status || "");
  }

  function finalize(input) {
    const safe = input && typeof input === "object" ? input : {};
    const intent = normalizeIntent(safe.intent || {});
    const missing = safe.status === "blocked" ? [] : missingFieldsFor(intent);
    const completedSteps = STEP_ORDER.filter(function (id) { return stepState(safe.status, id) === "completed"; });
    const pendingSteps = STEP_ORDER.filter(function (id) { return stepState(safe.status, id) === "pending"; });
    return sanitizeFlightWorkflowState(Object.assign({}, safe, {
      stateMachineName:STATE_MACHINE_NAME,
      appVersion:FLIGHT_WORKFLOW_STATE_MACHINE_VERSION,
      workflowId:safe.workflowId || WORKFLOW_ID,
      status:safe.status || "idle",
      currentStep:safe.currentStep || (pendingSteps[0] || completedSteps[completedSteps.length - 1] || "intent"),
      completedSteps:completedSteps,
      pendingSteps:pendingSteps,
      intent:intent,
      collectedFields:collectedFields(intent),
      missingFields:missing,
      clarificationQuestions:safe.clarificationQuestions || questionsFor(missing),
      selectedCandidate:stripUnsafe(safe.selectedCandidate || null),
      evidenceSummary:stripUnsafe(safe.evidenceSummary || null),
      workflowWarnings:toArray(safe.workflowWarnings).map(safeText),
      safety:Object.assign(safety(), stripUnsafe(safe.safety || {})),
      redacted:true
    }));
  }

  function createFlightWorkflowState(input) {
    const safe = input && typeof input === "object" ? input : {};
    const intent = normalizeIntent(safe.intent || safe.flightIntentSummary || {});
    const status = safe.status || (intent.status && intent.status !== "idle" ? statusForIntent(intent) : "idle");
    return finalize(Object.assign({}, safe, { status, intent }));
  }

  function mergeIntent(base, patch) {
    const left = normalizeIntent(base || {});
    const right = normalizeIntent(patch || {});
    const route = Object.assign({}, left.route || {});
    if (right.route && right.route.originCity) route.originCity = right.route.originCity;
    if (right.route && right.route.destinationCity) route.destinationCity = right.route.destinationCity;
    const merged = Object.assign({}, left, right, { route, missingFields:[], clarificationQuestions:[] });
    if (!right.departureDate) merged.departureDate = left.departureDate || "";
    if (!right.dateDisplay) merged.dateDisplay = left.dateDisplay || "";
    if (!right.tripSummary) merged.tripSummary = left.tripSummary || "";
    if (!right.routeSummary) merged.routeSummary = route.originCity && route.destinationCity ? route.originCity + " 到 " + route.destinationCity : left.routeSummary || "";
    return normalizeIntent(merged);
  }

  function reduceFlightWorkflowEvent(state, event) {
    try {
      const current = createFlightWorkflowState(state || {});
      const safeEvent = event && typeof event === "object" ? event : {};
      const type = safeText(safeEvent.type || safeEvent.eventType || "");
      if (type === "WORKFLOW_RESET") return createFlightWorkflowState({});
      if (type === "WORKFLOW_FAILED_SAFE") return finalize(Object.assign({}, current, { status:"failed_safe", workflowWarnings:["workflow failed safe"] }));
      if (type === "WORKFLOW_BLOCKED") return finalize(Object.assign({}, current, { status:"blocked", currentStep:"intent", intent:mergeIntent(current.intent, { status:"blocked" }) }));
      if (type === "USER_INPUT_RECEIVED" || type === "INTENT_NORMALIZED") {
        const nextIntent = normalizeIntent(safeEvent.intent || safeEvent.flightIntentSummary || safeEvent.payload || {});
        const nextStatus = statusForIntent(nextIntent);
        return finalize(Object.assign({}, current, { status:nextStatus, currentStep:nextStatus === "needs_clarification" ? "clarification" : "evidence", intent:nextIntent }));
      }
      if (type === "CLARIFICATION_REQUESTED") return finalize(Object.assign({}, current, { status:"needs_clarification", currentStep:"clarification" }));
      if (type === "CLARIFICATION_ANSWERED") {
        const nextIntent = mergeIntent(current.intent, safeEvent.intent || safeEvent.mergedIntent || safeEvent.answer || {});
        const nextStatus = statusForIntent(nextIntent);
        return finalize(Object.assign({}, current, { status:nextStatus, currentStep:nextStatus === "needs_clarification" ? "clarification" : "evidence", intent:nextIntent }));
      }
      if (type === "EVIDENCE_RUN_REQUESTED") return finalize(Object.assign({}, current, { status:missingFieldsFor(current.intent).length ? "needs_clarification" : "evidence_running", currentStep:missingFieldsFor(current.intent).length ? "clarification" : "evidence" }));
      if (type === "EVIDENCE_READY") return finalize(Object.assign({}, current, { status:"evidence_ready", currentStep:"decision", evidenceSummary:stripUnsafe(safeEvent.evidenceSummary || safeEvent.workflowSummary || safeEvent.payload || null), selectedCandidate:stripUnsafe(safeEvent.selectedCandidate || current.selectedCandidate || null) }));
      if (type === "CANDIDATE_SELECTED") return finalize(Object.assign({}, current, { status:"provider_confirmation_ready", currentStep:"handoff", selectedCandidate:stripUnsafe(safeEvent.selectedCandidate || safeEvent.candidate || null) }));
      if (type === "PROVIDER_CONFIRMATION_REQUESTED") return finalize(Object.assign({}, current, { status:"provider_confirmation_ready", currentStep:"handoff" }));
      if (type === "USER_CONFIRMED_PROVIDER_HANDOFF" || type === "PROVIDER_HANDOFF_CONFIRMED") return finalize(Object.assign({}, current, { status:"manual_platform_check_ready", currentStep:"manual_platform_check" }));
      if (type === "MANUAL_PLATFORM_CHECK_RECORDED") return finalize(Object.assign({}, current, { status:"manual_platform_check_ready", currentStep:"manual_platform_check", evidenceSummary:stripUnsafe(safeEvent.evidenceSummary || current.evidenceSummary || null) }));
      return finalize(Object.assign({}, current, { status:"failed_safe", workflowWarnings:["unknown event: " + safeText(type || "unknown")] }));
    } catch (error) {
      return finalize({ status:"failed_safe", workflowWarnings:["state machine error"] });
    }
  }

  function buildFlightWorkflowStateSummary(state) {
    const safe = createFlightWorkflowState(state || {});
    return clone({ stateMachineName:STATE_MACHINE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_MACHINE_VERSION, workflowId:safe.workflowId, status:safe.status, currentStep:safe.currentStep, currentStage:currentStageFor(safe.status, safe.currentStep), nextStepLabel:nextStepLabelFor(safe.status, safe.currentStep), canResumeWorkflow:canResumeWorkflowFor(safe.status), completedSteps:safe.completedSteps, pendingSteps:safe.pendingSteps, collectedFields:safe.collectedFields, missingFields:safe.missingFields, clarificationQuestions:safe.clarificationQuestions, routeSummary:safe.intent && safe.intent.routeSummary || "", tripSummary:safe.intent && safe.intent.tripSummary || "", selectedCandidate:safe.selectedCandidate || null, evidenceSummary:safe.evidenceSummary || null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function buildFlightWorkflowStateMachineAuditDraft(input) {
    const state = input && input.stateMachineName === STATE_MACHINE_NAME ? input : createFlightWorkflowState(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_STATE_MACHINE_AUDIT_DRAFT", stateMachineName:STATE_MACHINE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_MACHINE_VERSION, workflowId:state.workflowId, status:state.status, currentStep:state.currentStep, missingFields:state.missingFields || [], rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }

  function sanitizeFlightWorkflowState(state) {
    const safe = stripUnsafe(state && typeof state === "object" ? state : {}) || {};
    safe.stateMachineName = STATE_MACHINE_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_STATE_MACHINE_VERSION;
    safe.workflowId = safe.workflowId || WORKFLOW_ID;
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.rawResponseStored = false;
    safe.secretStored = false;
    safe.redacted = true;
    return clone(safe);
  }

  window.WeishanFlightWorkflowStateMachine = { FLIGHT_WORKFLOW_STATE_MACHINE_VERSION, STATE_MACHINE_NAME, WORKFLOW_ID, createFlightWorkflowState, reduceFlightWorkflowEvent, buildFlightWorkflowStateSummary, buildFlightWorkflowStateMachineAuditDraft, sanitizeFlightWorkflowState };
})();
