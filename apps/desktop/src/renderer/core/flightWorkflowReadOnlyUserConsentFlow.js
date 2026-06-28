;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION = "2.1.88";
  const CONSENT_FLOW_NAME = "flight_workflow_read_only_user_consent_flow_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  const SENSITIVE_INPUT_RE = /身份证|护照|银行卡|passport|cardNumber|credential|password|token|apiKey|secret|登录凭据|证件|银行卡/i;
  const REQUIRED_ITEMS = [
    ["read_only_scope", "我知道当前只是只读候选证据"],
    ["platform_final", "我知道价格、库存、税费和规则以平台页面为准"],
    ["no_transaction", "我知道唯珊不会付款、不会下单、不会出票"],
    ["no_identity_upload", "我知道唯珊不会上传证件、银行卡或登录凭据"],
    ["feedback_redacted", "我知道测试反馈会脱敏处理"]
  ];
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function acceptedMap(input) {
    const safe = input && typeof input === "object" ? input : {};
    const map = {};
    if (safe.acceptedItems && typeof safe.acceptedItems === "object") Object.keys(safe.acceptedItems).forEach(function (name) { map[name] = safe.acceptedItems[name] === true; });
    toArray(safe.consentItems).forEach(function (item) { if (item && item.itemId) map[item.itemId] = item.accepted === true || item.status === "accepted"; });
    toArray(safe.acceptedConsentItemIds || safe.acceptedItemIds).forEach(function (id) { map[id] = true; });
    return map;
  }
  function hasSensitiveInput(input) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.identityUpload === true || safe.credentialInput === true || safe.rawUserTextStored === true || safe.secretStored === true || SENSITIVE_INPUT_RE.test(JSON.stringify(safe.feedbackText || safe.userText || safe.rawInput || safe));
  }
  function buildFlightWorkflowReadOnlyConsentItems(input) {
    const map = acceptedMap(input || {});
    return clone(REQUIRED_ITEMS.map(function (entry) { return { itemId:entry[0], label:entry[1], required:true, accepted:map[entry[0]] === true, status:map[entry[0]] === true ? "accepted" : "not_accepted", redacted:true }; }));
  }
  function evaluateFlightWorkflowReadOnlyUserConsent(input) {
    const items = buildFlightWorkflowReadOnlyConsentItems(input || {});
    const acceptedCount = items.filter(function (item) { return item.accepted === true; }).length;
    const requiredCount = items.length;
    const started = (input && input.started === true) || acceptedCount > 0 || toArray(input && input.consentItems).length > 0 || Object.keys(acceptedMap(input || {})).length > 0;
    const blocked = hasSensitiveInput(input || {});
    const allRequiredAccepted = requiredCount > 0 && acceptedCount === requiredCount;
    let status = "not_started";
    if (blocked) status = "blocked";
    else if (allRequiredAccepted) status = "accepted";
    else if (!started) status = "not_started";
    else if (acceptedCount > 0) status = "in_progress";
    else status = "missing_required_items";
    if (started && !blocked && !allRequiredAccepted && acceptedCount === 0) status = "missing_required_items";
    return clone({ status:status, consentItems:items, consentSummary:{ requiredCount:requiredCount, acceptedCount:acceptedCount, allRequiredAccepted:allRequiredAccepted && !blocked, redacted:true }, redacted:true });
  }
  function sanitizeFlightWorkflowReadOnlyUserConsent(consent) {
    const safe = consent && typeof consent === "object" ? consent : {};
    const status = safeText(safe.status || "failed_safe");
    const resultLabel = status === "accepted" ? "已确认只读范围" : (status === "blocked" || status === "failed_safe" ? "确认已阻断" : "仍有必选项未确认");
    return clone({ consentFlowName:CONSENT_FLOW_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION, status:status, consentItems:toArray(safe.consentItems).map(function (item) { return { itemId:safeText(item.itemId || ""), label:safeText(item.label || ""), required:item.required !== false, accepted:item.accepted === true, status:item.accepted === true || item.status === "accepted" ? "accepted" : "not_accepted", redacted:true }; }), consentSummary:Object.assign({ requiredCount:REQUIRED_ITEMS.length, acceptedCount:0, allRequiredAccepted:false, redacted:true }, safe.consentSummary || {}), userFacingSummary:Object.assign({ title:"只读试点用户确认", resultLabel:resultLabel, caveat:"确认仅用于进入只读测试流程，不代表交易授权。", redacted:true }, safe.userFacingSummary || {}), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  function buildFlightWorkflowReadOnlyUserConsentFlow(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowReadOnlyUserConsent({ status:"failed_safe", consentItems:buildFlightWorkflowReadOnlyConsentItems({}) });
      const evaluation = evaluateFlightWorkflowReadOnlyUserConsent(input);
      return sanitizeFlightWorkflowReadOnlyUserConsent(evaluation);
    } catch (error) { return sanitizeFlightWorkflowReadOnlyUserConsent({ status:"failed_safe", consentItems:buildFlightWorkflowReadOnlyConsentItems({}) }); }
  }
  function buildFlightWorkflowReadOnlyUserConsentFlowAuditDraft(input) {
    const consent = buildFlightWorkflowReadOnlyUserConsentFlow(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_AUDIT_DRAFT", consentFlowName:CONSENT_FLOW_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION, status:consent.status, requiredCount:consent.consentSummary.requiredCount, acceptedCount:consent.consentSummary.acceptedCount, allRequiredAccepted:consent.consentSummary.allRequiredAccepted === true, consentIsTransactionAuthorization:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }
  window.WeishanFlightWorkflowReadOnlyUserConsentFlow = { FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION, CONSENT_FLOW_NAME, buildFlightWorkflowReadOnlyUserConsentFlow, evaluateFlightWorkflowReadOnlyUserConsent, buildFlightWorkflowReadOnlyConsentItems, buildFlightWorkflowReadOnlyUserConsentFlowAuditDraft, sanitizeFlightWorkflowReadOnlyUserConsent };
})();
