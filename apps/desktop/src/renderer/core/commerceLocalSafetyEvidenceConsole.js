(function(){
  const LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION = "2.1.12";

  const releaseEvidenceDraft = {
    appVersion:"2.1.12",
    expectedGitTag:"v2.1.12",
    expectedCommit:"local HEAD after v2.1.12 commit",
    releasePostcheckState:"local only",
    workingTreeState:"clean required",
    distAppVersion:"2.1.12",
    applicationsAppVersion:"2.1.12",
    uiAcceptanceState:"manual evidence required",
    schemaVersion:LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
    redacted:true
  };

  const settingsAuthEvidenceDraft = {
    localAuthMode:"enabled",
    passwordVerifier:"enabled",
    legacyPlainPasswordMigration:"compatible",
    localRecoveryMode:"no-network",
    localRecoveryEmailSend:"disabled",
    localRecoverySecretRead:"disabled",
    localRecoveryFormPreserved:"required",
    localRecoveryRouteStable:"required",
    aiKeyConfigLockedWhenUnauthenticated:"required",
    rawPasswordDisplay:"forbidden",
    rawTokenDisplay:"forbidden",
    rawApiKeyDisplay:"forbidden"
  };

  const commerceEvidenceDraft = {
    commerceFlightIntent:"enabled",
    flightOriginParsing:"上海",
    flightDestinationParsing:"成都",
    flightDateParsing:"7 月 15 日",
    flightSortPreference:"低价优先",
    realPriceResult:"unavailable",
    fakeMockDemoAiPrice:"forbidden",
    bookingUrl:"forbidden",
    providerActivationState:"no-go",
    offlineFixtureRunnerState:"PASS",
    networkAttemptCount:0,
    realProviderCallCount:0,
    realPriceDisplayedCount:0,
    bookingUrlDisplayedCount:0
  };

  const safetyRedlineEvidenceDraft = {
    apiKeyInput:"disabled",
    credentialInput:"disabled",
    endpointInput:"disabled",
    testConnection:"disabled",
    Keychain:"disabled",
    safeStorage:"disabled",
    envSecretWrite:"forbidden",
    localStorageSecretWrite:"forbidden",
    sessionStorageSecretWrite:"forbidden",
    realNetwork:"disabled",
    providerSandbox:"disabled",
    realProviderResult:"disabled",
    realPrice:"disabled",
    bookingUrl:"disabled",
    orderPaymentCheckout:"disabled",
    identityBankCardFlow:"disabled"
  };

  const localSafetyEvidenceConsoleContract = {
    version:LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
    moduleName:"local_safety_evidence_console",
    status:"local evidence only",
    mode:"offline safety summary",
    realProviderConnection:"disabled",
    realNetwork:"disabled",
    realCredentialRead:"disabled",
    realPriceDisplay:"disabled",
    realBookingUrl:"disabled",
    providerActivationState:"no-go",
    releaseEvidenceState:"local only",
    redacted:true,
    capabilities:{
      canShowLocalEvidence:true,
      canSummarizeReleaseState:true,
      canSummarizeSettingsAuth:true,
      canSummarizeCommerceOfflineCompliance:true,
      canReadRealSecret:false,
      canUseNetwork:false,
      canConnectProvider:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canCreateOrder:false,
      canPay:false
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildLocalSafetyEvidenceConsole(input){
    const raw = input && typeof input === "object" ? input : {};
    const audit = {
      localSafetyEvidenceConsoleAuditDraft:{
        eventType:"LOCAL_SAFETY_EVIDENCE_CONSOLE_DRAFT",
        schemaVersion:LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
        appVersion:LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
        evidenceState:"local evidence only",
        providerActivationState:"no-go",
        releasePostcheckState:"local only",
        fixtureRunnerState:"PASS",
        settingsAuthState:"local auth evidence only",
        blockedReason:"real_provider_and_secret_access_disabled",
        generatedAt:"local_only",
        redacted:true
      },
      redacted:true
    };
    return {
      version:LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
      contract:clone(localSafetyEvidenceConsoleContract),
      releaseEvidence:Object.assign({}, releaseEvidenceDraft, raw.releaseEvidence || {}),
      settingsAuthEvidence:Object.assign({}, settingsAuthEvidenceDraft, raw.settingsAuthEvidence || {}),
      commerceEvidence:Object.assign({}, commerceEvidenceDraft, raw.commerceEvidence || {}),
      safetyRedlineEvidence:Object.assign({}, safetyRedlineEvidenceDraft, raw.safetyRedlineEvidence || {}),
      audit,
      display:{
        title:"local safety evidence console",
        establishedLine:"console 已建立",
        statusLine:"status: local evidence only",
        modeLine:"mode: offline safety summary",
        providerLine:"real provider connection disabled",
        networkLine:"real network disabled",
        credentialLine:"real credential read disabled",
        priceLine:"real price display disabled",
        bookingUrlLine:"real bookingUrl disabled",
        activationLine:"providerActivationState: no-go",
        releaseLine:"releaseEvidenceState: local only",
        redactedLine:"redacted: true"
      }
    };
  }

  function assertLocalSafetyEvidenceConsoleSafe(consoleState){
    const target = consoleState && typeof consoleState === "object" ? consoleState : buildLocalSafetyEvidenceConsole();
    const contract = target.contract || localSafetyEvidenceConsoleContract;
    const caps = contract.capabilities || {};
    if (contract.status !== "local evidence only") throw new Error("local safety evidence console must stay local evidence only");
    if (contract.mode !== "offline safety summary") throw new Error("local safety evidence console must stay offline safety summary");
    if (contract.providerActivationState !== "no-go") throw new Error("providerActivationState must stay no-go");
    ["canReadRealSecret", "canUseNetwork", "canConnectProvider", "canDisplayRealPrice", "canDisplayBookingUrl", "canCreateOrder", "canPay"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  window.WeishanCommerceLocalSafetyEvidenceConsole = {
    LOCAL_SAFETY_EVIDENCE_CONSOLE_VERSION,
    localSafetyEvidenceConsoleContract,
    releaseEvidenceDraft,
    settingsAuthEvidenceDraft,
    commerceEvidenceDraft,
    safetyRedlineEvidenceDraft,
    buildLocalSafetyEvidenceConsole,
    assertLocalSafetyEvidenceConsoleSafe
  };
})();
