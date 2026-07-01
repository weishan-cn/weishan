;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION = "3.6.0";
  const CHECKLIST_NAME = "flight_workflow_human_review_checklist_v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawUserText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|apiKey|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included|Allowed|Enabled|Upload|Input|Open|Refresh|Payment|Order|Ticketing|Risk)$/i.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, canOpenExternalPlatform:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function scanRisk(value) {
    const risks = [];
    function add(id) { if (risks.indexOf(id) < 0) risks.push(id); }
    function visit(item, key) {
      if (item == null) return;
      const name = String(key || "");
      if (/rawProviderResponse|rawResponse|rawPayload/i.test(name) && item) add("raw_provider_response_blocked");
      if (/rawText|rawUserText|rawInput/i.test(name) && item) add("raw_user_text_blocked");
      if (/token|apiKey|secret|password|auth/i.test(name) && item) add("secret_blocked");
      if (/credential|identity|passport|bank|card|idNumber|passportNumber/i.test(name) && item) add("identity_or_credential_blocked");
      if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl/i.test(name) && item !== null && item !== false && item !== "") add("trading_url_blocked");
      if (/payment|pay/i.test(name) && item === true) add("payment_blocked");
      if (/order|checkout/i.test(name) && item === true) add("order_blocked");
      if (/ticketing|issue_ticket/i.test(name) && item === true) add("ticketing_blocked");
      if (typeof item === "string" && (/token|apiKey|secret|password|sk-|pk-|live_|prod_|身份证|护照|银行卡|https?:\/\//i.test(item))) add("sensitive_text_blocked");
      if (Array.isArray(item)) item.forEach(function (child) { visit(child, name); });
      else if (item && typeof item === "object") Object.keys(item).forEach(function (childKey) { visit(item[childKey], childKey); });
    }
    visit(value, "");
    return risks;
  }
  function routeReviewed(input) { return !!(input.routeSummary || input.origin && input.destination || input.flightFields && input.flightFields.origin && input.flightFields.destination || input.workflowStateSummary && input.workflowStateSummary.routeSummary); }
  function dateReviewed(input) { return !!(input.departureDate || input.dateDisplay || input.flightFields && input.flightFields.date || input.workflowStateSummary && input.workflowStateSummary.departureDate); }
  function candidateReviewed(input) { return !!(input.selectedCandidate || input.selectedCandidateSummary || toArray(input.topCandidates || input.dryRunTopCandidates).length); }
  function platformReviewed(input) { return !!(input.manualPlatformCheckSummary || input.manualPlatformCheckEvidence || input.platformCheckOutcomeSummary || input.reconciliationSummary); }
  function platformMismatch(input) { const textBlob = JSON.stringify(stripUnsafe(input.platformCheckDeltaSummary || input.reconciliationSummary || input.platformCheckOutcomeSummary || input.manualPlatformCheckSummary || input.manualPlatformCheckEvidence || {})); return /mismatch|different|差异|不一致|价格变化/.test(textBlob); }
  function auditBlocked(input) { const audit = input.auditReviewSummary || input.auditReview || input.auditReviewCenter || {}; const sentinel = input.safetyRegressionSummary || input.sentinelReport || {}; return audit.status === "blocked" || audit.auditHealth && audit.auditHealth.overall === "blocked" || input.handoffPacketPolicyDecision && input.handoffPacketPolicyDecision.status === "blocked" || sentinel.status === "fail" || sentinel.status === "failed_safe"; }
  function evaluateFlightWorkflowHumanReviewReadiness(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return clone({ status:"failed_safe", routeReviewed:false, dateReviewed:false, candidateReviewed:false, platformCheckReviewed:false, safetyReviewed:false, hasPlatformMismatch:false, safeToProceedToPlatformConfirmation:false, blockedReasons:["malformed_input"], needsReviewReasons:["malformed_input"], redacted:true });
    const risks = scanRisk(input);
    const readiness = { routeReviewed:routeReviewed(input), dateReviewed:dateReviewed(input), candidateReviewed:candidateReviewed(input), platformCheckReviewed:platformReviewed(input), safetyReviewed:risks.length === 0, hasPlatformMismatch:platformMismatch(input), auditBlocked:auditBlocked(input), blockedReasons:[], needsReviewReasons:[], redacted:true };
    if (risks.length) readiness.blockedReasons = readiness.blockedReasons.concat(risks);
    if (readiness.auditBlocked) readiness.blockedReasons.push("audit_blocked");
    if (!readiness.routeReviewed) readiness.needsReviewReasons.push("route_review_required");
    if (!readiness.dateReviewed) readiness.needsReviewReasons.push("date_review_required");
    if (!readiness.candidateReviewed) readiness.needsReviewReasons.push("candidate_review_required");
    if (!readiness.platformCheckReviewed) readiness.needsReviewReasons.push("platform_check_required");
    if (readiness.hasPlatformMismatch) readiness.needsReviewReasons.push("平台结果与候选证据存在差异");
    readiness.safeToProceedToPlatformConfirmation = readiness.blockedReasons.length === 0 && readiness.needsReviewReasons.length === 0;
    readiness.status = readiness.blockedReasons.length ? "blocked" : (readiness.safeToProceedToPlatformConfirmation ? "ready" : "needs_review");
    return clone(readiness);
  }
  function item(itemId, label, checked, note) { return { itemId:itemId, label:label, checked:checked === true, note:safeText(note || ""), redacted:true }; }
  function buildFlightWorkflowHumanReviewItems(input) {
    const readiness = evaluateFlightWorkflowHumanReviewReadiness(input || {});
    return clone([
      item("route", "行程路线", readiness.routeReviewed, readiness.routeReviewed ? "已确认项" : "未完成项"),
      item("date", "出发日期", readiness.dateReviewed, readiness.dateReviewed ? "已确认项" : "未完成项"),
      item("candidate", "候选证据", readiness.candidateReviewed, readiness.candidateReviewed ? "已确认项" : "未完成项"),
      item("platform_check", "平台核对摘要", readiness.platformCheckReviewed && !readiness.hasPlatformMismatch, readiness.hasPlatformMismatch ? "平台结果与候选证据存在差异" : (readiness.platformCheckReviewed ? "已确认项" : "未完成项")),
      item("safety", "安全限制摘要", readiness.safetyReviewed && !readiness.auditBlocked, readiness.safetyReviewed ? "唯珊不会付款、不会下单、不会出票" : "交接包已阻断")
    ]);
  }
  function buildFlightWorkflowHumanReviewChecklist(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowHumanReviewChecklist({ checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, status:"failed_safe", reviewTitle:"前往平台前请人工复核", reviewItems:[], checkedItems:[], incompleteItems:[], blockedItems:[item("malformed_input", "安全降级", false, "交接包已阻断")], readiness:evaluateFlightWorkflowHumanReviewReadiness(null), userFacingSummary:{ title:"前往平台前请人工复核", line:"交接包已阻断", caveat:"平台页面结果为准；唯珊不会付款、不会下单、不会出票。", redacted:true }, operatorConsoleSummary:null, safetyRegressionSummary:null, sentinelStatus:"", operatorReadiness:null, nextOperatorAction:null, safety:safety(), redacted:true });
    try {
      const readiness = evaluateFlightWorkflowHumanReviewReadiness(input || {});
      const items = buildFlightWorkflowHumanReviewItems(input || {});
      return sanitizeFlightWorkflowHumanReviewChecklist({ checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, status:readiness.status, reviewTitle:"前往平台前请人工复核", reviewItems:items, checkedItems:items.filter(function (x) { return x.checked; }), incompleteItems:items.filter(function (x) { return !x.checked; }), blockedItems:readiness.blockedReasons.map(function (reason) { return item(reason, reason, false, "交接包已阻断"); }), readiness:readiness, userFacingSummary:{ title:"前往平台前请人工复核", line:readiness.status === "ready" ? "可以进入平台确认" : (readiness.status === "blocked" ? "交接包已阻断" : "仍需补充复核"), caveat:"平台页面结果为准；唯珊不会付款、不会下单、不会出票。", redacted:true }, safety:safety(), redacted:true });
    } catch (error) { return sanitizeFlightWorkflowHumanReviewChecklist({ checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, status:"failed_safe", reviewTitle:"前往平台前请人工复核", reviewItems:[], checkedItems:[], incompleteItems:[], blockedItems:[item("failed_safe", "安全降级", false, "交接包已阻断")], readiness:evaluateFlightWorkflowHumanReviewReadiness(null), userFacingSummary:{ title:"前往平台前请人工复核", line:"交接包已阻断", caveat:"平台页面结果为准；唯珊不会付款、不会下单、不会出票。", redacted:true }, safety:safety(), redacted:true }); }
  }
  function sanitizeFlightWorkflowHumanReviewChecklist(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    safe.checklistName = CHECKLIST_NAME; safe.appVersion = FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION;
    safe.reviewItems = toArray(safe.reviewItems).map(stripUnsafe); safe.checkedItems = toArray(safe.checkedItems).map(stripUnsafe); safe.incompleteItems = toArray(safe.incompleteItems).map(stripUnsafe); safe.blockedItems = toArray(safe.blockedItems).map(stripUnsafe);
    safe.userFacingSummary = Object.assign({ title:"前往平台前请人工复核", line:"仍需补充复核", caveat:"平台页面结果为准；唯珊不会付款、不会下单、不会出票。" }, stripUnsafe(safe.userFacingSummary || {}));
    safe.operatorConsoleSummary = stripUnsafe(safe.operatorConsoleSummary || null); safe.safetyRegressionSummary = stripUnsafe(safe.safetyRegressionSummary || null); safe.sentinelStatus = safeText(safe.sentinelStatus || safe.safetyRegressionSummary && safe.safetyRegressionSummary.status || ""); safe.operatorReadiness = stripUnsafe(safe.operatorReadiness || null); safe.nextOperatorAction = stripUnsafe(safe.nextOperatorAction || null); safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null; safe.checkoutUrl = null; safe.paymentUrl = null; safe.orderUrl = null; safe.canOpenExternalPlatform = false; safe.payment = false; safe.order = false; safe.ticketing = false; safe.identityUpload = false; safe.credentialInput = false; safe.rawResponseStored = false; safe.rawUserTextStored = false; safe.secretStored = false; safe.redacted = true;
    return clone(safe);
  }
  function buildFlightWorkflowHumanReviewChecklistAuditDraft(input) { const checklist = buildFlightWorkflowHumanReviewChecklist(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_AUDIT_DRAFT", checklistName:CHECKLIST_NAME, appVersion:FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, status:checklist.status, checkedCount:checklist.checkedItems.length, incompleteCount:checklist.incompleteItems.length, blockedCount:checklist.blockedItems.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }); }
  window.WeishanFlightWorkflowHumanReviewChecklist = { FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, CHECKLIST_NAME, buildFlightWorkflowHumanReviewChecklist, evaluateFlightWorkflowHumanReviewReadiness, buildFlightWorkflowHumanReviewItems, buildFlightWorkflowHumanReviewChecklistAuditDraft, sanitizeFlightWorkflowHumanReviewChecklist };
})();
