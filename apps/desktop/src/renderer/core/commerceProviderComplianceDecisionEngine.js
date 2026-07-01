(function(){
  const PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION = "2.6.0";

  const decisionInputDraftFields = [
    "providerId",
    "providerName",
    "providerType",
    "providerRegion",
    "manualReviewState",
    "credentialConsentState",
    "secureStorageState",
    "endpointAllowlistState",
    "sandboxState",
    "resultSchemaState",
    "sourceLabelState",
    "priceIntegrityState",
    "bookingUrlSafetyState",
    "adapterContractState",
    "noNetworkGuardState",
    "fixtureValidationState",
    "schemaVersion",
    "redacted: true"
  ];

  const decisionOutputDraftFields = [
    "decisionId",
    "providerActivationDecision",
    "priceDisplayDecision",
    "bookingUrlDecision",
    "networkDecision",
    "credentialDecision",
    "adapterExecutionDecision",
    "blockedReasonList",
    "withheldReasonList",
    "redactionState",
    "auditEventList",
    "schemaVersion",
    "redacted: true"
  ];

  const defaultBlockedReasons = [
    "no provider approved",
    "manual review pending",
    "credential consent not approved",
    "real secure storage disabled",
    "real key input disabled",
    "endpoint connection disabled",
    "real sandbox disabled",
    "real provider result disabled",
    "source label not trusted",
    "price integrity not complete",
    "bookingUrl safety not passed",
    "adapter execution disabled",
    "network disabled",
    "raw provider payload forbidden",
    "order / payment / checkout disabled",
    "identity / passport / bank card flow disabled"
  ];

  const defaultWithheldReasons = [
    "price source not trusted",
    "price integrity not complete",
    "taxes and fees not verified",
    "readonly provider result unavailable",
    "bookingUrl safety not passed"
  ];

  const decisionErrorCodes = [
    "PROVIDER_ACTIVATION_NO_GO",
    "MANUAL_REVIEW_PENDING",
    "CONSENT_NOT_APPROVED",
    "SECURE_STORAGE_DISABLED",
    "CREDENTIAL_INPUT_DISABLED",
    "ENDPOINT_CONNECTION_DISABLED",
    "SANDBOX_DISABLED",
    "PROVIDER_RESULT_DISABLED",
    "SOURCE_LABEL_UNTRUSTED",
    "PRICE_WITHHELD",
    "BOOKING_URL_FORBIDDEN",
    "ADAPTER_EXECUTION_DISABLED",
    "NETWORK_DISABLED",
    "RAW_PAYLOAD_FORBIDDEN",
    "WRITE_ACTION_FORBIDDEN"
  ];

  const defaultDecision = {
    providerActivationDecision:"no-go",
    priceDisplayDecision:"withheld",
    bookingUrlDecision:"forbidden",
    networkDecision:"blocked",
    credentialDecision:"blocked",
    adapterExecutionDecision:"disabled",
    rawProviderPayloadDecision:"forbidden",
    orderPaymentCheckoutDecision:"disabled",
    identityBankCardFlowDecision:"disabled"
  };

  const commerceProviderComplianceDecisionEngineContract = {
    version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
    moduleName:"provider_compliance_decision_engine",
    phase:"provider_compliance_decision_engine",
    engineStatus:"blocked",
    mode:"offline_decision_only",
    sideEffects:"none",
    realProviderConnection:"disabled",
    realNetwork:"disabled",
    realCredentialRead:"disabled",
    realPriceDisplay:"disabled",
    realBookingUrl:"disabled",
    providerActivationDecision:"no-go",
    redacted:true,
    capabilities:{
      canEvaluateStaticProviderState:true,
      canBuildDecisionReport:true,
      canEmitRedactedAuditDraft:true,
      canUseNetwork:false,
      canReadCredential:false,
      canReadEnvironmentSecret:false,
      canReadEnvFile:false,
      canWriteBrowserStorage:false,
      canUseKeychain:false,
      canUseSafeStorage:false,
      canConnectEndpoint:false,
      canRunProviderSandbox:false,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    },
    display:{
      title:"provider compliance decision engine",
      establishedLine:"provider compliance decision engine：engine 已建立",
      statusLine:"status: blocked",
      modeLine:"mode: offline decision only",
      sideEffectsLine:"sideEffects: none",
      providerConnectionLine:"real provider connection disabled",
      networkLine:"real network disabled",
      credentialLine:"real credential read disabled",
      priceLine:"real price display disabled",
      bookingUrlLine:"real bookingUrl disabled",
      activationLine:"providerActivationDecision: no-go",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function normalizeInput(input){
    return Object.assign({
      providerId:"offline-provider-disabled",
      providerName:"Offline Provider Disabled",
      providerType:"flight",
      providerRegion:"global",
      manualReviewState:"pending",
      credentialConsentState:"not_approved",
      secureStorageState:"disabled",
      endpointAllowlistState:"closed",
      sandboxState:"disabled",
      resultSchemaState:"draft",
      sourceLabelState:"untrusted",
      priceIntegrityState:"incomplete",
      bookingUrlSafetyState:"not_passed",
      adapterContractState:"disabled",
      noNetworkGuardState:"blocked",
      fixtureValidationState:"offline_only",
      schemaVersion:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      redacted:true
    }, input && typeof input === "object" ? input : {});
  }

  function evaluateProviderComplianceReadiness(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      providerName:target.providerName,
      providerActivationDecision:"no-go",
      readinessState:"blocked",
      blockedReasonList:defaultBlockedReasons.slice(),
      redacted:true
    };
  }

  function evaluateProviderGateDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      decision:"blocked",
      providerActivationDecision:"no-go",
      blockedReason:"PROVIDER_ACTIVATION_NO_GO",
      blockedReasonList:defaultBlockedReasons.slice(),
      redacted:true
    };
  }

  function evaluateCredentialConsentDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      credentialDecision:"blocked",
      blockedReason:"CONSENT_NOT_APPROVED",
      canInputCredential:false,
      canSaveCredential:false,
      canReadCredential:false,
      canTestConnection:false,
      redacted:true
    };
  }

  function evaluateAdapterContractDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      adapterExecutionDecision:"disabled",
      blockedReason:"ADAPTER_EXECUTION_DISABLED",
      canExecuteAdapter:false,
      canUseNetwork:false,
      canReadRealProviderResult:false,
      redacted:true
    };
  }

  function evaluatePriceDisplayDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      priceDisplayDecision:"withheld",
      withheldReason:"PRICE_WITHHELD",
      withheldReasonList:defaultWithheldReasons.slice(),
      canDisplayRealPrice:false,
      redacted:true
    };
  }

  function evaluateBookingUrlDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      bookingUrlDecision:"forbidden",
      blockedReason:"BOOKING_URL_FORBIDDEN",
      canDisplayBookingUrl:false,
      canOpenBookingUrl:false,
      redacted:true
    };
  }

  function evaluateNetworkAttemptDecision(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerId:target.providerId,
      networkDecision:"blocked",
      blockedReason:"NETWORK_DISABLED",
      canUseNetwork:false,
      redacted:true
    };
  }

  function buildProviderComplianceDecisionAuditDraft(input){
    const target = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      providerComplianceDecisionAuditDraft:{
        eventType:"PROVIDER_COMPLIANCE_DECISION_DRAFT",
        schemaVersion:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
        decisionId:"offline_decision_no_go",
        providerId:target.providerId,
        providerName:target.providerName,
        providerActivationDecision:"no-go",
        networkDecision:"blocked",
        priceDisplayDecision:"withheld",
        bookingUrlDecision:"forbidden",
        blockedReasonList:defaultBlockedReasons.slice(),
        withheldReasonList:defaultWithheldReasons.slice(),
        redacted:true
      },
      redacted:true
    };
  }

  function buildProviderComplianceDecisionReport(input){
    const normalized = normalizeInput(input);
    return {
      version:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
      contract:clone(commerceProviderComplianceDecisionEngineContract),
      decisionInputDraft:{ fields:decisionInputDraftFields.slice(), input:normalized, redacted:true },
      decisionOutputDraft:{
        fields:decisionOutputDraftFields.slice(),
        decisionId:"offline_decision_no_go",
        providerActivationDecision:"no-go",
        priceDisplayDecision:"withheld",
        bookingUrlDecision:"forbidden",
        networkDecision:"blocked",
        credentialDecision:"blocked",
        adapterExecutionDecision:"disabled",
        blockedReasonList:defaultBlockedReasons.slice(),
        withheldReasonList:defaultWithheldReasons.slice(),
        redactionState:"redacted",
        auditEventList:["providerComplianceDecisionAuditDraft"],
        schemaVersion:PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
        redacted:true
      },
      defaultDecision:clone(defaultDecision),
      blockedReasonList:defaultBlockedReasons.slice(),
      withheldReasonList:defaultWithheldReasons.slice(),
      decisionErrorCodes:decisionErrorCodes.slice(),
      audit:buildProviderComplianceDecisionAuditDraft(normalized),
      evaluations:{
        readiness:evaluateProviderComplianceReadiness(normalized),
        providerGate:evaluateProviderGateDecision(normalized),
        credential:evaluateCredentialConsentDecision(normalized),
        adapter:evaluateAdapterContractDecision(normalized),
        price:evaluatePriceDisplayDecision(normalized),
        bookingUrl:evaluateBookingUrlDecision(normalized),
        network:evaluateNetworkAttemptDecision(normalized)
      },
      redacted:true
    };
  }

  function assertProviderComplianceDecisionEngineSafe(report){
    const target = report && typeof report === "object" ? report : buildProviderComplianceDecisionReport();
    const contract = target.contract || commerceProviderComplianceDecisionEngineContract;
    const caps = contract.capabilities || {};
    if (contract.engineStatus !== "blocked") throw new Error("provider compliance decision engine must stay blocked");
    if (contract.mode !== "offline_decision_only") throw new Error("provider compliance decision engine must stay offline decision only");
    if (contract.sideEffects !== "none") throw new Error("provider compliance decision engine sideEffects must stay none");
    ["realProviderConnection", "realNetwork", "realCredentialRead", "realPriceDisplay", "realBookingUrl"].forEach(function(key){
      if (contract[key] !== "disabled") throw new Error(key + " must stay disabled");
    });
    ["canUseNetwork", "canReadCredential", "canReadEnvironmentSecret", "canReadEnvFile", "canWriteBrowserStorage", "canUseKeychain", "canUseSafeStorage", "canConnectEndpoint", "canRunProviderSandbox", "canReadRealProviderResult", "canDisplayRealPrice", "canDisplayBookingUrl", "canCreateOrder", "canPay", "canUploadIdentity"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    if ((target.defaultDecision || {}).providerActivationDecision !== "no-go") throw new Error("providerActivationDecision must stay no-go");
    return true;
  }

  window.WeishanCommerceProviderComplianceDecisionEngine = {
    PROVIDER_COMPLIANCE_DECISION_ENGINE_VERSION,
    commerceProviderComplianceDecisionEngineContract,
    decisionInputDraftFields,
    decisionOutputDraftFields,
    defaultBlockedReasons,
    defaultWithheldReasons,
    decisionErrorCodes,
    evaluateProviderComplianceReadiness,
    evaluateProviderGateDecision,
    evaluateCredentialConsentDecision,
    evaluateAdapterContractDecision,
    evaluatePriceDisplayDecision,
    evaluateBookingUrlDecision,
    evaluateNetworkAttemptDecision,
    buildProviderComplianceDecisionAuditDraft,
    buildProviderComplianceDecisionReport,
    assertProviderComplianceDecisionEngineSafe
  };
})();
