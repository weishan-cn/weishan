const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js"]);
  const api = windowRef.WeishanFlightWorkflowSafetyRegressionSentinel;
  assert.equal(api.FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, "2.9.0");
  const safe = api.buildFlightWorkflowSafetyRegressionReport({ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, autoOpen:false, autoRefresh:false, fileWrite:false, download:false, note:"平台最终为准" });
  assert.equal(safe.sentinelName, "flight_workflow_safety_regression_sentinel_v1");
  assert.equal(safe.status, "pass");
  const cases = [
    ["bookingUrl", "https://blocked.example"], ["checkoutUrl", "https://blocked.example"], ["paymentUrl", "https://blocked.example"], ["orderUrl", "https://blocked.example"],
    ["payment", true], ["order", true], ["ticketing", true], ["identityUpload", true], ["credentialInput", true], ["rawResponseStored", true], ["rawUserTextStored", true], ["secretStored", true], ["autoOpen", true], ["autoRefresh", true], ["fileWrite", true], ["download", true]
  ];
  for (const [key, value] of cases) {
    const input = { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null };
    input[key] = value;
    const report = api.buildFlightWorkflowSafetyRegressionReport(input);
    assert.equal(report.status, "fail", key);
    assert.equal(JSON.stringify(report).includes("https://blocked.example"), false);
  }
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"全网最低" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"已锁价" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport({ line:"可出票" }).status, "fail");
  assert.equal(api.buildFlightWorkflowSafetyRegressionReport(null).status, "failed_safe");
  const json = JSON.stringify(api.buildFlightWorkflowSafetyRegressionReport({ token:"abc", rawProviderResponse:{ price:1 } }));
  assert.equal(json.includes("abc"), false);
  const pilot = api.buildFlightWorkflowSafetyRegressionReport({ betaExpansionGateSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, publicPilotChecklistSummary:{ download:false, fileWrite:false }, pilotReadinessSummary:{ paymentUrl:null, orderUrl:null }, pilotOnboardingSummary:{ bookingUrl:null, paymentUrl:null, rawUserTextStored:false, secretStored:false }, readOnlyConsentSummary:{ orderUrl:null, fileWrite:false, download:false }, pilotOnboardingViewModel:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(pilot.status, "pass");
  const rc = api.buildFlightWorkflowSafetyRegressionReport({ rcCandidateReviewSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, rcEvidenceReviewSummary:{ orderUrl:null, fileWrite:false, download:false }, rcReviewViewModelSummary:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(rc.status, "pass");
  assert.equal(rc.rcCandidateReviewSummary.bookingUrl, null);
  const copy = api.buildFlightWorkflowSafetyRegressionReport({ rcCopyFinalizationSummary:{ bookingUrl:null, payment:false, rawUserTextStored:false, secretStored:false }, safetyDisclosureReviewSummary:{ orderUrl:null, fileWrite:false, download:false }, rcCopyReviewViewModelSummary:{ checkoutUrl:null, autoOpen:false } });
  assert.equal(copy.status, "pass");
  assert.equal(copy.rcCopyFinalizationSummary.bookingUrl, null);
  const global = api.buildFlightWorkflowSafetyRegressionReport({
    globalShoppingProductGoalSummary:{ status:"aligned", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    jumpToPlatformBoundarySummary:{ status:"safe", safety:{ checkoutUrl:null, autoOpen:false, payment:false, order:false, ticketing:false } },
    globalShoppingProductGoalViewModelSummary:{ status:"aligned", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    legalProviderFixtureSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerCredentialSafetySummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    sandboxPriceFeedSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    sandboxProviderResponseContractSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    pricePipelineOrchestratorSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    readOnlyCandidateJourneySummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerSandboxDryRunHarnessSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    firstReadOnlyProviderAdapterShellSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerSandboxDryRunViewModelSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerFixtureViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    sameItemMatcherSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    duplicateCandidateMergerSummary:{ status:"merged", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    coveredLowestCandidateBoardSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    externalDeepLinkSafetySummary:{ status:"safe", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    searchParameterPrefillSummary:{ status:"safe", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    jumpToPlatformHandoffPreviewSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    sandboxDeepLinkCandidateSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    platformAvailabilitySummary:{ status:"available", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    partnerLinkPolicySummary:{ status:"compliant", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    sandboxHandoffViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    manualPlatformReviewCockpitSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    handoffAcceptanceWalkthroughSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    platformRealityCheckBoardSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    manualPlatformReviewViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    externalPlatformExitRampPreviewSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    manualVisitSafetyBriefSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    readOnlySessionClosurePackSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    externalPlatformExitViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false },
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    userTrustClosureSummarySummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    nextFeatureReadinessGateSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    commerceSessionRecapViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    providerLegalReviewDossierSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    credentialVaultInterfaceStubSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, credentialInput:false } },
    sandboxAdapterContractTestbedSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerIntegrationPrepViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    sandboxProviderMockRuntimeSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    vaultBoundaryContractSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, credentialInput:false } },
    legalApprovalWorkflowBoardSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerMockRuntimeViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    providerSandboxPilotControlRoomSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    mockProviderIncidentDrillSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    productionBlockerMatrixSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    providerPilotControlViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    providerKillSwitchDrillSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    complianceEvidencePackSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerPilotGovernanceViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    providerGovernanceConsoleSummary:{ consoleStatus:"ready_for_human_approval", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerOperatorReviewLoopSummary:{ status:"ready_for_human_approval", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerGovernanceAuditConsoleSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    humanPilotReadinessLedgerSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    sandboxProviderReleaseFreezeGateSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerGovernanceReleaseViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerReadinessSignOffPacketSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerManualReleaseViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false },
    providerSandboxReadinessWorkbenchSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    offlineProviderScenarioLabSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    readOnlyProviderAdapterSdkSkeletonSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    manualActivationCommandCenterSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false, fileWrite:false, download:false } },
    providerSandboxMilestoneViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false }
  });
  assert.equal(global.status, "pass");
  assert.equal(global.globalShoppingProductGoalSummary.status, "aligned");
  assert.equal(global.legalProviderFixtureSummary.status, "ready");
  assert.equal(global.providerCredentialSafetySummary.status, "ready");
  assert.equal(global.sandboxPriceFeedSummary.status, "ready");
  assert.equal(global.sandboxProviderResponseContractSummary.status, "ready");
  assert.equal(global.pricePipelineOrchestratorSummary.status, "ready");
  assert.equal(global.readOnlyCandidateJourneySummary.status, "ready");
  assert.equal(global.providerSandboxDryRunHarnessSummary.status, "ready");
  assert.equal(global.firstReadOnlyProviderAdapterShellSummary.status, "ready");
  assert.equal(global.providerSandboxSafetyKillSwitchSummary.status, "clear");
  assert.equal(global.providerSandboxDryRunViewModelSummary.status, "ready");
  assert.equal(global.jumpToPlatformBoundarySummary.status, "safe");
  assert.equal(global.sameItemMatcherSummary.status, "ready");
  assert.equal(global.externalDeepLinkSafetySummary.status, "safe");
  assert.equal(global.searchParameterPrefillSummary.status, "safe");
  assert.equal(global.jumpToPlatformHandoffPreviewSummary.status, "ready");
  assert.equal(global.sandboxDeepLinkCandidateSummary.status, "ready");
  assert.equal(global.platformAvailabilitySummary.status, "available");
  assert.equal(global.partnerLinkPolicySummary.status, "compliant");
  assert.equal(global.sandboxCandidateComparisonWorkbenchSummary.status, "ready");
  assert.equal(global.providerEvidenceComparisonMatrixSummary.status, "ready");
  assert.equal(global.readOnlyHandoffReadinessDrillSummary.status, "ready");
  assert.equal(global.sandboxDecisionReviewViewModelSummary.status, "ready");
  assert.equal(global.manualPlatformReviewCockpitSummary.status, "ready");
  assert.equal(global.handoffAcceptanceWalkthroughSummary.status, "ready");
  assert.equal(global.platformRealityCheckBoardSummary.status, "ready");
  assert.equal(global.manualPlatformReviewViewModelSummary.status, "ready");
  assert.equal(global.readOnlyCommerceSessionRecapCenterSummary.status, "ready");
  assert.equal(global.userTrustClosureSummarySummary.status, "ready");
  assert.equal(global.nextFeatureReadinessGateSummary.status, "ready");
  assert.equal(global.commerceSessionRecapViewModelSummary.status, "ready");
  assert.equal(global.providerLegalReviewDossierSummary.status, "ready");
  assert.equal(global.credentialVaultInterfaceStubSummary.status, "ready");
  assert.equal(global.sandboxAdapterContractTestbedSummary.status, "ready");
  assert.equal(global.providerIntegrationPrepViewModelSummary.status, "ready");
  assert.equal(global.sandboxProviderMockRuntimeSummary.status, "ready");
  assert.equal(global.vaultBoundaryContractSummary.status, "ready");
  assert.equal(global.legalApprovalWorkflowBoardSummary.status, "ready");
  assert.equal(global.providerMockRuntimeViewModelSummary.status, "ready");
  assert.equal(global.providerSandboxPilotControlRoomSummary.status, "ready");
  assert.equal(global.mockProviderIncidentDrillSummary.status, "ready");
  assert.equal(global.productionBlockerMatrixSummary.status, "ready");
  assert.equal(global.providerPilotControlViewModelSummary.status, "ready");
  assert.equal(global.providerGovernanceConsoleSummary.consoleStatus, "ready_for_human_approval");
  assert.equal(global.providerOperatorReviewLoopSummary.status, "ready_for_human_approval");
  assert.equal(global.providerGovernanceAuditConsoleSummary.status, "ready");
  assert.equal(global.humanPilotReadinessLedgerSummary.status, "ready");
  assert.equal(global.sandboxProviderReleaseFreezeGateSummary.status, "ready");
  assert.equal(global.providerGovernanceReleaseViewModelSummary.status, "ready");
  assert.equal(global.manualGovernanceReleaseDecisionRoomSummary.status, "ready");
  assert.equal(global.sandboxPilotExceptionRegisterSummary.status, "ready");
  assert.equal(global.providerReadinessSignOffPacketSummary.status, "ready");
  assert.equal(global.providerManualReleaseViewModelSummary.status, "ready");
  assert.equal(global.providerSandboxReadinessWorkbenchSummary.status, "ready");
  assert.equal(global.offlineProviderScenarioLabSummary.status, "ready");
  assert.equal(global.readOnlyProviderAdapterSdkSkeletonSummary.status, "ready");
  assert.equal(global.manualActivationCommandCenterSummary.status, "ready");
  assert.equal(global.providerSandboxMilestoneViewModelSummary.status, "ready");
  const offlineLaunch = api.buildFlightWorkflowSafetyRegressionReport({
    offlineLaunchDecisionSimulatorSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    sandboxActivationReceiptLedgerSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    adapterSecurityRegressionGuardSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerOfflineLaunchChecklistSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    providerOfflineLaunchViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false }
  });
  assert.equal(offlineLaunch.status, "pass");
  assert.equal(offlineLaunch.offlineLaunchDecisionSimulatorSummary.status, "ready");
  assert.equal(offlineLaunch.sandboxActivationReceiptLedgerSummary.status, "ready");
  assert.equal(offlineLaunch.adapterSecurityRegressionGuardSummary.status, "ready");
  assert.equal(offlineLaunch.providerOfflineLaunchChecklistSummary.status, "ready");
  assert.equal(offlineLaunch.providerOfflineLaunchViewModelSummary.status, "ready");
  const providerCertification = api.buildFlightWorkflowSafetyRegressionReport({
    offlineProviderCertificationCenterSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    mockIntegrationRegressionLabSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false } },
    humanApprovalEvidenceBinderSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false } },
    adapterBoundaryLockSummary:{ status:"ready", safety:{ bookingUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, autoOpen:false } },
    providerCertificationViewModelSummary:{ status:"ready", bookingUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, fileWrite:false, download:false }
  });
  assert.equal(providerCertification.status, "pass");
  assert.equal(providerCertification.offlineProviderCertificationCenterSummary.status, "ready");
  assert.equal(providerCertification.mockIntegrationRegressionLabSummary.status, "ready");
  assert.equal(providerCertification.humanApprovalEvidenceBinderSummary.status, "ready");
  assert.equal(providerCertification.adapterBoundaryLockSummary.status, "ready");
  assert.equal(providerCertification.providerCertificationViewModelSummary.status, "ready");
  console.log("FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL PASS");
}
main();
