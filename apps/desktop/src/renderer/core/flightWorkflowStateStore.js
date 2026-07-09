;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_STATE_STORE_VERSION = "4.2.7";
  const STORE_NAME = "flight_workflow_state_store_v1";
  const STORAGE_KEY = "weishan.flightWorkflowState.v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function safeEmpty(reason) { return { storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageKey:STORAGE_KEY, status:"empty", reason:reason || "empty", state:null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true }; }
  function storageOf(storageLike) { return storageLike || (typeof window !== "undefined" && window.localStorage ? window.localStorage : null); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? value.replace(/https?:\/\/\S+|token|key|secret|password/ig, "redacted") : value;
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
  function sanitizeFlightWorkflowStateForStorage(state) {
    const machine = window.WeishanFlightWorkflowStateMachine || {};
    const safe = typeof machine.sanitizeFlightWorkflowState === "function" ? machine.sanitizeFlightWorkflowState(state || {}) : (stripUnsafe(state || {}) || {});
    safe.appVersion = FLIGHT_WORKFLOW_STATE_STORE_VERSION;
    safe.storageSchemaVersion = 1;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.rawResponseStored = false;
    safe.secretStored = false;
    safe.redacted = true;
    return clone(safe);
  }
  function saveFlightWorkflowState(state, storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (!storage || typeof storage.setItem !== "function") return safeEmpty("storage_unavailable");
      const safeState = sanitizeFlightWorkflowStateForStorage(state || {});
      storage.setItem(STORAGE_KEY, JSON.stringify({ storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageSchemaVersion:1, state:safeState, redacted:true }));
      return { storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageKey:STORAGE_KEY, status:"saved", state:safeState, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
    } catch (error) { return safeEmpty("save_failed_safe"); }
  }
  function loadFlightWorkflowState(storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (!storage || typeof storage.getItem !== "function") return safeEmpty("storage_unavailable");
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmpty("empty");
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.storeName !== STORE_NAME || parsed.storageSchemaVersion !== 1 || !parsed.state) return safeEmpty("schema_mismatch");
      return { storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageKey:STORAGE_KEY, status:"loaded", state:sanitizeFlightWorkflowStateForStorage(parsed.state), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
    } catch (error) { return safeEmpty("corrupted_storage"); }
  }
  function clearFlightWorkflowState(storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
      return safeEmpty("cleared");
    } catch (error) { return safeEmpty("clear_failed_safe"); }
  }
  function createFlightWorkflowStateStore(storageLike) {
    return { storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageKey:STORAGE_KEY, save:function (state) { return saveFlightWorkflowState(state, storageLike); }, load:function () { return loadFlightWorkflowState(storageLike); }, clear:function () { return clearFlightWorkflowState(storageLike); }, redacted:true };
  }
  function buildFlightWorkflowStateStorageHealth(storageLike) {
    const loaded = loadFlightWorkflowState(storageLike);
    return { storeName:STORE_NAME, appVersion:FLIGHT_WORKFLOW_STATE_STORE_VERSION, storageKey:STORAGE_KEY, status:loaded.status === "loaded" ? "available" : loaded.status, canSave:true, corruptedSafeEmpty:loaded.reason === "corrupted_storage", schemaMismatchSafeEmpty:loaded.reason === "schema_mismatch", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
  }
  window.WeishanFlightWorkflowStateStore = { FLIGHT_WORKFLOW_STATE_STORE_VERSION, STORE_NAME, STORAGE_KEY, createFlightWorkflowStateStore, saveFlightWorkflowState, loadFlightWorkflowState, clearFlightWorkflowState, sanitizeFlightWorkflowStateForStorage, buildFlightWorkflowStateStorageHealth };
})();
