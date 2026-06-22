;(function () {
  "use strict";
  const PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION = "2.1.49";
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function text(value){ return String(value || "").trim(); }
  function fingerprint(value){ let hash = 0; const raw = text(value); for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0; return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8); }
  function last4(value){ return text(value).slice(-4); }
  function productionKeyRisk(value){ return /(^|[_-])(prod|production|live)([_-]|$)|pk_live|sk_live|secret_live/i.test(text(value)); }
  function hasReadonlyAdapter(input){ return text(input && (input.adapterId || input.adapterState)) === "flight_readonly_provider_adapter_v1" || text(input && input.adapterState) === "read-only" || text(input && input.adapterState) === "readonly"; }
  function endpointDecision(input){
    const api = window.WeishanProviderEndpointAllowlistEnforcement;
    if (api && typeof api.validateEndpointCandidate === "function") return api.validateEndpointCandidate(input || {});
    return { finalDecision:"blocked", blockedReason:"endpoint_allowlist_missing", networkAttemptCount:0, realEndpointConnectCount:0, redacted:true };
  }
  function baseAudit(input, gate){
    return clone({
      eventType:"PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_DRAFT",
      providerCategory:text(input && input.providerCategory) || "flight",
      providerId:text(input && input.providerId) || "flight_provider",
      credentialState:gate.credentialState,
      consentState:gate.consentState,
      endpointAllowlistDecision:gate.endpointAllowlistDecision,
      dryRunDecision:gate.dryRunDecision,
      transport:"simulated",
      realNetwork:false,
      networkAttemptCount:0,
      realEndpointConnectCount:0,
      realCredentialPlaintextDisplayedCount:0,
      realCredentialPlaintextExportedCount:0,
      realPriceDisplayedCount:0,
      bookingUrlDisplayedCount:0,
      paymentAttemptCount:0,
      orderAttemptCount:0,
      identityUploadAttemptCount:0,
      ordinaryResultExposureCount:0,
      redacted:true
    });
  }
  function evaluateSandboxRealKeyDryRunGate(input){
    const raw = input && typeof input === "object" ? input : {};
    const endpointAllowlist = endpointDecision(raw);
    const sandboxKey = raw.sandboxKey || raw.credentialAliasId || raw.keyFingerprint || "";
    const consentState = raw.credentialScopeConsent === true || raw.consentState === "confirmed" || raw.consentState === "draft_ready" ? (raw.credentialScopeConsent === true ? "confirmed" : raw.consentState) : "missing";
    let credentialState = "missing";
    let dryRunDecision = "blocked";
    let blockedReason = "missing sandbox key";
    if (sandboxKey) credentialState = productionKeyRisk(sandboxKey) ? "blocked-production-key-risk" : "sandbox-key-present";
    if (consentState === "missing") blockedReason = "credential consent missing";
    else if (credentialState === "missing") blockedReason = "missing sandbox key";
    else if (credentialState === "blocked-production-key-risk") blockedReason = "production key risk";
    else if (endpointAllowlist.finalDecision !== "allowlisted_sandbox_only") blockedReason = endpointAllowlist.blockedReason || "endpoint not allowlisted";
    else if (!hasReadonlyAdapter(raw)) blockedReason = "read-only adapter missing";
    else { dryRunDecision = "ready"; blockedReason = "none"; }
    const gate = {
      version:PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION,
      status:"sandbox real-key dry-run gate only",
      mode:"controlled sandbox only",
      providerCategory:text(raw.providerCategory) || "flight",
      providerId:text(raw.providerId) || "flight_provider",
      adapterId:text(raw.adapterId) || "flight_readonly_provider_adapter_v1",
      credentialState,
      keyFingerprint:sandboxKey && !productionKeyRisk(sandboxKey) ? fingerprint(sandboxKey) : "",
      keyLast4:sandboxKey && !productionKeyRisk(sandboxKey) ? last4(sandboxKey) : "",
      consentState,
      endpointAllowlistDecision:endpointAllowlist.finalDecision || "blocked",
      endpointAllowlistBlockedReason:endpointAllowlist.blockedReason || "none",
      dryRunDecision,
      blockedReason,
      resultExposurePolicy:"console-only",
      ordinaryResultExposure:"disabled",
      realPriceExposure:"disabled",
      bookingUrlExposure:"disabled",
      productionEndpoint:"disabled",
      productionKey:"disabled",
      payment:false,
      order:false,
      identityUpload:false,
      redacted:true
    };
    gate.auditDraft = baseAudit(raw, gate);
    return clone(gate);
  }
  function runSandboxDryRunGateWithSimulatedTransport(input){
    const gate = evaluateSandboxRealKeyDryRunGate(input || {});
    const pass = gate.dryRunDecision === "ready";
    const result = Object.assign({}, gate, {
      dryRunDecision:pass ? "pass" : "blocked",
      dryRunTransport:"simulated",
      transport:"simulated",
      realNetwork:false,
      networkAttemptCount:0,
      endpointConnectCount:0,
      realEndpointConnectCount:0,
      credentialReadCount:0,
      onlySecureStorageMetadataReadCount:pass ? 1 : 0,
      schemaValidation:pass ? "pass" : "blocked",
      sourceLabelValidation:pass ? "pass" : "blocked",
      priceExposure:"disabled",
      bookingUrlExposure:"disabled",
      resultExposure:"console-only",
      ordinaryResultExposure:"disabled",
      realPriceExposure:"disabled",
      redacted:true
    });
    result.auditDraft = baseAudit(input || {}, result);
    return clone(result);
  }
  function buildSandboxKeySlotState(metadata){
    const raw = metadata && typeof metadata === "object" ? metadata : {};
    return clone({ providerId:"flight_provider_sandbox_key", status:raw.status || "empty", keyFingerprint:raw.keyFingerprint || "", keyLast4:raw.keyLast4 || "", finalDecision:raw.status === "sandbox_saved" ? "sandbox-key-ready" : (raw.status === "blocked_production_key_risk" ? "blocked" : "storage-missing"), redacted:true });
  }
  function assertProviderSandboxRealKeyDryRunGateSafe(value){
    const gate = value && value.status ? value : evaluateSandboxRealKeyDryRunGate(value || {});
    const audit = gate.auditDraft || {};
    if (gate.redacted !== true || audit.redacted !== true) throw new Error("sandbox dry-run gate must stay redacted");
    if (gate.ordinaryResultExposure !== "disabled" || gate.realPriceExposure !== "disabled" || gate.bookingUrlExposure !== "disabled") throw new Error("dry-run result exposure must stay console-only/disabled");
    if (gate.payment !== false || gate.order !== false || gate.identityUpload !== false) throw new Error("write actions must stay false");
    ["networkAttemptCount", "realEndpointConnectCount", "realCredentialPlaintextDisplayedCount", "realCredentialPlaintextExportedCount", "realPriceDisplayedCount", "bookingUrlDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount", "ordinaryResultExposureCount"].forEach((key) => { if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero"); });
    return true;
  }
  window.WeishanProviderSandboxRealKeyDryRunGate = { PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION, evaluateSandboxRealKeyDryRunGate, runSandboxDryRunGateWithSimulatedTransport, buildSandboxKeySlotState, assertProviderSandboxRealKeyDryRunGateSafe };
})();
