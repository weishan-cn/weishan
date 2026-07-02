;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION = "4.0.3";
  const LEDGER_NAME = "flight_workflow_event_ledger_v1";
  const EVENT_NAME = "flight_workflow_event_entry_v1";
  const STORAGE_KEY = "weishan.flightWorkflowEventLedger.v1";
  const DEFAULT_WORKFLOW_ID = "deterministic-flight-workflow-event-ledger-v2.4.1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;

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
      const allowedFalse = /(Stored|Included|Allowed|Enabled|Upload|Input|Open|Refresh)$/i.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function redactionSummary() { return { rawResponseStored:false, rawUserTextStored:false, secretStored:false, tradingUrlStored:false, identityStored:false, redacted:true }; }
  function read(storageLike) {
    if (!storageLike || typeof storageLike.getItem !== "function") return [];
    try {
      const raw = storageLike.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const events = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.events) ? parsed.events : []);
      return events.map(sanitizeFlightWorkflowEvent).filter(function (event) { return event.eventName === EVENT_NAME; });
    } catch (error) { return []; }
  }
  function write(storageLike, events) {
    if (!storageLike || typeof storageLike.setItem !== "function") return false;
    try {
      storageLike.setItem(STORAGE_KEY, JSON.stringify({ ledgerName:LEDGER_NAME, appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, events:pruneFlightWorkflowEventLedger(events, 20), redacted:true }));
      return true;
    } catch (error) { return false; }
  }
  function eventIdFor(index) { return "deterministic-flight-workflow-event-v2.4.1-" + String(index); }
  function sanitizeFlightWorkflowEvent(entry) {
    const safe = stripUnsafe(entry && typeof entry === "object" ? entry : {}) || {};
    return clone({
      eventName:EVENT_NAME,
      appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION,
      eventId:safe.eventId || eventIdFor(1),
      workflowId:safeText(safe.workflowId || DEFAULT_WORKFLOW_ID),
      eventType:safeText(safe.eventType || "action_requested"),
      actionId:safeText(safe.actionId || ""),
      actionLabel:safeText(safe.actionLabel || ""),
      status:safeText(safe.status || "failed_safe"),
      stageBefore:safeText(safe.stageBefore || ""),
      stageAfter:safeText(safe.stageAfter || safe.stageBefore || ""),
      message:safeText(safe.message || ""),
      redactedPayloadSummary:stripUnsafe(safe.redactedPayloadSummary || {}),
      redactionSummary:Object.assign(redactionSummary(), stripUnsafe(safe.redactionSummary || {})),
      auditFindingHints:stripUnsafe(safe.auditFindingHints || []),
      exportSafeSummary:stripUnsafe(Object.assign({ actionId:safe.actionId || "", status:safe.status || "", canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true }, safe.exportSafeSummary || {})),
      riskBadgeHints:stripUnsafe(safe.riskBadgeHints || ["只读安全"]),
      humanReviewChecklistSummary:stripUnsafe(safe.humanReviewChecklistSummary || null),
      finalSafeHandoffPacketSummary:stripUnsafe(safe.finalSafeHandoffPacketSummary || null),
      handoffPacketPolicyDecision:stripUnsafe(safe.handoffPacketPolicyDecision || null),
      finalReviewStatus:safeText(safe.finalReviewStatus || ""),
      finalReviewBadges:stripUnsafe(safe.finalReviewBadges || []),
      safety:Object.assign(safety(), stripUnsafe(safe.safety || {})),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }
  function pruneFlightWorkflowEventLedger(events, limit) {
    const max = Math.max(0, Number(limit || 20));
    return toArray(events).slice(-max).map(function (event, index) {
      const item = sanitizeFlightWorkflowEvent(event || {});
      item.eventId = item.eventId || eventIdFor(index + 1);
      return item;
    });
  }
  function loadFlightWorkflowEventLedger(storageLike) { return pruneFlightWorkflowEventLedger(read(storageLike), 20); }
  function createFlightWorkflowEventLedger(storageLike) {
    const events = loadFlightWorkflowEventLedger(storageLike);
    return clone({ ledgerName:LEDGER_NAME, appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, storageKey:STORAGE_KEY, title:"事件记录", events:events, summary:buildFlightWorkflowEventLedgerSummary(events), safety:safety(), redacted:true });
  }
  function appendFlightWorkflowEvent(entry, storageLike, options) {
    const existing = loadFlightWorkflowEventLedger(storageLike);
    const next = sanitizeFlightWorkflowEvent(Object.assign({}, entry || {}, { eventId:eventIdFor(existing.length + 1) }));
    const limit = options && options.limit || 20;
    const events = pruneFlightWorkflowEventLedger(existing.concat([next]), limit);
    write(storageLike, events);
    return clone({ ledgerName:LEDGER_NAME, appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, storageKey:STORAGE_KEY, status:"appended", event:next, events:events, summary:buildFlightWorkflowEventLedgerSummary(events), safety:safety(), redacted:true });
  }
  function clearFlightWorkflowEventLedger(storageLike) {
    if (storageLike && typeof storageLike.removeItem === "function") {
      try { storageLike.removeItem(STORAGE_KEY); } catch (error) {}
    }
    return clone({ ledgerName:LEDGER_NAME, appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, storageKey:STORAGE_KEY, status:"cleared", events:[], summary:buildFlightWorkflowEventLedgerSummary([]), safety:safety(), redacted:true });
  }
  function buildFlightWorkflowEventLedgerSummary(events) {
    const list = pruneFlightWorkflowEventLedger(events, 20);
    const last = list[list.length - 1] || null;
    return clone({ title:"事件记录", totalEvents:list.length, lastActionId:last && last.actionId || "", lastActionStatus:last && last.status || "", lastActionMessage:last && last.message || "", redactionSummary:last && last.redactionSummary || redactionSummary(), recentEvents:list.slice(-5).map(function (event) { return { eventType:event.eventType, actionId:event.actionId, status:event.status, message:event.message, finalReviewStatus:event.finalReviewStatus || "", redactionSummary:event.redactionSummary || redactionSummary(), redacted:true }; }), safety:safety(), redacted:true });
  }
  function buildFlightWorkflowEventLedgerAuditDraft(events) {
    const summary = buildFlightWorkflowEventLedgerSummary(events || []);
    return clone({ eventType:"FLIGHT_WORKFLOW_EVENT_LEDGER_AUDIT_DRAFT", ledgerName:LEDGER_NAME, appVersion:FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, storageKey:STORAGE_KEY, eventCount:summary.totalEvents, lastActionId:summary.lastActionId, lastActionStatus:summary.lastActionStatus, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redactionSummary:redactionSummary(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, redacted:true });
  }

  window.WeishanFlightWorkflowEventLedger = { FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, LEDGER_NAME, STORAGE_KEY, createFlightWorkflowEventLedger, appendFlightWorkflowEvent, loadFlightWorkflowEventLedger, clearFlightWorkflowEventLedger, pruneFlightWorkflowEventLedger, sanitizeFlightWorkflowEvent, buildFlightWorkflowEventLedgerSummary, buildFlightWorkflowEventLedgerAuditDraft };
})();
