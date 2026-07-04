;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION = "4.2.0";
  const RECOVERY_NAME = "flight_workflow_recovery_state_v1";
  const STORAGE_KEY = "weishan.flightWorkflowRecovery.v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function safeEmpty(reason) { return { recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageKey:STORAGE_KEY, status:"empty", reason:reason || "empty", state:null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true }; }
  function storageOf(storageLike) { return storageLike || (typeof window !== "undefined" && window.localStorage ? window.localStorage : null); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? value.replace(/https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡/ig, "redacted") : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included)$/.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function sanitizeFlightWorkflowRecoveryState(state) {
    const continuityApi = window.WeishanFlightWorkflowContinuityManager || {};
    const continuity = typeof continuityApi.buildFlightWorkflowContinuity === "function" ? continuityApi.buildFlightWorkflowContinuity(state || {}) : stripUnsafe(state || {});
    const safe = stripUnsafe(continuity || {}) || {};
    return clone({
      recoveryName:RECOVERY_NAME,
      appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION,
      workflowId:safe.workflowId || "",
      status:safe.status || "empty",
      currentStage:safe.currentStage || "",
      stageLabel:safe.stageLabel || "",
      collectedSummary:safe.collectedSummary || {},
      missingFields:Array.isArray(safe.missingFields) ? safe.missingFields : [],
      resumePlan:safe.resumePlan || null,
      selectedCandidateSummary:stripUnsafe(state && state.selectedCandidateSummary || state && state.selectedCandidate || null),
      handoffReceiptSummary:stripUnsafe(state && state.handoffReceiptSummary || state && state.handoffReceipt || null),
      platformCheckSummary:stripUnsafe(state && state.platformCheckSummary || state && state.manualPlatformCheckSummary || state && state.manualPlatformCheckEvidence || null),
      reconciliationSummary:stripUnsafe(state && state.reconciliationSummary || null),
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    });
  }
  function saveFlightWorkflowRecoveryState(state, storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (!storage || typeof storage.setItem !== "function") return safeEmpty("storage_unavailable");
      const safeState = sanitizeFlightWorkflowRecoveryState(state || {});
      storage.setItem(STORAGE_KEY, JSON.stringify({ recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageSchemaVersion:1, state:safeState, redacted:true }));
      return { recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageKey:STORAGE_KEY, status:"saved", state:safeState, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
    } catch (error) { return safeEmpty("save_failed_safe"); }
  }
  function loadFlightWorkflowRecoveryState(storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (!storage || typeof storage.getItem !== "function") return safeEmpty("storage_unavailable");
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmpty("empty");
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.recoveryName !== RECOVERY_NAME || parsed.storageSchemaVersion !== 1 || !parsed.state) return safeEmpty("schema_mismatch");
      return { recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageKey:STORAGE_KEY, status:"loaded", state:sanitizeFlightWorkflowRecoveryState(parsed.state), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
    } catch (error) { return safeEmpty("corrupted_storage"); }
  }
  function clearFlightWorkflowRecoveryState(storageLike) {
    try {
      const storage = storageOf(storageLike);
      if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
      return safeEmpty("cleared");
    } catch (error) { return safeEmpty("clear_failed_safe"); }
  }
  function createFlightWorkflowRecoveryStore(storageLike) {
    return { recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageKey:STORAGE_KEY, save:function (state) { return saveFlightWorkflowRecoveryState(state, storageLike); }, load:function () { return loadFlightWorkflowRecoveryState(storageLike); }, clear:function () { return clearFlightWorkflowRecoveryState(storageLike); }, redacted:true };
  }
  function buildFlightWorkflowRecoveryStorageHealth(storageLike) {
    const loaded = loadFlightWorkflowRecoveryState(storageLike);
    return { recoveryName:RECOVERY_NAME, appVersion:FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, storageKey:STORAGE_KEY, status:loaded.status === "loaded" ? "available" : loaded.status, canSave:true, corruptedSafeEmpty:loaded.reason === "corrupted_storage", schemaMismatchSafeEmpty:loaded.reason === "schema_mismatch", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true };
  }
  window.WeishanFlightWorkflowRecoveryStore = { FLIGHT_WORKFLOW_RECOVERY_STORE_VERSION, RECOVERY_NAME, STORAGE_KEY, createFlightWorkflowRecoveryStore, saveFlightWorkflowRecoveryState, loadFlightWorkflowRecoveryState, clearFlightWorkflowRecoveryState, sanitizeFlightWorkflowRecoveryState, buildFlightWorkflowRecoveryStorageHealth };
})();
