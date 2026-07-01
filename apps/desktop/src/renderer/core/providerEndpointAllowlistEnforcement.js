;(function () {
  "use strict";
  const PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION = "3.2.0";
  const CREDENTIAL_QUERY_PARAMS = ["api_key", "apikey", "apiKey", "key", "token", "access_token", "refresh_token", "client_secret", "clientSecret", "authorization", "password", "secret"];
  const BLOCKED_PATH_PATTERNS = ["payment", "payments", "order", "orders", "checkout", "booking", "identity", "passport", "bank-card", "bankcard", "card", "upload"];
  const ALLOWLIST = {
    flight_provider: {
      providerCategory:"flight",
      providerId:"flight_provider",
      allowedSandboxHosts:["provider-sandbox.invalid", "flight-provider-sandbox.invalid", "sandbox.invalid"],
      allowedSandboxPaths:["/sandbox/search", "/sandbox/dry-run"],
      blockedProductionHosts:["production-provider.invalid", "provider-production.invalid", "live-provider.invalid"],
      blockedPathPatterns:BLOCKED_PATH_PATTERNS,
      requiredHttps:true,
      allowRedirect:false,
      allowCredentialQueryParams:false,
      mode:"sandbox_allowlist_only",
      finalDecision:"allowlisted_sandbox_only",
      redacted:true
    }
  };
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function text(value){ return String(value || "").trim(); }
  function redactedEndpoint(value){
    const raw = text(value);
    if (!raw) return "";
    return raw.replace(/[?].*$/, "?[REDACTED_CREDENTIAL_PARAMS]").replace(/(api[_-]?key|token|secret|password|authorization)=([^&]+)/ig, "$1=[REDACTED_CREDENTIAL_PARAMS]");
  }
  function isIpHost(host){ return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[0-9a-f:]+\]$/i.test(host); }
  function isInternalHost(host){ return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host) || /(^|\.)(local|internal|lan|home|corp)$/i.test(host); }
  function hasCredentialQueryParams(url){ return CREDENTIAL_QUERY_PARAMS.some((key) => url.searchParams.has(key)); }
  function hasBlockedPath(pathname, rule){ return (rule.blockedPathPatterns || BLOCKED_PATH_PATTERNS).some((part) => new RegExp("(^|[-_/])" + part + "($|[-_/])", "i").test(pathname)); }
  function isProductionHost(host, rule){ return (rule.blockedProductionHosts || []).includes(host) || /(^|[-.])(prod|production|live)([-.]|$)/i.test(host); }
  function buildAuditDraft(input, decision){
    const safe = decision || {};
    return clone({
      eventType:"ENDPOINT_ALLOWLIST_ENFORCEMENT_V1_DRAFT",
      providerCategory:safe.providerCategory || "flight",
      providerId:safe.providerId || "flight_provider",
      endpointCandidateRedacted:redactedEndpoint(input && input.endpointCandidate),
      allowlistDecision:safe.finalDecision || "blocked",
      blockedReason:safe.blockedReason || "none",
      arbitraryEndpointBlockedCount:safe.blockedReason === "arbitrary_endpoint_disabled" ? 1 : 0,
      productionEndpointBlockedCount:safe.blockedReason === "production_endpoint_disabled" ? 1 : 0,
      credentialQueryParamBlockedCount:safe.blockedReason === "credential_query_params_disabled" ? 1 : 0,
      redirectBlockedCount:safe.blockedReason === "redirect_disabled" ? 1 : 0,
      paymentEndpointBlockedCount:/payment|checkout/.test(safe.blockedReason || "") ? 1 : 0,
      orderEndpointBlockedCount:/order|booking/.test(safe.blockedReason || "") ? 1 : 0,
      identityUploadEndpointBlockedCount:/identity|passport|bank|card|upload/.test(safe.blockedReason || "") ? 1 : 0,
      realEndpointConnectCount:0,
      networkAttemptCount:0,
      redacted:true
    });
  }
  function blockedResult(input, reason, extra){
    const raw = input && typeof input === "object" ? input : {};
    const rule = ALLOWLIST[raw.providerId || "flight_provider"] || ALLOWLIST.flight_provider;
    const result = Object.assign({
      version:PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION,
      status:"endpoint allowlist enforcement only",
      mode:"sandbox allowlist only",
      providerCategory:rule.providerCategory,
      providerId:rule.providerId,
      matchedProvider:rule.providerId,
      matchedHost:"",
      matchedPath:"",
      blockedReason:reason,
      redirectPolicy:"disabled",
      credentialQueryParamPolicy:"disabled",
      productionEndpoint:"disabled",
      arbitraryEndpoint:"disabled",
      paymentOrderCheckoutEndpoint:"disabled",
      identityUploadEndpoint:"disabled",
      finalDecision:"blocked",
      realEndpointConnectCount:0,
      networkAttemptCount:0,
      redacted:true
    }, extra || {});
    result.auditDraft = buildAuditDraft(raw, result);
    return clone(result);
  }
  function validateEndpointCandidate(input){
    const raw = input && typeof input === "object" ? input : { endpointCandidate:input };
    const rule = ALLOWLIST[raw.providerId || "flight_provider"] || ALLOWLIST.flight_provider;
    const endpointCandidate = text(raw.endpointCandidate || "https://provider-sandbox.invalid/sandbox/dry-run");
    let url;
    try { url = new URL(endpointCandidate); }
    catch (_) { return blockedResult(raw, "arbitrary_endpoint_disabled", { endpointCandidateRedacted:redactedEndpoint(endpointCandidate) }); }
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname || "/";
    if (rule.requiredHttps && url.protocol !== "https:") return blockedResult(raw, "http_endpoint_disabled", { matchedHost:host, matchedPath:pathname });
    if (isIpHost(host)) return blockedResult(raw, "ip_endpoint_disabled", { matchedHost:host, matchedPath:pathname });
    if (isInternalHost(host)) return blockedResult(raw, "internal_host_disabled", { matchedHost:host, matchedPath:pathname });
    if (isProductionHost(host, rule)) return blockedResult(raw, "production_endpoint_disabled", { matchedHost:host, matchedPath:pathname });
    if (hasCredentialQueryParams(url)) return blockedResult(raw, "credential_query_params_disabled", { matchedHost:host, matchedPath:pathname });
    if (hasBlockedPath(pathname, rule)) {
      const lower = pathname.toLowerCase();
      const reason = /identity|passport|bank|card|upload/.test(lower) ? "identity_upload_endpoint_disabled" : (/payment|checkout/.test(lower) ? "payment_checkout_endpoint_disabled" : "order_booking_endpoint_disabled");
      return blockedResult(raw, reason, { matchedHost:host, matchedPath:pathname });
    }
    if (raw.redirectTarget && rule.allowRedirect !== true) return blockedResult(raw, "redirect_disabled", { matchedHost:host, matchedPath:pathname });
    const hostAllowed = rule.allowedSandboxHosts.includes(host);
    const pathAllowed = rule.allowedSandboxPaths.includes(pathname);
    if (!hostAllowed || !pathAllowed) return blockedResult(raw, "arbitrary_endpoint_disabled", { matchedHost:host, matchedPath:pathname });
    const result = {
      version:PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION,
      status:"endpoint allowlist enforcement only",
      mode:"sandbox allowlist only",
      providerCategory:rule.providerCategory,
      providerId:rule.providerId,
      matchedProvider:rule.providerId,
      matchedHost:host,
      matchedPath:pathname,
      blockedReason:"none",
      redirectPolicy:"disabled",
      credentialQueryParamPolicy:"disabled",
      productionEndpoint:"disabled",
      arbitraryEndpoint:"disabled",
      paymentOrderCheckoutEndpoint:"disabled",
      identityUploadEndpoint:"disabled",
      finalDecision:"allowlisted_sandbox_only",
      realEndpointConnectCount:0,
      networkAttemptCount:0,
      redacted:true
    };
    result.auditDraft = buildAuditDraft(raw, result);
    return clone(result);
  }
  function buildEndpointAllowlistEnforcementDraft(providerId){
    const rule = ALLOWLIST[providerId || "flight_provider"] || ALLOWLIST.flight_provider;
    const example = validateEndpointCandidate({ providerId:rule.providerId, endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run" });
    return clone({
      version:PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION,
      status:"endpoint allowlist enforcement only",
      mode:"sandbox allowlist only",
      productionEndpoint:"disabled",
      arbitraryEndpoint:"disabled",
      redirect:"disabled",
      credentialQueryParams:"disabled",
      paymentOrderCheckoutEndpoint:"disabled",
      identityUploadEndpoint:"disabled",
      finalDecision:"no-go / sandbox-only",
      flightProviderAllowlistDraft:rule,
      validationExample:example,
      auditDraft:example.auditDraft,
      redacted:true
    });
  }
  function assertEndpointAllowlistEnforcementSafe(value){
    const decision = value && value.finalDecision ? value : validateEndpointCandidate(value || {});
    if (decision.redacted !== true) throw new Error("endpoint allowlist decision must stay redacted");
    if (decision.networkAttemptCount !== 0 || decision.realEndpointConnectCount !== 0) throw new Error("endpoint allowlist must not connect network");
    const audit = decision.auditDraft || buildAuditDraft({}, decision);
    if (audit.networkAttemptCount !== 0 || audit.realEndpointConnectCount !== 0) throw new Error("endpoint allowlist audit must keep counters zero");
    if (decision.finalDecision === "allowlisted_sandbox_only" && decision.matchedHost !== "provider-sandbox.invalid" && decision.matchedHost !== "flight-provider-sandbox.invalid" && decision.matchedHost !== "sandbox.invalid") throw new Error("only sandbox placeholder hosts are allowed");
    return true;
  }
  window.WeishanProviderEndpointAllowlistEnforcement = { PROVIDER_ENDPOINT_ALLOWLIST_ENFORCEMENT_VERSION, ALLOWLIST, validateEndpointCandidate, buildEndpointAllowlistEnforcementDraft, buildAuditDraft, assertEndpointAllowlistEnforcementSafe };
})();
