(function(){
  const PROVIDER_GATE_MATRIX_DASHBOARD_VERSION = "2.1.82";

  const gateMatrixRows = [
    "API binding readiness: not ready",
    "secure key storage plan: plan only",
    "secure storage design gate: closed",
    "local secure storage interface draft: draft only",
    "key redaction rules: established",
    "key lifecycle draft: draft only",
    "provider endpoint allowlist gate: closed",
    "readonly provider sandbox gate: closed",
    "readonly provider result schema gate: closed / draft",
    "provider result source label gate: closed / draft",
    "price integrity / taxes / fees gate: closed / draft",
    "bookingUrl domain safety gate: closed / draft",
    "manual provider review workflow: draft only / no provider approved",
    "provider activation readiness gate: blocked / no-go",
    "credential consent scope gate: closed / draft",
    "read-only adapter contract gate: closed / contract draft only",
    "provider no-network runtime guard: blocked",
    "offline provider fixture validation harness: offline only"
  ];

  const noGoReasons = [
    "no provider approved",
    "manual review pending",
    "credential consent not collected",
    "real secure storage disabled",
    "real key input disabled",
    "endpoint connection disabled",
    "real sandbox disabled",
    "real provider result disabled",
    "price display disabled",
    "bookingUrl display disabled",
    "adapter execution disabled",
    "network disabled",
    "order / payment / checkout disabled",
    "identity / passport / bank card flow disabled"
  ];

  const dependencyGraph = [
    "manual review -> activation readiness",
    "credential consent -> adapter contract",
    "secure storage -> credential consent",
    "endpoint allowlist -> no-network guard",
    "sandbox gate -> adapter contract",
    "result schema -> fixture validation",
    "source label -> fixture validation",
    "price integrity -> fixture validation",
    "bookingUrl safety -> fixture validation",
    "adapter contract -> activation readiness",
    "all gates -> providerActivationState no-go"
  ];

  const minimumRequiredBeforeActivation = [
    "manual review",
    "consent",
    "secure storage",
    "endpoint allowlist",
    "sandbox evidence",
    "schema validation",
    "source label validation",
    "price integrity",
    "bookingUrl safety",
    "adapter contract"
  ];

  const commerceProviderGateMatrixDashboardContract = {
    version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
    moduleName:"provider_gate_matrix_dashboard",
    phase:"provider_gate_matrix_dashboard",
    dashboardStatus:"blocked",
    mode:"matrix_only",
    providerActivationState:"no-go",
    realProviderConnection:"disabled",
    realProviderSandbox:"disabled",
    realNetwork:"disabled",
    realPrice:"disabled",
    realBookingUrl:"disabled",
    orderMode:"disabled",
    paymentMode:"disabled",
    checkoutMode:"disabled",
    redacted:true,
    capabilities:{
      canShowProviderGateMatrixDashboard:true,
      canShowGateMatrix:true,
      canShowNoGoReasons:true,
      canShowDependencyGraph:true,
      canShowReadinessScore:true,
      canShowAuditDraft:true,
      canActivateProvider:false,
      canConnectRealProvider:false,
      canRunRealProviderSandbox:false,
      canUseNetwork:false,
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
      title:"provider gate matrix dashboard",
      establishedLine:"provider gate matrix dashboard：dashboard 已建立",
      statusLine:"status: blocked",
      modeLine:"mode: matrix only",
      activationLine:"providerActivationState: no-go",
      providerConnectionLine:"real provider connection disabled",
      sandboxLine:"real provider sandbox disabled",
      networkLine:"real network disabled",
      priceLine:"real price disabled",
      bookingUrlLine:"real bookingUrl disabled",
      orderPaymentLine:"order / payment / checkout disabled",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildProviderGateMatrixRows(){
    return { version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION, gateMatrixRows:gateMatrixRows.slice(), redacted:true };
  }

  function buildProviderGateMatrixNoGoReasons(){
    return { version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION, noGoReasons:noGoReasons.slice(), blockedReason:"provider_gate_matrix_no_go", redacted:true };
  }

  function buildProviderGateDependencyGraphDraft(){
    return { version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION, dependencyGraph:dependencyGraph.slice(), redacted:true };
  }

  function buildProviderReadinessScoreDraft(){
    return {
      version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
      readinessScore:0,
      readinessMax:100,
      scoreReason:"real provider activation disabled",
      scorePolicy:"blocked until all required gates pass",
      minimumRequiredBeforeActivation:minimumRequiredBeforeActivation.slice(),
      redacted:true
    };
  }

  function buildProviderGateMatrixAuditDraft(){
    return {
      version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
      providerGateMatrixAuditDraft:{
        eventType:"PROVIDER_GATE_MATRIX_EVALUATION_DRAFT",
        schemaVersion:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
        matrixState:"blocked",
        providerActivationState:"no-go",
        blockedReason:"provider_gate_matrix_no_go",
        requiredGateCount:gateMatrixRows.length,
        passedGateCount:0,
        failedGateCount:gateMatrixRows.length,
        reviewedAt:"none",
        redacted:true
      },
      redacted:true
    };
  }

  function evaluateProviderGateMatrixDashboard(){
    return {
      version:PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
      allowed:false,
      dashboardStatus:"blocked",
      providerActivationState:"no-go",
      readinessScore:0,
      canUseNetwork:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function assertProviderGateMatrixDashboardSafe(dashboard){
    const target = dashboard && typeof dashboard === "object" ? dashboard : commerceProviderGateMatrixDashboardContract;
    const caps = target.capabilities || {};
    if (target.dashboardStatus !== "blocked") throw new Error("provider gate matrix dashboard must remain blocked");
    if (target.providerActivationState !== "no-go") throw new Error("providerActivationState must remain no-go");
    ["realProviderConnection", "realProviderSandbox", "realNetwork", "realPrice", "realBookingUrl", "orderMode", "paymentMode", "checkoutMode"].forEach(function(key){
      if (target[key] !== "disabled") throw new Error(key + " must be disabled");
    });
    ["canActivateProvider", "canConnectRealProvider", "canRunRealProviderSandbox", "canUseNetwork", "canDisplayRealPrice", "canDisplayBookingUrl", "canCreateOrder", "canPay", "canCheckout", "canUploadIdentity", "canInputApiKey", "canSaveApiKey", "canReadApiKey"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  function buildProviderGateMatrixDashboardDisplay(dashboard){
    const base = Object.assign({}, commerceProviderGateMatrixDashboardContract, dashboard && typeof dashboard === "object" ? dashboard : {});
    return Object.assign({}, clone(base), {
      gateMatrix:buildProviderGateMatrixRows(),
      noGoReasons:buildProviderGateMatrixNoGoReasons(),
      dependencyGraph:buildProviderGateDependencyGraphDraft(),
      readinessScore:buildProviderReadinessScoreDraft(),
      audit:buildProviderGateMatrixAuditDraft(),
      evaluation:evaluateProviderGateMatrixDashboard()
    });
  }

  window.WeishanCommerceProviderGateMatrixDashboard = {
    PROVIDER_GATE_MATRIX_DASHBOARD_VERSION,
    commerceProviderGateMatrixDashboardContract,
    buildProviderGateMatrixRows,
    buildProviderGateMatrixNoGoReasons,
    buildProviderGateDependencyGraphDraft,
    buildProviderReadinessScoreDraft,
    buildProviderGateMatrixAuditDraft,
    evaluateProviderGateMatrixDashboard,
    assertProviderGateMatrixDashboardSafe,
    buildProviderGateMatrixDashboardDisplay
  };
})();
