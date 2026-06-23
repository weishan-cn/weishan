(function(){
  const OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION = "2.1.66";

  const fixtureCases = [
    "missing_provider_id_fixture",
    "missing_source_host_fixture",
    "missing_updated_at_fixture",
    "missing_readonly_evidence_fixture",
    "unknown_host_fixture",
    "short_url_fixture",
    "credential_query_param_fixture",
    "raw_provider_payload_fixture",
    "price_without_currency_fixture",
    "price_without_taxes_fixture",
    "price_without_fees_fixture",
    "estimated_price_fixture",
    "mock_price_fixture",
    "booking_url_detected_fixture",
    "payment_path_detected_fixture",
    "checkout_path_detected_fixture",
    "order_path_detected_fixture",
    "identity_upload_detected_fixture",
    "write_action_detected_fixture"
  ];

  const validationPipeline = [
    "loadOfflineFixtureDescriptor",
    "redactFixtureDescriptor",
    "validateResultSchema",
    "validateSourceLabel",
    "validatePriceIntegrity",
    "validateBookingUrlSafety",
    "validateCredentialConsent",
    "validateAdapterContract",
    "applyNoNetworkRuntimeGuard",
    "emitFixtureValidationAuditEvent"
  ];

  const defaultOutcomes = [
    "missing providerId -> blocked",
    "missing sourceUrlHost -> blocked",
    "missing updatedAt -> blocked",
    "missing readonlyEvidence -> blocked",
    "unknown host -> blocked",
    "short URL -> blocked",
    "credential params -> blocked",
    "raw provider payload -> blocked",
    "missing currency -> price withheld",
    "missing taxes -> price withheld",
    "missing fees -> price withheld",
    "estimated price -> blocked",
    "mock price -> blocked",
    "bookingUrl detected -> blocked",
    "payment path -> blocked",
    "checkout path -> blocked",
    "order path -> blocked",
    "identity upload -> blocked",
    "write action -> blocked"
  ];

  const priceDisplayBoundary = [
    "fixture 可验证 price withheld 规则",
    "fixture 不得在用户结果区展示价格",
    "fixture 不得显示 fake price",
    "fixture 不得显示 mock price",
    "fixture 不得显示 demo price",
    "fixture 不得显示 AI 估价",
    "fixture 不得显示最低价 / 约 ¥xxx / estimated price",
    "fixture 只展示 blocked / withheld / redacted 状态"
  ];

  const linkage = [
    "provider gate matrix dashboard",
    "provider no-network runtime guard",
    "provider activation readiness gate",
    "credential consent scope gate",
    "read-only adapter contract gate",
    "provider result source label gate",
    "price integrity / taxes / fees gate",
    "bookingUrl domain safety gate",
    "readonly provider result schema gate"
  ];

  const commerceOfflineProviderFixtureValidationHarnessContract = {
    version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION,
    moduleName:"offline_provider_fixture_validation_harness",
    phase:"offline_provider_fixture_validation_harness",
    harnessStatus:"offline_only",
    mode:"fixture_validation_draft",
    realProviderFixture:"disabled",
    realProviderResult:"disabled",
    realNetwork:"disabled",
    fakeMockDemoAiPriceDisplay:"disabled",
    bookingUrlDisplay:"disabled",
    rawProviderPayloadDisplay:"disabled",
    unsafeFixturePolicy:"all_blocked",
    redacted:true,
    capabilities:{
      canShowOfflineProviderFixtureValidationHarness:true,
      canLoadOfflineFixtureDescriptor:true,
      canRedactFixtureDescriptor:true,
      canValidateResultSchema:true,
      canValidateSourceLabel:true,
      canValidatePriceIntegrity:true,
      canValidateBookingUrlSafety:true,
      canApplyNoNetworkGuard:true,
      canShowAuditDraft:true,
      canUseRealProviderFixture:false,
      canReadRealProviderResult:false,
      canUseNetwork:false,
      canDisplayFakePrice:false,
      canDisplayMockPrice:false,
      canDisplayDemoPrice:false,
      canDisplayAiEstimatedPrice:false,
      canDisplayRealPrice:false,
      canDisplayAvailability:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canCreateOrder:false,
      canPay:false
    },
    display:{
      title:"offline provider fixture validation harness",
      establishedLine:"offline provider fixture validation harness：harness 已建立",
      statusLine:"status: offline only",
      modeLine:"mode: fixture validation draft",
      realFixtureLine:"real provider fixture disabled",
      realResultLine:"real provider result disabled",
      networkLine:"real network disabled",
      fakePriceLine:"fake/mock/demo/AI price display disabled",
      bookingUrlLine:"bookingUrl display disabled",
      rawPayloadLine:"raw provider payload display disabled",
      unsafeLine:"all unsafe fixtures blocked",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildOfflineProviderFixtureCaseDraft(){
    return { version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION, fixtureCases:fixtureCases.slice(), redacted:true };
  }

  function buildOfflineProviderFixtureValidationPipelineDraft(){
    return { version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION, validationPipeline:validationPipeline.slice(), redacted:true };
  }

  function buildOfflineProviderFixtureOutcomeDraft(){
    return { version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION, fields:["fixtureId", "fixtureType", "expectedDecision", "actualDecision", "withheldReason", "blockedReason", "gateName", "schemaVersion", "redacted: true"], defaultOutcomes:defaultOutcomes.slice(), redacted:true };
  }

  function buildOfflineProviderFixtureValidationAuditDraft(){
    return {
      version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION,
      offlineFixtureValidationAuditDraft:{
        eventType:"OFFLINE_PROVIDER_FIXTURE_VALIDATION_DRAFT",
        schemaVersion:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION,
        fixtureId:"none",
        fixtureType:"offline_descriptor_only",
        gateName:"offline_provider_fixture_validation_harness",
        expectedDecision:"blocked",
        actualDecision:"blocked",
        blockedReason:"offline_fixture_validation_blocked",
        withheldReason:"price_withheld_until_real_provider_allowed",
        redacted:true
      },
      redacted:true
    };
  }

  function validateOfflineProviderFixtureDescriptorDraft(fixture){
    const fixtureId = fixture && fixture.fixtureId || "draft_fixture";
    return {
      version:OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION,
      fixtureId,
      expectedDecision:"blocked",
      actualDecision:"blocked",
      blockedReason:"offline_fixture_validation_blocked",
      withheldReason:"price_withheld_until_real_provider_allowed",
      canUseNetwork:false,
      canDisplayPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function assertOfflineProviderFixtureValidationHarnessSafe(harness){
    const target = harness && typeof harness === "object" ? harness : commerceOfflineProviderFixtureValidationHarnessContract;
    const caps = target.capabilities || {};
    if (target.harnessStatus !== "offline_only") throw new Error("offline provider fixture validation harness must remain offline only");
    ["realProviderFixture", "realProviderResult", "realNetwork", "fakeMockDemoAiPriceDisplay", "bookingUrlDisplay", "rawProviderPayloadDisplay"].forEach(function(key){
      if (target[key] !== "disabled") throw new Error(key + " must be disabled");
    });
    ["canUseRealProviderFixture", "canReadRealProviderResult", "canUseNetwork", "canDisplayFakePrice", "canDisplayMockPrice", "canDisplayDemoPrice", "canDisplayAiEstimatedPrice", "canDisplayRealPrice", "canDisplayAvailability", "canDisplayBookingUrl", "canDisplayRawProviderPayload", "canCreateOrder", "canPay"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  function buildOfflineProviderFixtureValidationHarnessDisplay(harness){
    const base = Object.assign({}, commerceOfflineProviderFixtureValidationHarnessContract, harness && typeof harness === "object" ? harness : {});
    return Object.assign({}, clone(base), {
      fixtureCaseDraft:buildOfflineProviderFixtureCaseDraft(),
      validationPipeline:buildOfflineProviderFixtureValidationPipelineDraft(),
      fixtureOutcomeDraft:buildOfflineProviderFixtureOutcomeDraft(),
      priceDisplayBoundary:priceDisplayBoundary.slice(),
      audit:buildOfflineProviderFixtureValidationAuditDraft(),
      linkage:linkage.slice(),
      evaluation:validateOfflineProviderFixtureDescriptorDraft()
    });
  }

  window.WeishanCommerceOfflineProviderFixtureValidationHarness = {
    OFFLINE_PROVIDER_FIXTURE_VALIDATION_HARNESS_VERSION,
    commerceOfflineProviderFixtureValidationHarnessContract,
    buildOfflineProviderFixtureCaseDraft,
    buildOfflineProviderFixtureValidationPipelineDraft,
    buildOfflineProviderFixtureOutcomeDraft,
    buildOfflineProviderFixtureValidationAuditDraft,
    validateOfflineProviderFixtureDescriptorDraft,
    assertOfflineProviderFixtureValidationHarnessSafe,
    buildOfflineProviderFixtureValidationHarnessDisplay
  };
})();
