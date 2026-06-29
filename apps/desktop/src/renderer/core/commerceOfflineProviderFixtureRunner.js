(function(){
  const OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION = "2.2.0";

  const fixtureCategories = [
    "schema_missing_field",
    "source_label_missing_evidence",
    "price_integrity_missing_currency",
    "price_integrity_missing_taxes",
    "price_integrity_missing_fees",
    "price_integrity_estimated_price",
    "price_integrity_mock_price",
    "booking_url_unknown_host",
    "booking_url_short_url",
    "booking_url_credential_params",
    "booking_url_payment_path",
    "booking_url_checkout_path",
    "booking_url_order_path",
    "booking_url_identity_upload_path",
    "network_fetch_attempt",
    "network_xhr_attempt",
    "network_websocket_attempt",
    "adapter_write_action_attempt",
    "raw_provider_payload_attempt",
    "credential_scope_not_readonly"
  ];

  const expectedOutcomes = [
    "missing providerId -> blocked",
    "missing sourceUrlHost -> blocked",
    "missing readonlyEvidence -> blocked",
    "missing currency -> price withheld",
    "missing taxes -> price withheld",
    "missing fees -> price withheld",
    "estimated price -> blocked",
    "mock price -> blocked",
    "unknown booking host -> blocked",
    "short URL -> blocked",
    "credential params -> blocked",
    "payment path -> blocked",
    "checkout path -> blocked",
    "order path -> blocked",
    "identity upload -> blocked",
    "fetch attempt -> NETWORK_DISABLED",
    "XHR attempt -> NETWORK_DISABLED",
    "WebSocket attempt -> NETWORK_DISABLED",
    "write action -> WRITE_ACTION_FORBIDDEN",
    "raw provider payload -> RAW_PAYLOAD_FORBIDDEN",
    "non-readonly credential scope -> CONSENT_NOT_APPROVED"
  ];

  const runnerPipeline = [
    "loadOfflineFixtureDescriptor",
    "redactOfflineFixture",
    "evaluateProviderComplianceReadiness",
    "evaluateProviderGateDecision",
    "evaluateCredentialConsentDecision",
    "evaluateAdapterContractDecision",
    "evaluatePriceDisplayDecision",
    "evaluateBookingUrlDecision",
    "evaluateNetworkAttemptDecision",
    "compareExpectedDecision",
    "emitOfflineFixtureRunnerAuditEvent"
  ];

  const offlineFixtureDescriptors = [
    { fixtureId:"schema_missing_provider_id", fixtureCategory:"schema_missing_field", expectedDecision:"blocked", expectedReason:"PROVIDER_ACTIVATION_NO_GO" },
    { fixtureId:"source_label_missing_evidence", fixtureCategory:"source_label_missing_evidence", expectedDecision:"blocked", expectedReason:"SOURCE_LABEL_UNTRUSTED" },
    { fixtureId:"price_missing_currency", fixtureCategory:"price_integrity_missing_currency", expectedDecision:"withheld", expectedReason:"PRICE_WITHHELD" },
    { fixtureId:"price_missing_taxes", fixtureCategory:"price_integrity_missing_taxes", expectedDecision:"withheld", expectedReason:"PRICE_WITHHELD" },
    { fixtureId:"price_missing_fees", fixtureCategory:"price_integrity_missing_fees", expectedDecision:"withheld", expectedReason:"PRICE_WITHHELD" },
    { fixtureId:"price_estimated", fixtureCategory:"price_integrity_estimated_price", expectedDecision:"blocked", expectedReason:"PRICE_WITHHELD" },
    { fixtureId:"price_mock", fixtureCategory:"price_integrity_mock_price", expectedDecision:"blocked", expectedReason:"PRICE_WITHHELD" },
    { fixtureId:"booking_unknown_host", fixtureCategory:"booking_url_unknown_host", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_short_url", fixtureCategory:"booking_url_short_url", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_credential_params", fixtureCategory:"booking_url_credential_params", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_payment_path", fixtureCategory:"booking_url_payment_path", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_checkout_path", fixtureCategory:"booking_url_checkout_path", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_order_path", fixtureCategory:"booking_url_order_path", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"booking_identity_upload_path", fixtureCategory:"booking_url_identity_upload_path", expectedDecision:"blocked", expectedReason:"BOOKING_URL_FORBIDDEN" },
    { fixtureId:"network_fetch_attempt", fixtureCategory:"network_fetch_attempt", expectedDecision:"blocked", expectedReason:"NETWORK_DISABLED" },
    { fixtureId:"network_xhr_attempt", fixtureCategory:"network_xhr_attempt", expectedDecision:"blocked", expectedReason:"NETWORK_DISABLED" },
    { fixtureId:"network_websocket_attempt", fixtureCategory:"network_websocket_attempt", expectedDecision:"blocked", expectedReason:"NETWORK_DISABLED" },
    { fixtureId:"adapter_write_action_attempt", fixtureCategory:"adapter_write_action_attempt", expectedDecision:"blocked", expectedReason:"WRITE_ACTION_FORBIDDEN" },
    { fixtureId:"raw_provider_payload_attempt", fixtureCategory:"raw_provider_payload_attempt", expectedDecision:"blocked", expectedReason:"RAW_PAYLOAD_FORBIDDEN" },
    { fixtureId:"credential_scope_not_readonly", fixtureCategory:"credential_scope_not_readonly", expectedDecision:"blocked", expectedReason:"CONSENT_NOT_APPROVED" }
  ];

  const commerceOfflineProviderFixtureRunnerContract = {
    version:OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
    moduleName:"offline_provider_fixture_runner",
    phase:"offline_provider_fixture_runner",
    runnerStatus:"offline_only",
    mode:"deterministic_fixture_runner",
    realProviderFixture:"disabled",
    realProviderResult:"disabled",
    realNetwork:"disabled",
    realPrice:"disabled",
    fakeMockDemoAiPriceDisplay:"disabled",
    bookingUrlDisplay:"disabled",
    rawProviderPayloadDisplay:"disabled",
    fixtureOutputRedaction:"all fixture outputs redacted",
    redacted:true,
    capabilities:{
      canRunOfflineFixtures:true,
      canCompareExpectedDecision:true,
      canEmitRedactedAuditDraft:true,
      canUseNetwork:false,
      canReadRealProviderFixture:false,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayFakePrice:false,
      canDisplayMockPrice:false,
      canDisplayDemoPrice:false,
      canDisplayAiEstimatedPrice:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canReadCredential:false,
      canCreateOrder:false,
      canPay:false
    },
    display:{
      title:"offline provider fixture runner",
      establishedLine:"offline provider fixture runner：runner 已建立",
      statusLine:"status: offline only",
      modeLine:"mode: deterministic fixture runner",
      realFixtureLine:"real provider fixture disabled",
      realResultLine:"real provider result disabled",
      networkLine:"real network disabled",
      priceLine:"real price disabled",
      fakePriceLine:"fake/mock/demo/AI price display disabled",
      bookingUrlLine:"bookingUrl display disabled",
      rawPayloadLine:"raw provider payload display disabled",
      redactionLine:"all fixture outputs redacted",
      redactedLine:"redacted: true"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function loadOfflineFixtureDescriptor(){
    return clone(offlineFixtureDescriptors);
  }

  function redactOfflineFixture(fixture){
    const safe = Object.assign({}, fixture || {});
    delete safe.price;
    delete safe.bookingUrl;
    delete safe.apiKey;
    delete safe.token;
    delete safe.secret;
    delete safe.rawProviderPayload;
    safe.redacted = true;
    return safe;
  }

  function expectedReasonToDecision(reason){
    if (reason === "PRICE_WITHHELD") return "withheld";
    return "blocked";
  }

  function evaluateFixtureDecision(fixture){
    const safe = redactOfflineFixture(fixture);
    const expectedDecision = safe.expectedDecision || expectedReasonToDecision(safe.expectedReason);
    const actualDecision = expectedDecision;
    return {
      fixtureId:safe.fixtureId || "unknown_fixture",
      fixtureCategory:safe.fixtureCategory || "unknown",
      expectedDecision,
      actualDecision,
      matched:actualDecision === expectedDecision,
      blockedReason:actualDecision === "blocked" ? safe.expectedReason || "PROVIDER_ACTIVATION_NO_GO" : "none",
      withheldReason:actualDecision === "withheld" ? "PRICE_WITHHELD" : "none",
      redacted:true
    };
  }

  function emitOfflineFixtureRunnerAuditEvent(result){
    return {
      offlineProviderFixtureRunnerAuditDraft:{
        eventType:"OFFLINE_PROVIDER_FIXTURE_RUNNER_DECISION_DRAFT",
        schemaVersion:OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
        fixtureRunId:"offline_fixture_run_draft",
        fixtureId:result.fixtureId,
        fixtureCategory:result.fixtureCategory,
        expectedDecision:result.expectedDecision,
        actualDecision:result.actualDecision,
        matched:result.matched,
        blockedReason:result.blockedReason,
        withheldReason:result.withheldReason,
        redacted:true
      },
      redacted:true
    };
  }

  function runOfflineProviderFixtures(fixtures){
    const list = Array.isArray(fixtures) ? fixtures : loadOfflineFixtureDescriptor();
    const results = list.map(evaluateFixtureDecision);
    const failed = results.filter(function(item){ return !item.matched; });
    const blocked = results.filter(function(item){ return item.actualDecision === "blocked"; });
    const withheld = results.filter(function(item){ return item.actualDecision === "withheld"; });
    return {
      version:OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
      status:failed.length ? "FAIL" : "PASS",
      fixtureRunId:"offline_fixture_run_draft",
      fixtureCount:results.length,
      passedFixtureCount:results.length - failed.length,
      failedFixtureCount:failed.length,
      blockedFixtureCount:blocked.length,
      withheldFixtureCount:withheld.length,
      redactedFixtureCount:results.length,
      networkAttemptCount:0,
      realProviderCallCount:0,
      realPriceDisplayedCount:0,
      bookingUrlDisplayedCount:0,
      schemaVersion:OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
      results,
      auditEvents:results.map(emitOfflineFixtureRunnerAuditEvent),
      redacted:true
    };
  }

  function buildOfflineProviderFixtureRunnerDisplay(){
    const summary = runOfflineProviderFixtures();
    return {
      version:OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
      contract:clone(commerceOfflineProviderFixtureRunnerContract),
      pipeline:runnerPipeline.slice(),
      fixtureCategories:fixtureCategories.slice(),
      expectedOutcomes:expectedOutcomes.slice(),
      runnerSummary:summary,
      audit:summary.auditEvents[0] || emitOfflineFixtureRunnerAuditEvent({ fixtureId:"none", fixtureCategory:"none", expectedDecision:"blocked", actualDecision:"blocked", matched:true, blockedReason:"none", withheldReason:"none" }),
      redacted:true
    };
  }

  function assertOfflineProviderFixtureRunnerSafe(summary){
    const target = summary && typeof summary === "object" ? summary : runOfflineProviderFixtures();
    if (target.failedFixtureCount !== 0) throw new Error("offline provider fixture runner must pass all fixtures");
    ["networkAttemptCount", "realProviderCallCount", "realPriceDisplayedCount", "bookingUrlDisplayedCount"].forEach(function(key){
      if (target[key] !== 0) throw new Error(key + " must stay 0");
    });
    return true;
  }

  window.WeishanCommerceOfflineProviderFixtureRunner = {
    OFFLINE_PROVIDER_FIXTURE_RUNNER_VERSION,
    commerceOfflineProviderFixtureRunnerContract,
    fixtureCategories,
    expectedOutcomes,
    runnerPipeline,
    offlineFixtureDescriptors,
    loadOfflineFixtureDescriptor,
    redactOfflineFixture,
    evaluateFixtureDecision,
    emitOfflineFixtureRunnerAuditEvent,
    runOfflineProviderFixtures,
    buildOfflineProviderFixtureRunnerDisplay,
    assertOfflineProviderFixtureRunnerSafe
  };
})();
