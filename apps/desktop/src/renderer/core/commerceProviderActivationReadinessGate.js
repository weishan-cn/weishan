(function(){
  const PROVIDER_ACTIVATION_READINESS_GATE_VERSION = "4.0.8";

  const prerequisiteGateSummary = [
    "result schema gate: established / closed / draft",
    "provider source label gate: established / closed / draft",
    "price integrity / taxes / fees gate: established / closed / draft",
    "bookingUrl domain safety gate: established / closed / draft",
    "manual provider review workflow: established / draft only / no provider approved",
    "provider endpoint allowlist gate: established / closed",
    "readonly provider sandbox gate: established / closed",
    "API binding readiness: not ready",
    "secure storage design gate: closed",
    "local secure storage interface draft: draft only",
    "key redaction rules: established",
    "key lifecycle draft: draft only"
  ];

  const blockedReasons = [
    "no provider approved",
    "manual review pending",
    "readonly permission not granted",
    "credential consent not collected",
    "secure storage real implementation disabled",
    "real key input disabled",
    "endpoint connection disabled",
    "real sandbox disabled",
    "real provider result disabled",
    "price display disabled",
    "bookingUrl display disabled",
    "payment / checkout / order disabled",
    "identity / passport / bank card flow disabled"
  ];

  const activationChecklist = [
    "provider manual review approved",
    "terms allow readonly query",
    "privacy policy reviewed",
    "credential scope approved",
    "secure storage implementation approved",
    "endpoint allowlist approved",
    "sandbox evidence approved",
    "result schema validation passed",
    "source label validation passed",
    "price integrity validation passed",
    "bookingUrl safety validation passed",
    "audit logging approved",
    "redaction rules active",
    "manual rollback plan ready"
  ];

  const activationDecisionFields = [
    "providerId",
    "providerName",
    "providerType",
    "providerRegion",
    "activationState",
    "activationDecision",
    "blockedReason",
    "requiredGateList",
    "passedGateList",
    "failedGateList",
    "reviewedAt",
    "reviewerRole",
    "schemaVersion",
    "redacted: true"
  ];

  const linkage = [
    "manual provider review workflow",
    "bookingUrl domain safety gate",
    "price integrity / taxes / fees gate",
    "provider result source label gate",
    "只读 provider result schema gate",
    "只读 provider sandbox gate",
    "provider endpoint allowlist gate",
    "credential consent scope gate",
    "read-only adapter contract gate",
    "API 绑定准备状态",
    "密钥脱敏规则",
    "本机安全存储"
  ];

  const commerceProviderActivationReadinessGateContract = {
    version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION,
    moduleName:"provider_activation_readiness_gate",
    phase:"provider_activation_readiness_gate",
    gateStatus:"blocked",
    mode:"readiness_only",
    activationGoNoGo:"no-go",
    providerActivation:"disabled",
    realProviderConnection:"disabled",
    realProviderSandbox:"disabled",
    realPrice:"disabled",
    realBookingUrl:"disabled",
    orderMode:"disabled",
    paymentMode:"disabled",
    checkoutMode:"disabled",
    redacted:true,
    capabilities:{
      canShowProviderActivationReadinessGate:true,
      canSummarizePrerequisiteGates:true,
      canShowBlockedReasons:true,
      canShowActivationChecklistDraft:true,
      canShowActivationDecisionDraft:true,
      canShowAuditDraft:true,
      canActivateProvider:false,
      canConnectRealProvider:false,
      canRunRealProviderSandbox:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canCheckout:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    },
    display:{
      title:"provider activation readiness gate",
      establishedLine:"provider activation readiness gate：gate 已建立",
      statusLine:"status: blocked",
      modeLine:"mode: readiness only",
      providerActivationLine:"provider activation disabled",
      providerConnectionLine:"real provider connection disabled",
      sandboxLine:"real provider sandbox disabled",
      priceLine:"real price disabled",
      bookingUrlLine:"real bookingUrl disabled",
      orderPaymentLine:"order / payment / checkout disabled",
      decisionLine:"activationGoNoGo: no-go",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildProviderActivationPrerequisiteGateSummary(){
    return { version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION, prerequisiteGateSummary:prerequisiteGateSummary.slice(), redacted:true };
  }

  function buildProviderActivationBlockedReasonsDraft(){
    return { version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION, blockedReasons:blockedReasons.slice(), currentBlockedReason:"provider_activation_readiness_blocked", redacted:true };
  }

  function buildProviderActivationChecklistDraft(){
    return { version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION, activationChecklist:activationChecklist.slice(), currentStatus:"all_pending", redacted:true };
  }

  function buildProviderActivationDecisionObjectDraft(){
    return { version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION, fields:activationDecisionFields.slice(), activationDecision:"no-go", redacted:true };
  }

  function buildProviderActivationReadinessAuditDraft(){
    return {
      version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION,
      providerActivationReadinessAuditDraft:{
        eventType:"PROVIDER_ACTIVATION_READINESS_EVALUATION_DRAFT",
        schemaVersion:PROVIDER_ACTIVATION_READINESS_GATE_VERSION,
        gateState:"blocked",
        activationDecision:"no-go",
        blockedReason:"provider_activation_readiness_blocked",
        providerId:"none",
        providerName:"none",
        reviewedAt:"none",
        redacted:true
      },
      redacted:true
    };
  }

  function evaluateProviderActivationReadinessDraft(){
    return {
      version:PROVIDER_ACTIVATION_READINESS_GATE_VERSION,
      allowed:false,
      gateStatus:"blocked",
      activationDecision:"no-go",
      blockedReason:"provider_activation_readiness_blocked",
      canActivateProvider:false,
      canConnectRealProvider:false,
      canUseNetwork:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function assertProviderActivationReadinessGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceProviderActivationReadinessGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "blocked") throw new Error("provider activation readiness gate must remain blocked");
    if (target.activationGoNoGo !== "no-go") throw new Error("activationGoNoGo must remain no-go");
    ["providerActivation", "realProviderConnection", "realProviderSandbox", "realPrice", "realBookingUrl", "orderMode", "paymentMode", "checkoutMode"].forEach(function(key){
      if (target[key] !== "disabled") throw new Error(key + " must be disabled");
    });
    ["canActivateProvider", "canConnectRealProvider", "canRunRealProviderSandbox", "canUseNetwork", "canConnectEndpoint", "canReadRealProviderResult", "canDisplayRealPrice", "canDisplayBookingUrl", "canCreateOrder", "canPay", "canCheckout", "canUploadIdentity", "canInputApiKey", "canSaveApiKey", "canReadApiKey"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  function buildProviderActivationReadinessGateDisplay(gate){
    const base = Object.assign({}, commerceProviderActivationReadinessGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), {
      prerequisiteGateSummary:buildProviderActivationPrerequisiteGateSummary(),
      blockedReasons:buildProviderActivationBlockedReasonsDraft(),
      activationChecklist:buildProviderActivationChecklistDraft(),
      activationDecisionObjectDraft:buildProviderActivationDecisionObjectDraft(),
      audit:buildProviderActivationReadinessAuditDraft(),
      linkage:linkage.slice(),
      evaluation:evaluateProviderActivationReadinessDraft()
    });
  }

  window.WeishanCommerceProviderActivationReadinessGate = {
    PROVIDER_ACTIVATION_READINESS_GATE_VERSION,
    commerceProviderActivationReadinessGateContract,
    buildProviderActivationPrerequisiteGateSummary,
    buildProviderActivationBlockedReasonsDraft,
    buildProviderActivationChecklistDraft,
    buildProviderActivationDecisionObjectDraft,
    buildProviderActivationReadinessAuditDraft,
    evaluateProviderActivationReadinessDraft,
    assertProviderActivationReadinessGateSafe,
    buildProviderActivationReadinessGateDisplay
  };
})();
