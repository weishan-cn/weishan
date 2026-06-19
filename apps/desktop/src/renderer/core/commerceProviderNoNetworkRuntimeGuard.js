(function(){
  const PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION = "2.1.13";

  const blockedNetworkPrimitives = [
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

  const blockedErrorStates = [
    "NETWORK_DISABLED",
    "PROVIDER_NETWORK_DISABLED",
    "ENDPOINT_CONNECTION_DISABLED",
    "REAL_SANDBOX_DISABLED",
    "CREDENTIAL_NOT_AVAILABLE",
    "CONSENT_NOT_APPROVED",
    "PROVIDER_NOT_APPROVED",
    "ENDPOINT_NOT_ALLOWED",
    "REDIRECT_FORBIDDEN",
    "WRITE_ACTION_FORBIDDEN",
    "BOOKING_URL_FORBIDDEN",
    "RAW_PAYLOAD_FORBIDDEN"
  ];

  const currentPolicy = [
    "当前版本不执行真实 provider 请求",
    "当前版本不测试真实 endpoint",
    "当前版本不运行真实 provider sandbox",
    "当前版本不执行 adapter network",
    "当前版本不跟随 redirect",
    "当前版本不解析真实 DNS",
    "当前版本只返回 blocked guard decision",
    "当前版本只展示脱敏审计草案"
  ];

  const linkage = [
    "provider gate matrix dashboard",
    "provider activation readiness gate",
    "credential consent scope gate",
    "read-only adapter contract gate",
    "manual provider review workflow",
    "provider endpoint allowlist gate",
    "readonly provider sandbox gate",
    "bookingUrl domain safety gate",
    "密钥脱敏规则",
    "API 绑定准备状态"
  ];

  const commerceProviderNoNetworkRuntimeGuardContract = {
    version:PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
    moduleName:"provider_no_network_runtime_guard",
    phase:"provider_no_network_runtime_guard",
    guardStatus:"blocked",
    mode:"no_network_enforcement_draft",
    providerNetwork:"disabled",
    fetchMode:"disabled_for_provider",
    xhrMode:"disabled_for_provider",
    websocketMode:"disabled_for_provider",
    eventSourceMode:"disabled_for_provider",
    sendBeaconMode:"disabled_for_provider",
    electronNetMode:"disabled_for_provider",
    nodeHttpHttpsMode:"disabled_for_provider",
    dnsLookupMode:"disabled_for_provider",
    redirectFollowMode:"disabled",
    adapterExecution:"disabled",
    redacted:true,
    capabilities:{
      canShowProviderNoNetworkRuntimeGuard:true,
      canBuildGuardDecisionDraft:true,
      canShowBlockedNetworkPrimitives:true,
      canShowBlockedErrorStates:true,
      canShowPolicy:true,
      canShowAuditDraft:true,
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
      canExecuteAdapter:false,
      canRunRealProviderSandbox:false,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canCreateOrder:false,
      canPay:false
    },
    display:{
      title:"provider no-network runtime guard",
      establishedLine:"provider no-network runtime guard：guard 已建立",
      statusLine:"status: blocked",
      modeLine:"mode: no-network enforcement draft",
      providerNetworkLine:"provider network disabled",
      fetchLine:"fetch disabled for provider",
      xhrLine:"XMLHttpRequest disabled for provider",
      websocketLine:"WebSocket disabled for provider",
      eventSourceLine:"EventSource disabled for provider",
      sendBeaconLine:"navigator.sendBeacon disabled for provider",
      electronNetLine:"Electron net disabled for provider",
      nodeHttpLine:"Node http/https disabled for provider",
      dnsLine:"DNS lookup disabled for provider",
      redirectLine:"redirect follow disabled",
      adapterLine:"adapter execution disabled",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildProviderNoNetworkRuntimeGuardDecisionDraft(){
    return {
      version:PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
      fields:["attemptId", "providerId", "providerName", "methodName", "requestIntent", "targetUrlHost", "targetUrlScheme", "networkPrimitive", "guardState", "decision", "blockedReason", "observedAt", "schemaVersion", "redacted: true"],
      guardState:"blocked",
      decision:"blocked",
      blockedReason:"NETWORK_DISABLED",
      redacted:true
    };
  }

  function buildProviderNoNetworkRuntimeGuardAuditDraft(){
    return {
      version:PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
      providerNoNetworkRuntimeGuardAuditDraft:{
        eventType:"PROVIDER_NO_NETWORK_RUNTIME_GUARD_DECISION_DRAFT",
        schemaVersion:PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
        guardState:"blocked",
        decision:"blocked",
        blockedReason:"NETWORK_DISABLED",
        networkPrimitive:"none",
        targetUrlHost:"none",
        providerId:"none",
        methodName:"none",
        observedAt:"none",
        redacted:true
      },
      redacted:true
    };
  }

  function evaluateProviderNetworkAttemptDraft(attempt){
    return {
      version:PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
      attemptId:attempt && attempt.attemptId || "draft_attempt",
      providerId:attempt && attempt.providerId || "none",
      networkPrimitive:attempt && attempt.networkPrimitive || "none",
      guardState:"blocked",
      decision:"blocked",
      blockedReason:"NETWORK_DISABLED",
      canUseNetwork:false,
      redacted:true
    };
  }

  function assertProviderNoNetworkRuntimeGuardSafe(guard){
    const target = guard && typeof guard === "object" ? guard : commerceProviderNoNetworkRuntimeGuardContract;
    const caps = target.capabilities || {};
    if (target.guardStatus !== "blocked") throw new Error("provider no-network runtime guard must remain blocked");
    ["providerNetwork", "redirectFollowMode", "adapterExecution"].forEach(function(key){ if (target[key] !== "disabled") throw new Error(key + " must be disabled"); });
    ["canUseFetch", "canUseXhr", "canUseWebSocket", "canUseEventSource", "canUseSendBeacon", "canUseElectronNet", "canUseNodeHttp", "canUseNodeHttps", "canResolveDns", "canFollowRedirect", "canExecuteAdapter", "canRunRealProviderSandbox", "canReadRealProviderResult", "canDisplayRealPrice", "canDisplayBookingUrl", "canCreateOrder", "canPay"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  function buildProviderNoNetworkRuntimeGuardDisplay(guard){
    const base = Object.assign({}, commerceProviderNoNetworkRuntimeGuardContract, guard && typeof guard === "object" ? guard : {});
    return Object.assign({}, clone(base), {
      decisionObjectDraft:buildProviderNoNetworkRuntimeGuardDecisionDraft(),
      blockedNetworkPrimitives:blockedNetworkPrimitives.slice(),
      blockedErrorStates:blockedErrorStates.slice(),
      currentPolicy:currentPolicy.slice(),
      audit:buildProviderNoNetworkRuntimeGuardAuditDraft(),
      linkage:linkage.slice(),
      evaluation:evaluateProviderNetworkAttemptDraft()
    });
  }

  window.WeishanCommerceProviderNoNetworkRuntimeGuard = {
    PROVIDER_NO_NETWORK_RUNTIME_GUARD_VERSION,
    commerceProviderNoNetworkRuntimeGuardContract,
    buildProviderNoNetworkRuntimeGuardDecisionDraft,
    buildProviderNoNetworkRuntimeGuardAuditDraft,
    evaluateProviderNetworkAttemptDraft,
    assertProviderNoNetworkRuntimeGuardSafe,
    buildProviderNoNetworkRuntimeGuardDisplay
  };
})();
