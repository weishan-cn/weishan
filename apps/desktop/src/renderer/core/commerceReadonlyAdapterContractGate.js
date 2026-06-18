(function(){
  const READONLY_ADAPTER_CONTRACT_GATE_VERSION = "2.1.9";

  const adapterInterfaceFields = [
    "adapterId", "providerId", "providerName", "adapterVersion", "supportedIntentList", "readonlyMethodList", "blockedMethodList", "requestSchemaVersion", "responseSchemaVersion", "timeoutPolicy", "retryPolicy", "rateLimitPolicy", "redactionPolicy", "auditPolicy", "redacted: true"
  ];
  const readonlyMethods = ["planReadonlySearch", "buildReadonlyRequest", "validateReadonlyRequest", "executeReadonlyDryRun", "normalizeReadonlyResult", "validateResultSchema", "validateSourceLabel", "validatePriceIntegrity", "validateBookingUrlSafety", "emitReadonlyAuditEvent"];
  const forbiddenMethods = ["createBooking", "submitOrder", "checkout", "pay", "cancelPaidOrder", "modifyPassenger", "uploadIdentityDocument", "uploadPassport", "submitBankCard", "writeProviderProfile", "sendRawToken", "sendRawApiKey"];
  const requestFields = ["intentType", "origin", "destination", "date", "sortPreference", "providerId", "sourceType", "credentialAlias", "readonlyOnly", "noBooking", "noPayment", "noOrder", "schemaVersion", "redacted: true"];
  const responseFields = ["resultType", "providerId", "providerName", "sourceUrlHost", "title", "currency", "price", "updatedAt", "readonlyEvidence", "withheldReason", "blockedReason", "schemaVersion", "redacted: true"];
  const errorStates = ["ADAPTER_DISABLED", "NETWORK_DISABLED", "ENDPOINT_NOT_ALLOWED", "CREDENTIAL_NOT_AVAILABLE", "CONSENT_NOT_APPROVED", "PROVIDER_NOT_APPROVED", "SANDBOX_DISABLED", "SCHEMA_INVALID", "SOURCE_LABEL_INVALID", "PRICE_WITHHELD", "BOOKING_URL_FORBIDDEN", "RAW_PAYLOAD_FORBIDDEN", "WRITE_ACTION_FORBIDDEN"];

  const commerceReadonlyAdapterContractGateContract = {
    version:READONLY_ADAPTER_CONTRACT_GATE_VERSION,
    moduleName:"readonly_adapter_contract_gate",
    phase:"readonly_adapter_contract_gate",
    gateStatus:"closed",
    mode:"contract_draft_only",
    adapterExecution:"disabled",
    realNetwork:"disabled",
    realEndpoint:"disabled",
    realProviderSandbox:"disabled",
    realProviderResult:"disabled",
    rawPayloadDisplay:"disabled",
    writeAction:"disabled",
    redacted:true,
    capabilities:{
      canShowReadonlyAdapterContractGate:true,
      canShowAdapterInterfaceDraft:true,
      canShowReadonlyMethodDraft:true,
      canShowForbiddenMethodList:true,
      canShowRequestContractDraft:true,
      canShowResponseContractDraft:true,
      canShowErrorStateDraft:true,
      canShowAuditDraft:true,
      canExecuteAdapter:false,
      canExecuteReadonlyDryRun:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canRunRealProviderSandbox:false,
      canReadRealProviderResult:false,
      canDisplayRawProviderPayload:false,
      canDisplayRealPrice:false,
      canDisplayAvailability:false,
      canDisplayBookingUrl:false,
      canCreateBooking:false,
      canSubmitOrder:false,
      canCheckout:false,
      canPay:false,
      canUploadIdentity:false,
      canSubmitBankCard:false,
      canSendRawToken:false,
      canSendRawApiKey:false
    },
    display:{
      title:"read-only adapter contract gate",
      establishedLine:"read-only adapter contract gate：gate 已建立",
      statusLine:"status: closed",
      modeLine:"mode: contract draft only",
      adapterExecutionLine:"adapter execution disabled",
      networkLine:"real network disabled",
      endpointLine:"real endpoint disabled",
      sandboxLine:"real provider sandbox disabled",
      providerResultLine:"real provider result disabled",
      rawPayloadLine:"raw payload display disabled",
      writeActionLine:"write action disabled",
      dryRunLine:"executeReadonlyDryRun 当前 disabled",
      noNetworkLine:"不执行真实 network",
      noEndpointLine:"不调用真实 provider endpoint",
      noResultLine:"不读取真实 provider result",
      withheldLine:"当前 price 仍 withheld；当前 availability 仍 withheld；当前 bookingUrl 仍 forbidden；rawProviderPayload forbidden",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function buildReadonlyAdapterInterfaceDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, fields:adapterInterfaceFields.slice(), redacted:true }; }
  function buildReadonlyAdapterMethodDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, readonlyMethods:readonlyMethods.slice(), redacted:true }; }
  function buildReadonlyAdapterForbiddenMethodDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, forbiddenMethods:forbiddenMethods.slice(), redacted:true }; }
  function buildReadonlyAdapterRequestContractDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, fields:requestFields.slice(), readonlyOnly:true, noBooking:true, noPayment:true, noOrder:true, redacted:true }; }
  function buildReadonlyAdapterResponseContractDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, fields:responseFields.slice(), priceStatus:"withheld", availabilityStatus:"withheld", bookingUrlStatus:"forbidden", rawProviderPayloadStatus:"forbidden", redacted:true }; }
  function buildReadonlyAdapterErrorStateDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, errorStates:errorStates.slice(), redacted:true }; }
  function buildReadonlyAdapterContractAuditDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, readonlyAdapterContractAuditDraft:{ eventType:"READONLY_ADAPTER_CONTRACT_EVALUATION_DRAFT", schemaVersion:READONLY_ADAPTER_CONTRACT_GATE_VERSION, adapterId:"none", providerId:"none", methodName:"none", gateState:"closed", blockedReason:"readonly_adapter_contract_gate_closed", readonlyOnly:true, redacted:true }, redacted:true }; }
  function evaluateReadonlyAdapterContractDraft(){ return { version:READONLY_ADAPTER_CONTRACT_GATE_VERSION, allowed:false, gateStatus:"closed", decision:"blocked", blockedReason:"readonly_adapter_contract_gate_closed", canExecuteAdapter:false, canUseNetwork:false, canConnectEndpoint:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, redacted:true }; }
  function assertReadonlyAdapterContractGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceReadonlyAdapterContractGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("read-only adapter contract gate must stay closed");
    ["adapterExecution", "realNetwork", "realEndpoint", "realProviderSandbox", "realProviderResult", "rawPayloadDisplay", "writeAction"].forEach(function(key){ if (target[key] !== "disabled") throw new Error(key + " must be disabled"); });
    ["canExecuteAdapter", "canExecuteReadonlyDryRun", "canUseNetwork", "canConnectEndpoint", "canRunRealProviderSandbox", "canReadRealProviderResult", "canDisplayRawProviderPayload", "canDisplayRealPrice", "canDisplayAvailability", "canDisplayBookingUrl", "canCreateBooking", "canSubmitOrder", "canCheckout", "canPay", "canUploadIdentity", "canSubmitBankCard", "canSendRawToken", "canSendRawApiKey"].forEach(function(key){ if (caps[key] !== false) throw new Error(key + " must stay false"); });
    return true;
  }
  function buildReadonlyAdapterContractGateDisplay(gate){
    const base = Object.assign({}, commerceReadonlyAdapterContractGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), { adapterInterfaceDraft:buildReadonlyAdapterInterfaceDraft(), readonlyMethodDraft:buildReadonlyAdapterMethodDraft(), forbiddenMethodDraft:buildReadonlyAdapterForbiddenMethodDraft(), requestContractDraft:buildReadonlyAdapterRequestContractDraft(), responseContractDraft:buildReadonlyAdapterResponseContractDraft(), errorStateDraft:buildReadonlyAdapterErrorStateDraft(), audit:buildReadonlyAdapterContractAuditDraft(), evaluation:evaluateReadonlyAdapterContractDraft() });
  }

  window.WeishanCommerceReadonlyAdapterContractGate = { READONLY_ADAPTER_CONTRACT_GATE_VERSION, commerceReadonlyAdapterContractGateContract, buildReadonlyAdapterInterfaceDraft, buildReadonlyAdapterMethodDraft, buildReadonlyAdapterForbiddenMethodDraft, buildReadonlyAdapterRequestContractDraft, buildReadonlyAdapterResponseContractDraft, buildReadonlyAdapterErrorStateDraft, buildReadonlyAdapterContractAuditDraft, evaluateReadonlyAdapterContractDraft, assertReadonlyAdapterContractGateSafe, buildReadonlyAdapterContractGateDisplay };
})();
