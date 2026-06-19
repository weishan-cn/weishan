(function(){
  const NO_NETWORK_SENTINEL_AUDIT_VERSION = "2.1.20";

  const sentinelScope = [
    "provider adapters",
    "provider sandbox",
    "provider endpoint allowlist",
    "bookingUrl safety",
    "read-only adapter contract",
    "offline fixture runner",
    "provider compliance decision engine",
    "manual review workflow",
    "credential consent scope"
  ];

  const blockedPrimitives = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "navigator.sendBeacon",
    "Electron net",
    "Node http",
    "Node https",
    "DNS lookup",
    "redirect follow",
    "external provider sandbox call",
    "provider write action call"
  ];

  const defaultPrimitiveDecisions = [
    "fetch -> NETWORK_DISABLED",
    "XMLHttpRequest -> NETWORK_DISABLED",
    "WebSocket -> NETWORK_DISABLED",
    "EventSource -> NETWORK_DISABLED",
    "navigator.sendBeacon -> NETWORK_DISABLED",
    "Electron net -> NETWORK_DISABLED",
    "Node http -> NETWORK_DISABLED",
    "Node https -> NETWORK_DISABLED",
    "DNS lookup -> NETWORK_DISABLED",
    "redirect follow -> REDIRECT_FORBIDDEN",
    "provider write action -> WRITE_ACTION_FORBIDDEN"
  ];

  const commerceNoNetworkSentinelAuditContract = {
    version:NO_NETWORK_SENTINEL_AUDIT_VERSION,
    moduleName:"no_network_sentinel_audit",
    phase:"no_network_sentinel_audit",
    sentinelStatus:"blocked",
    mode:"static_no_network_audit",
    globalMonkeyPatch:"disabled",
    providerNetworkCall:"disabled",
    fetchAttempt:"blocked",
    xhrAttempt:"blocked",
    websocketAttempt:"blocked",
    eventSourceAttempt:"blocked",
    sendBeaconAttempt:"blocked",
    electronNetAttempt:"blocked",
    nodeHttpHttpsAttempt:"blocked",
    dnsLookupAttempt:"blocked",
    redirectFollow:"blocked",
    redacted:true,
    capabilities:{
      canShowStaticAudit:true,
      canBuildDecisionObjectDraft:true,
      canEmitRedactedAuditDraft:true,
      canMonkeyPatchGlobalFetch:false,
      canUseNetwork:false,
      canUseFetch:false,
      canUseXhr:false,
      canUseWebSocket:false,
      canUseEventSource:false,
      canUseSendBeacon:false,
      canUseElectronNet:false,
      canUseNodeHttp:false,
      canUseNodeHttps:false,
      canResolveDns:false,
      canFollowRedirect:false,
      canCallProviderSandbox:false,
      canCallProviderWriteAction:false
    },
    display:{
      title:"no-network sentinel audit",
      establishedLine:"no-network sentinel audit：sentinel 已建立",
      statusLine:"status: blocked",
      modeLine:"mode: static no-network audit",
      monkeyPatchLine:"no global monkey patch",
      networkCallLine:"no provider network call",
      fetchLine:"fetch attempt blocked",
      xhrLine:"XMLHttpRequest attempt blocked",
      websocketLine:"WebSocket attempt blocked",
      eventSourceLine:"EventSource attempt blocked",
      sendBeaconLine:"sendBeacon attempt blocked",
      electronNetLine:"Electron net attempt blocked",
      nodeHttpLine:"Node http/https attempt blocked",
      dnsLine:"DNS lookup attempt blocked",
      redirectLine:"redirect follow blocked",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildNoNetworkSentinelDecisionObjectDraft(input){
    const target = input && typeof input === "object" ? input : {};
    const primitive = target.networkPrimitive || "fetch";
    const reason = primitive === "redirect follow" ? "REDIRECT_FORBIDDEN" : primitive === "provider write action" ? "WRITE_ACTION_FORBIDDEN" : "NETWORK_DISABLED";
    return {
      version:NO_NETWORK_SENTINEL_AUDIT_VERSION,
      sentinelDecisionId:"sentinel_decision_blocked",
      networkPrimitive:primitive,
      targetUrlHost:target.targetUrlHost || "none",
      targetUrlScheme:target.targetUrlScheme || "none",
      providerId:target.providerId || "none",
      adapterId:target.adapterId || "none",
      methodName:target.methodName || "none",
      decision:"blocked",
      blockedReason:reason,
      observedAt:"none",
      schemaVersion:NO_NETWORK_SENTINEL_AUDIT_VERSION,
      redacted:true
    };
  }

  function buildNoNetworkSentinelAuditDraft(input){
    const decision = buildNoNetworkSentinelDecisionObjectDraft(input);
    return {
      version:NO_NETWORK_SENTINEL_AUDIT_VERSION,
      noNetworkSentinelAuditDraft:{
        eventType:"NO_NETWORK_SENTINEL_DECISION_DRAFT",
        schemaVersion:NO_NETWORK_SENTINEL_AUDIT_VERSION,
        sentinelDecisionId:decision.sentinelDecisionId,
        networkPrimitive:decision.networkPrimitive,
        decision:decision.decision,
        blockedReason:decision.blockedReason,
        targetUrlHost:decision.targetUrlHost,
        providerId:decision.providerId,
        adapterId:decision.adapterId,
        methodName:decision.methodName,
        redacted:true
      },
      redacted:true
    };
  }

  function evaluateNoNetworkSentinelPrimitive(input){
    return buildNoNetworkSentinelDecisionObjectDraft(input);
  }

  function buildNoNetworkSentinelAuditDisplay(){
    return {
      version:NO_NETWORK_SENTINEL_AUDIT_VERSION,
      contract:clone(commerceNoNetworkSentinelAuditContract),
      sentinelScope:sentinelScope.slice(),
      blockedPrimitives:blockedPrimitives.slice(),
      defaultPrimitiveDecisions:defaultPrimitiveDecisions.slice(),
      sentinelDecisionObjectDraft:buildNoNetworkSentinelDecisionObjectDraft(),
      audit:buildNoNetworkSentinelAuditDraft(),
      redacted:true
    };
  }

  function assertNoNetworkSentinelAuditSafe(display){
    const target = display && typeof display === "object" ? display : buildNoNetworkSentinelAuditDisplay();
    const contract = target.contract || commerceNoNetworkSentinelAuditContract;
    const caps = contract.capabilities || {};
    if (contract.sentinelStatus !== "blocked") throw new Error("no-network sentinel must stay blocked");
    if (contract.mode !== "static_no_network_audit") throw new Error("no-network sentinel must stay static audit");
    ["canMonkeyPatchGlobalFetch", "canUseNetwork", "canUseFetch", "canUseXhr", "canUseWebSocket", "canUseEventSource", "canUseSendBeacon", "canUseElectronNet", "canUseNodeHttp", "canUseNodeHttps", "canResolveDns", "canFollowRedirect", "canCallProviderSandbox", "canCallProviderWriteAction"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  window.WeishanCommerceNoNetworkSentinelAudit = {
    NO_NETWORK_SENTINEL_AUDIT_VERSION,
    commerceNoNetworkSentinelAuditContract,
    sentinelScope,
    blockedPrimitives,
    defaultPrimitiveDecisions,
    buildNoNetworkSentinelDecisionObjectDraft,
    buildNoNetworkSentinelAuditDraft,
    evaluateNoNetworkSentinelPrimitive,
    buildNoNetworkSentinelAuditDisplay,
    assertNoNetworkSentinelAuditSafe
  };
})();
