;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION = "3.8.0";
  const TEST_MODE_NAME = "flight_workflow_guided_user_test_mode_v1";
  const TEST_ID = "deterministic-flight-guided-user-test-v2.4.1";
  const STEP_DEFS = [
    ["enter_flight_request", "输入机票需求"],
    ["review_results", "查看候选证据"],
    ["confirm_safety_notice", "确认安全提示"],
    ["review_handoff_packet", "查看最终安全交接包"],
    ["confirm_no_transaction", "确认不会付款、下单或出票"],
    ["submit_feedback", "填写测试反馈"]
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function sanitizerApi() { return window.WeishanFlightWorkflowBetaFeedbackSanitizer || {}; }
  function step(stepId, label, status) { return { stepId:stepId, label:label, status:status || "not_started", redacted:true }; }
  function defaultSteps(status) { return STEP_DEFS.map(function (def, index) { return step(def[0], def[1], status === "completed" ? "completed" : (index === 0 && status === "in_progress" ? "in_progress" : "not_started")); }); }
  function normalizeStatus(value) { const safe = text(value); return /^(not_started|in_progress|completed|blocked|failed_safe)$/.test(safe) ? safe : "not_started"; }
  function sanitizeFeedback(input) {
    const api = sanitizerApi();
    if (typeof api.sanitizeFlightWorkflowBetaFeedback === "function") return api.sanitizeFlightWorkflowBetaFeedback(input || {}).redactedFeedback;
    return { usabilityRating:null, clarityRating:null, safetyCopyUnderstood:null, redactedUserComment:null };
  }
  function summarizeSteps(steps) {
    const first = steps.find(function (item) { return item.status !== "completed"; });
    return first ? first.label : "";
  }
  function resultLabel(status) {
    if (status === "completed") return "测试已完成";
    if (status === "blocked" || status === "failed_safe") return "测试已阻断";
    if (status === "in_progress") return "测试进行中";
    return "测试未开始";
  }
  function sanitizeFlightWorkflowGuidedUserTestState(testState) {
    const safe = testState && typeof testState === "object" ? testState : {};
    const status = normalizeStatus(safe.status);
    const steps = (Array.isArray(safe.steps) && safe.steps.length ? safe.steps : defaultSteps(status)).map(function (item, index) {
      const def = STEP_DEFS[index] || [text(item.stepId || "step_" + index), text(item.label || "测试步骤")];
      return step(text(item.stepId || def[0]), text(item.label || def[1]), normalizeStatus(item.status));
    });
    const feedbackSummary = sanitizeFeedback(safe.feedbackSummary || safe.feedback || {});
    return clone({
      testModeName:TEST_MODE_NAME,
      appVersion:FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION,
      status:status,
      testId:TEST_ID,
      steps:steps,
      feedbackSummary:feedbackSummary,
      nextStepLabel:summarizeSteps(steps),
      userFacingSummary:{ title:"只读 Beta 用户测试", resultLabel:resultLabel(status), caveat:"测试过程不会付款、不会下单、不会出票。", redacted:true },
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      autoRefresh:false,
      payment:false,
      order:false,
      ticketing:false,
      identityUpload:false,
      credentialInput:false,
      rawResponseStored:false,
      rawUserTextStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    });
  }
  function buildFlightWorkflowGuidedUserTestMode(input) {
    if (input && typeof input === "object" && (input.blocked === true || input.restrictedCategory === true || input.status === "blocked")) {
      return sanitizeFlightWorkflowGuidedUserTestState({ status:"blocked", steps:defaultSteps("not_started").map(function (item) { item.status = "blocked"; return item; }) });
    }
    return sanitizeFlightWorkflowGuidedUserTestState(Object.assign({ status:"not_started", steps:defaultSteps("not_started") }, input || {}));
  }
  function startFlightWorkflowGuidedUserTest(input) {
    const state = buildFlightWorkflowGuidedUserTestMode(input || {});
    if (state.status === "blocked" || state.status === "failed_safe") return state;
    state.status = "in_progress";
    state.steps = defaultSteps("in_progress");
    return sanitizeFlightWorkflowGuidedUserTestState(state);
  }
  function updateFlightWorkflowGuidedUserTestStep(testState, event) {
    const state = sanitizeFlightWorkflowGuidedUserTestState(testState || startFlightWorkflowGuidedUserTest({}));
    const safeEvent = event && typeof event === "object" ? event : {};
    if (safeEvent.blocked === true || safeEvent.status === "blocked") return sanitizeFlightWorkflowGuidedUserTestState(Object.assign({}, state, { status:"blocked", steps:state.steps.map(function (item) { return Object.assign({}, item, { status:item.status === "completed" ? "completed" : "blocked" }); }) }));
    const stepId = text(safeEvent.stepId || safeEvent.actionId || "");
    const steps = state.steps.map(function (item) { return Object.assign({}, item); });
    const index = steps.findIndex(function (item) { return item.stepId === stepId; });
    if (index < 0) return state;
    const safetyIndex = steps.findIndex(function (item) { return item.stepId === "confirm_safety_notice"; });
    const handoffIndex = steps.findIndex(function (item) { return item.stepId === "review_handoff_packet"; });
    if (index >= handoffIndex && safetyIndex >= 0 && steps[safetyIndex].status !== "completed") {
      steps[index].status = "blocked";
      return sanitizeFlightWorkflowGuidedUserTestState(Object.assign({}, state, { status:"blocked", steps:steps }));
    }
    steps[index].status = "completed";
    if (stepId === "submit_feedback") state.feedbackSummary = sanitizeFeedback(safeEvent.feedback || safeEvent.feedbackSummary || {});
    const next = steps.findIndex(function (item) { return item.status !== "completed"; });
    if (next >= 0) steps[next].status = "in_progress";
    return sanitizeFlightWorkflowGuidedUserTestState(Object.assign({}, state, { status:next < 0 ? "completed" : "in_progress", steps:steps }));
  }
  function buildFlightWorkflowGuidedUserTestSummary(testState) {
    const state = sanitizeFlightWorkflowGuidedUserTestState(testState || {});
    return clone({ testModeName:TEST_MODE_NAME, appVersion:FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION, status:state.status, resultLabel:state.userFacingSummary.resultLabel, completedCount:state.steps.filter(function (item) { return item.status === "completed"; }).length, nextStepLabel:state.nextStepLabel, feedbackSummary:state.feedbackSummary, safety:safety(), redacted:true });
  }
  function buildFlightWorkflowGuidedUserTestModeAuditDraft(input) {
    const state = buildFlightWorkflowGuidedUserTestMode(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_AUDIT_DRAFT", testModeName:TEST_MODE_NAME, appVersion:FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION, status:state.status, testId:state.testId, stepCount:state.steps.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowGuidedUserTestMode = { FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION, TEST_MODE_NAME, buildFlightWorkflowGuidedUserTestMode, startFlightWorkflowGuidedUserTest, updateFlightWorkflowGuidedUserTestStep, buildFlightWorkflowGuidedUserTestSummary, buildFlightWorkflowGuidedUserTestModeAuditDraft, sanitizeFlightWorkflowGuidedUserTestState };
})();
