(function(){
  const AI_BACKEND_ROUTER_VERSION = "4.2.0";

  function bool(value){ return value === true; }
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value || "").trim(); }

  function isRestricted(input){
    const decision = text(input && input.restrictedCategoryDecision || input && input.restrictedDecision);
    const taskType = text(input && input.taskType);
    return decision === "blocked" || taskType === "restricted_or_blocked" || taskType === "restricted";
  }

  function hasTokenMetadata(input){
    const userState = input && input.userAiApiState || {};
    const storageState = input && input.secureApiKeyStorageState || {};
    return bool(userState.aiApiTokenConfigured) || bool(userState.userAiTokenConfigured) || bool(userState.hasUserAiApiToken) || bool(storageState.aiApiTokenMetadataAvailable) || bool(storageState.hasTokenMetadata);
  }

  function networkEnabled(input){
    const policy = input && input.networkPolicy || {};
    if (policy.enabled === false || policy.networkAllowed === false || policy.mode === "disabled") return false;
    return true;
  }

  function routeAiBackend(input){
    const safeInput = input && typeof input === "object" ? input : {};
    const restricted = isRestricted(safeInput);
    const tokenAvailable = hasTokenMetadata(safeInput);
    const canUseNetwork = networkEnabled(safeInput);
    let backendDecision = "local_rules";
    let reason = "no user AI token metadata; local rules available";
    let tokenReadMode = "not_available";
    if (restricted) {
      backendDecision = "blocked";
      reason = "restricted category blocked by safety guard";
      tokenReadMode = "not_available";
    } else if (tokenAvailable) {
      backendDecision = "user_ai_token";
      reason = "user AI API token metadata available; route through secure proxy only";
      tokenReadMode = "secure_proxy_only";
    } else if (canUseNetwork) {
      backendDecision = "safe_network_search";
      reason = "no user AI token metadata; safe read-only network search planning may be used";
      tokenReadMode = "not_available";
    } else {
      backendDecision = "local_rules";
      reason = "network disabled; local rules only";
      tokenReadMode = "not_available";
    }
    return {
      routerVersion:AI_BACKEND_ROUTER_VERSION,
      backendDecision,
      reason,
      tokenReadMode,
      tokenPlaintextDisplayed:false,
      tokenLogged:false,
      networkAllowed:backendDecision === "safe_network_search" && canUseNetwork,
      restrictedBlocked:restricted,
      paymentDisabled:true,
      orderDisabled:true,
      identityUploadDisabled:true,
      redacted:true
    };
  }

  function buildAiBackendRouterAuditDraft(input){
    const decision = routeAiBackend(input || {});
    return clone({
      eventType:"AI_BACKEND_ROUTER_DRAFT",
      backendDecision:decision.backendDecision,
      tokenReadMode:decision.tokenReadMode,
      tokenPlaintextDisplayed:false,
      tokenLogged:false,
      networkAllowed:decision.networkAllowed,
      restrictedBlocked:decision.restrictedBlocked,
      paymentDisabled:true,
      orderDisabled:true,
      identityUploadDisabled:true,
      redacted:true
    });
  }

  function assertAiBackendRouterSafe(decision){
    const value = decision || routeAiBackend({});
    if (value.tokenPlaintextDisplayed !== false) throw new Error("AI backend router must not display token plaintext");
    if (value.tokenLogged !== false) throw new Error("AI backend router must not log token plaintext");
    if (value.paymentDisabled !== true || value.orderDisabled !== true || value.identityUploadDisabled !== true) throw new Error("AI backend router must keep payment/order/identity disabled");
    if (!["user_ai_token", "safe_network_search", "local_rules", "blocked"].includes(value.backendDecision)) throw new Error("invalid AI backend decision");
    return true;
  }

  window.WeishanAiBackendRouter = {
    AI_BACKEND_ROUTER_VERSION,
    routeAiBackend,
    buildAiBackendRouterAuditDraft,
    assertAiBackendRouterSafe
  };
})();
