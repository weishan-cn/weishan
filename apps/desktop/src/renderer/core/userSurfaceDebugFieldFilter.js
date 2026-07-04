(function(){
  const USER_SURFACE_DEBUG_FIELD_FILTER_VERSION = "4.2.6";
  const BLOCKED_DEBUG_FIELDS = [
    "autoOpen: false",
    "payment: false",
    "order: false",
    "identityUpload: false",
    "redacted: true",
    "bookingUrl: null",
    "handoffDecision",
    "actionType",
    "guardName",
    "rollbackDecision",
    "rollbackReason",
    "canClaimCheapest",
    "canParticipateInCheapestRanking",
    "not_ranked_as_real_cheapest",
    "Cheapest Truth Guard",
    "audit draft",
    "schemaVersion",
    "raw JSON",
    "internal enum",
    "providerReadiness raw matrix",
    "networkAttemptCount",
    "realApiKeyReadCount",
    "identityUploadAttemptCount"
  ];
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value); }
  function stripDebugText(value){
    let output = text(value);
    BLOCKED_DEBUG_FIELDS.forEach(function(field){
      output = output.split(field).join("");
    });
    output = output.replace(/\n{3,}/g, "\n\n").trim();
    return output;
  }
  function filterUserSurfaceObject(input){
    if (Array.isArray(input)) return input.map(filterUserSurfaceObject);
    if (!input || typeof input !== "object") return input;
    const output = {};
    Object.keys(input).forEach(function(key){
      if (/^(autoOpen|payment|order|identityUpload|redacted|bookingUrl|handoffDecision|actionType|guardName|rollbackDecision|rollbackReason|canClaimCheapest|canParticipateInCheapestRanking|not_ranked_as_real_cheapest|schemaVersion|networkAttemptCount|realApiKeyReadCount|identityUploadAttemptCount)$/i.test(key)) return;
      output[key] = filterUserSurfaceObject(input[key]);
    });
    return output;
  }
  function buildDebugFieldFilterAuditDraft(input){
    const raw = text(input && input.userSurfaceText || "");
    const leakCount = BLOCKED_DEBUG_FIELDS.reduce(function(count, field){ return count + (raw.indexOf(field) >= 0 ? 1 : 0); }, 0);
    return clone({
      eventType:"USER_SURFACE_DEBUG_FIELD_FILTER_DRAFT",
      debugFieldLeakCount:leakCount,
      blockedFieldCount:BLOCKED_DEBUG_FIELDS.length,
      debugFieldsHiddenFromUserSurface:true,
      debugFieldsAvailableInDebugSurface:true,
      redacted:true
    });
  }
  function assertUserSurfaceDebugFieldsHidden(input){
    const serial = typeof input === "string" ? input : JSON.stringify(input || {});
    BLOCKED_DEBUG_FIELDS.forEach(function(field){
      if (serial.indexOf(field) >= 0) throw new Error("user surface leaked debug field: " + field);
    });
    return true;
  }
  window.WeishanUserSurfaceDebugFieldFilter = {
    USER_SURFACE_DEBUG_FIELD_FILTER_VERSION,
    BLOCKED_DEBUG_FIELDS,
    stripDebugText,
    filterUserSurfaceObject,
    buildDebugFieldFilterAuditDraft,
    assertUserSurfaceDebugFieldsHidden
  };
})();
