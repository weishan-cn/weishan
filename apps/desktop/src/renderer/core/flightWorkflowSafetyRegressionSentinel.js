;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION = "4.2.0";
  const SENTINEL_NAME = "flight_workflow_safety_regression_sentinel_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  const SECRET_VALUE_RE = /token|apiKey|secret|password|sk-|pk-|live_|prod_/i;
  const CLAIM_RE = /全网最低|最低价保证|已锁价|可出票|真实最终价/i;
  const TRADING_URL_RE = /bookingUrl|checkoutUrl|paymentUrl|orderUrl/i;
  const TRUE_RISK_RE = /payment|order|ticketing|identityUpload|credentialInput|autoOpen|autoRefresh|rawResponseStored|rawUserTextStored|secretStored|fileWrite|download/i;
  function isSecretFieldName(name) {
    return /^(token|apiKey|secret|password|auth|credential|rawProviderResponse|rawResponse|rawPayload|rawText|rawUserText|rawInput)$/i.test(String(name || ""));
  }
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function failure(checkId, field, riskType) { return { checkId:checkId, field:safeText(field || ""), riskType:safeText(riskType || checkId), redacted:true }; }
  function addUnique(list, item) { if (!list.some(function (entry) { return entry.checkId === item.checkId && entry.field === item.field && entry.riskType === item.riskType; })) list.push(item); }
  function scanFlightWorkflowSafetyObject(obj, options) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return clone({ status:"failed_safe", failures:[failure("malformed_input", "input", "malformed_input")], warnings:[], redacted:true });
    const failures = [];
    const warnings = [];
    function visit(value, key, path) {
      if (value == null) return;
      const name = String(key || "");
      const fieldPath = path || name || "root";
      if (TRADING_URL_RE.test(name) && value !== null && value !== false && value !== "") addUnique(failures, failure("no_trading_urls", fieldPath, "trading_url_non_null"));
      if (/(payment|order|ticketing)$/i.test(name) && value === true) addUnique(failures, failure("no_payment_order_ticketing", fieldPath, "transaction_flag_true"));
      if (/(identityUpload|credentialInput)$/i.test(name) && value === true) addUnique(failures, failure("no_identity_or_credentials", fieldPath, "identity_or_credential_true"));
      if (/(rawResponseStored|rawUserTextStored|secretStored)$/i.test(name) && value === true) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_or_raw_storage_true"));
      if (/(autoOpen|autoRefresh)$/i.test(name) && value === true) addUnique(failures, failure("no_auto_open_or_refresh", fieldPath, "auto_action_true"));
      if (/(fileWrite|download)$/i.test(name) && value === true) addUnique(failures, failure("no_export_or_file_write", fieldPath, "file_or_download_true"));
      if (isSecretFieldName(name) && value && value !== false) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_or_raw_field_present"));
      if (typeof value === "string") {
        if (SECRET_VALUE_RE.test(value)) addUnique(failures, failure("no_secret_or_raw_response", fieldPath, "secret_like_text"));
        if (CLAIM_RE.test(value)) addUnique(failures, failure("no_final_price_claims", fieldPath, "forbidden_price_or_ticketing_claim"));
      }
      if (Array.isArray(value)) value.forEach(function (child, index) { visit(child, name, fieldPath + "[" + index + "]"); });
      else if (value && typeof value === "object") Object.keys(value).forEach(function (childKey) { visit(value[childKey], childKey, fieldPath === "root" ? childKey : fieldPath + "." + childKey); });
    }
    Object.keys(obj).forEach(function (key) { visit(obj[key], key, key); });
    if (options && options.warnUnknown === true) warnings.push({ warningId:"unknown_fields_reviewed", message:"发现未知字段但未发现安全风险。", redacted:true });
    return clone({ status:failures.length ? "fail" : (warnings.length ? "warning" : "pass"), failures:failures, warnings:warnings, redacted:true });
  }
  function check(checkId, label, failures, message) {
    const failed = failures.some(function (item) { return item.checkId === checkId || (checkId === "no_export_or_file_write" && item.checkId === "no_export_or_file_write"); });
    return { checkId:checkId, label:label, status:failed ? "fail" : "pass", message:safeText(message || (failed ? "发现安全回归风险。" : "安全回归通过。")), redacted:true };
  }
  function buildFlightWorkflowSafetyRegressionReport(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:"failed_safe", checks:[], failures:[failure("malformed_input", "input", "malformed_input")], warnings:[], safety:safety(), redacted:true });
      const scan = scanFlightWorkflowSafetyObject(input, {});
      const failures = scan.failures || [];
      const pilotExitCriteriaSummary = input.pilotExitCriteriaSummary || input.exitCriteriaSummary || null;
      const launchCandidateReadinessSummary = input.launchCandidateReadinessSummary || input.launchCandidateSummary || null;
      const freezeGateSummary = input.freezeGateSummary || input.launchCandidateFreezeGateSummary || null;
      const evidenceFreezePackSummary = input.evidenceFreezePackSummary || input.freezePackSummary || null;
      const rcCandidateReviewSummary = input.rcCandidateReviewSummary || input.rcReviewConsoleSummary || null;
      const rcEvidenceReviewSummary = input.rcEvidenceReviewSummary || input.rcEvidenceChecklistSummary || null;
      const rcReviewViewModelSummary = input.rcReviewViewModelSummary || null;
      const rcRegressionAuditSummary = input.rcRegressionAuditSummary || null;
      const releaseRiskLedgerSummary = input.releaseRiskLedgerSummary || null;
      const rcCopyFinalizationSummary = input.rcCopyFinalizationSummary || null;
      const safetyDisclosureReviewSummary = input.safetyDisclosureReviewSummary || null;
      const rcCopyReviewViewModelSummary = input.rcCopyReviewViewModelSummary || null;
      const globalShoppingProductGoalSummary = input.globalShoppingProductGoalSummary || null;
      const jumpToPlatformBoundarySummary = input.jumpToPlatformBoundarySummary || null;
      const globalShoppingReadOnlyCandidateEvidenceUnifierSummary = input.globalShoppingReadOnlyCandidateEvidenceUnifierSummary || null;
      const globalShoppingFeeNormalizationViewSummary = input.globalShoppingFeeNormalizationViewSummary || null;
      const globalShoppingOfficialAnchorComparisonViewSummary = input.globalShoppingOfficialAnchorComparisonViewSummary || null;
      const priceSourceNormalizationSummary = input.priceSourceNormalizationSummary || null;
      const officialPriceAnchorSummary = input.officialPriceAnchorSummary || null;
      const priceCandidateDisplaySummary = input.priceCandidateDisplaySummary || null;
      const sameItemMatcherSummary = input.sameItemMatcherSummary || null;
      const duplicateCandidateMergerSummary = input.duplicateCandidateMergerSummary || null;
      const coveredLowestCandidateBoardSummary = input.coveredLowestCandidateBoardSummary || null;
      const externalDeepLinkSafetySummary = input.externalDeepLinkSafetySummary || null;
      const searchParameterPrefillSummary = input.searchParameterPrefillSummary || null;
      const jumpToPlatformHandoffPreviewSummary = input.jumpToPlatformHandoffPreviewSummary || null;
      const sandboxDeepLinkCandidateSummary = input.sandboxDeepLinkCandidateSummary || null;
      const platformAvailabilitySummary = input.platformAvailabilitySummary || null;
      const partnerLinkPolicySummary = input.partnerLinkPolicySummary || null;
      const sandboxHandoffViewModelSummary = input.sandboxHandoffViewModelSummary || null;
      const readOnlyProviderSandboxConnectorSummary = input.readOnlyProviderSandboxConnectorSummary || null;
      const fixtureReplayConsoleSummary = input.fixtureReplayConsoleSummary || null;
      const normalizedPriceCandidateBoardSummary = input.normalizedPriceCandidateBoardSummary || null;
      const realProviderSandboxGateSummary = input.realProviderSandboxGateSummary || null;
      const providerRequestEnvelopeSummary = input.providerRequestEnvelopeSummary || null;
      const providerCallAuditLedgerSummary = input.providerCallAuditLedgerSummary || null;
      const providerSandboxReadinessViewModelSummary = input.providerSandboxReadinessViewModelSummary || null;
      const providerSandboxDryRunHarnessSummary = input.providerSandboxDryRunHarnessSummary || null;
      const firstReadOnlyProviderAdapterShellSummary = input.firstReadOnlyProviderAdapterShellSummary || null;
      const providerSandboxSafetyKillSwitchSummary = input.providerSandboxSafetyKillSwitchSummary || null;
      const providerSandboxDryRunViewModelSummary = input.providerSandboxDryRunViewModelSummary || null;
      const offlineSandboxTraceInspectorSummary = input.offlineSandboxTraceInspectorSummary || null;
      const mockProviderResultNormalizerSummary = input.mockProviderResultNormalizerSummary || null;
      const manualActivationDryRunChecklistSummary = input.manualActivationDryRunChecklistSummary || null;
      const providerSandboxReadinessWorkbenchSummary = input.providerSandboxReadinessWorkbenchSummary || null;
      const offlineProviderScenarioLabSummary = input.offlineProviderScenarioLabSummary || null;
      const readOnlyProviderAdapterSdkSkeletonSummary = input.readOnlyProviderAdapterSdkSkeletonSummary || null;
      const manualActivationCommandCenterSummary = input.manualActivationCommandCenterSummary || null;
      const providerSandboxMilestoneViewModelSummary = input.providerSandboxMilestoneViewModelSummary || null;
      const offlineProviderAdapterContractKitSummary = input.offlineProviderAdapterContractKitSummary || null;
      const mockSandboxQaMatrixSummary = input.mockSandboxQaMatrixSummary || null;
      const humanActivationRunbookCenterSummary = input.humanActivationRunbookCenterSummary || null;
      const providerAdapterComplianceChecklistSummary = input.providerAdapterComplianceChecklistSummary || null;
      const providerSandboxReleaseCandidateViewModelSummary = input.providerSandboxReleaseCandidateViewModelSummary || null;
      const offlineProviderCertificationCenterSummary = input.offlineProviderCertificationCenterSummary || null;
      const mockIntegrationRegressionLabSummary = input.mockIntegrationRegressionLabSummary || null;
      const humanApprovalEvidenceBinderSummary = input.humanApprovalEvidenceBinderSummary || null;
      const adapterBoundaryLockSummary = input.adapterBoundaryLockSummary || null;
      const providerCertificationViewModelSummary = input.providerCertificationViewModelSummary || null;
      const providerOfflineReleaseGateSummary = input.providerOfflineReleaseGateSummary || null;
      const providerCertificationFreezeLedgerSummary = input.providerCertificationFreezeLedgerSummary || null;
      const sandboxActivationReviewPacketSummary = input.sandboxActivationReviewPacketSummary || null;
      const adapterBoundaryDiffInspectorSummary = input.adapterBoundaryDiffInspectorSummary || null;
      const providerOfflineReleaseViewModelSummary = input.providerOfflineReleaseViewModelSummary || null;
      const offlineLaunchDecisionSimulatorSummary = input.offlineLaunchDecisionSimulatorSummary || null;
      const sandboxActivationReceiptLedgerSummary = input.sandboxActivationReceiptLedgerSummary || null;
      const adapterSecurityRegressionGuardSummary = input.adapterSecurityRegressionGuardSummary || null;
      const providerOfflineLaunchChecklistSummary = input.providerOfflineLaunchChecklistSummary || null;
      const providerOfflineLaunchViewModelSummary = input.providerOfflineLaunchViewModelSummary || null;
      const offlineProviderLaunchControlTowerSummary = input.offlineProviderLaunchControlTowerSummary || null;
      const adapterPolicyEngineSummary = input.adapterPolicyEngineSummary || null;
      const humanReleaseEvidenceTimelineSummary = input.humanReleaseEvidenceTimelineSummary || null;
      const sandboxActivationFinalReviewBoardSummary = input.sandboxActivationFinalReviewBoardSummary || null;
      const providerLaunchControlViewModelSummary = input.providerLaunchControlViewModelSummary || null;
      const providerLaunchAuditSnapshotSummary = input.providerLaunchAuditSnapshotSummary || null;
      const offlinePolicyReplayCenterSummary = input.offlinePolicyReplayCenterSummary || null;
      const humanActivationFinalDossierSummary = input.humanActivationFinalDossierSummary || null;
      const adapterLaunchBoundaryVerifierSummary = input.adapterLaunchBoundaryVerifierSummary || null;
      const providerFinalLaunchReviewViewModelSummary = input.providerFinalLaunchReviewViewModelSummary || null;
      const finalOfflineLaunchReviewConsoleSummary = input.finalOfflineLaunchReviewConsoleSummary || null;
      const providerActivationBlockerSentinelSummary = input.providerActivationBlockerSentinelSummary || null;
      const readOnlyReleaseEvidenceSummary = input.readOnlyReleaseEvidenceSummary || null;
      const offlineProviderReadinessDecisionMatrixSummary = input.offlineProviderReadinessDecisionMatrixSummary || null;
      const providerFinalReviewConsoleViewModelSummary = input.providerFinalReviewConsoleViewModelSummary || null;
      const providerFinalSafetySealSummary = input.providerFinalSafetySealSummary || null;
      const offlineActivationWarRoomSummary = input.offlineActivationWarRoomSummary || null;
      const readOnlyProviderReadinessCertificateSummary = input.readOnlyProviderReadinessCertificateSummary || null;
      const providerNoActivationGuaranteeBoardSummary = input.providerNoActivationGuaranteeBoardSummary || null;
      const providerFinalSafetyViewModelSummary = input.providerFinalSafetyViewModelSummary || null;
      const offlineProviderGovernanceClosureBoardSummary = input.offlineProviderGovernanceClosureBoardSummary || null;
      const noActivationComplianceSealSummary = input.noActivationComplianceSealSummary || null;
      const finalReadinessHandoffSimulatorSummary = input.finalReadinessHandoffSimulatorSummary || null;
      const providerGovernanceClosureEvidenceLedgerSummary = input.providerGovernanceClosureEvidenceLedgerSummary || null;
      const providerGovernanceClosureViewModelSummary = input.providerGovernanceClosureViewModelSummary || null;
      const offlineDistributionReadinessCenterSummary = input.offlineDistributionReadinessCenterSummary || null;
      const noActivationEnforcementLedgerSummary = input.noActivationEnforcementLedgerSummary || null;
      const finalUserTrustSummarySummary = input.finalUserTrustSummarySummary || null;
      const providerSafetyDistributionMatrixSummary = input.providerSafetyDistributionMatrixSummary || null;
      const providerDistributionReadinessViewModelSummary = input.providerDistributionReadinessViewModelSummary || null;
      const providerDistributionFreezeConsoleSummary = input.providerDistributionFreezeConsoleSummary || null;
      const userFacingSafetyReceiptSummary = input.userFacingSafetyReceiptSummary || null;
      const offlineReleaseCandidateClosurePackSummary = input.offlineReleaseCandidateClosurePackSummary || null;
      const providerNoProductionGuaranteeMatrixSummary = input.providerNoProductionGuaranteeMatrixSummary || null;
      const providerDistributionClosureViewModelSummary = input.providerDistributionClosureViewModelSummary || null;
      const providerPublicTrustClosureCenterSummary = input.providerPublicTrustClosureCenterSummary || null;
      const offlineReleaseMemorySnapshotSummary = input.offlineReleaseMemorySnapshotSummary || null;
      const noProviderExecutionFinalGuardSummary = input.noProviderExecutionFinalGuardSummary || null;
      const userVisibleSafetyBoundaryExplainerSummary = input.userVisibleSafetyBoundaryExplainerSummary || null;
      const providerTrustClosureViewModelSummary = input.providerTrustClosureViewModelSummary || null;
      const providerReadOnlyPublicReleaseCenterSummary = input.providerReadOnlyPublicReleaseCenterSummary || null;
      const trustClosureExportPreviewSummary = input.trustClosureExportPreviewSummary || null;
      const finalNoProviderBoundaryReceiptSummary = input.finalNoProviderBoundaryReceiptSummary || null;
      const publicSafetyStatementPreviewSummary = input.publicSafetyStatementPreviewSummary || null;
      const providerPublicReleaseViewModelSummary = input.providerPublicReleaseViewModelSummary || null;
      const publicReleaseEvidenceConsoleSummary = input.publicReleaseEvidenceConsoleSummary || null;
      const noProviderUserAssurancePanelSummary = input.noProviderUserAssurancePanelSummary || null;
      const offlineLaunchReadinessFinalizerSummary = input.offlineLaunchReadinessFinalizerSummary || null;
      const userSafePublicClaimVerifierSummary = input.userSafePublicClaimVerifierSummary || null;
      const providerLaunchReadinessFinalViewModelSummary = input.providerLaunchReadinessFinalViewModelSummary || null;
      const globalShoppingReadOnlyPublicBetaShellSummary = input.globalShoppingReadOnlyPublicBetaShellSummary || null;
      const providerZeroRuntimeLockSummary = input.providerZeroRuntimeLockSummary || null;
      const userTrustLaunchBoardSummary = input.userTrustLaunchBoardSummary || null;
      const publicBetaSafetyCopyCenterSummary = input.publicBetaSafetyCopyCenterSummary || null;
      const globalShoppingPublicBetaViewModelSummary = input.globalShoppingPublicBetaViewModelSummary || null;
      const providerAdapterRegistrySummary = input.providerAdapterRegistrySummary || null;
      const dryRunProviderResponseNormalizerSummary = input.dryRunProviderResponseNormalizerSummary || null;
      const sandboxProviderRunbookSummary = input.sandboxProviderRunbookSummary || null;
      const providerAdapterRegistryViewModelSummary = input.providerAdapterRegistryViewModelSummary || null;
      const readOnlyProviderSandboxIntegrationGateSummary = input.readOnlyProviderSandboxIntegrationGateSummary || null;
      const sandboxPriceCandidateSessionSummary = input.sandboxPriceCandidateSessionSummary || null;
      const sandboxPriceCandidateResultBoardSummary = input.sandboxPriceCandidateResultBoardSummary || null;
      const sandboxCandidateComparisonWorkbenchSummary = input.sandboxCandidateComparisonWorkbenchSummary || null;
      const providerEvidenceComparisonMatrixSummary = input.providerEvidenceComparisonMatrixSummary || null;
      const readOnlyHandoffReadinessDrillSummary = input.readOnlyHandoffReadinessDrillSummary || null;
      const sandboxDecisionReviewViewModelSummary = input.sandboxDecisionReviewViewModelSummary || null;
      const readOnlyPlatformHandoffSimulatorSummary = input.readOnlyPlatformHandoffSimulatorSummary || null;
      const redactedSearchParameterPackSummary = input.redactedSearchParameterPackSummary || null;
      const userConfirmationChecklistSummary = input.userConfirmationChecklistSummary || null;
      const platformHandoffSimulationViewModelSummary = input.platformHandoffSimulationViewModelSummary || null;
      const readOnlyHandoffPacketPreviewSummary = input.readOnlyHandoffPacketPreviewSummary || null;
      const platformPreflightSafetyGateSummary = input.platformPreflightSafetyGateSummary || null;
      const userActionBoundaryReceiptSummary = input.userActionBoundaryReceiptSummary || null;
      const handoffPacketViewModelSummary = input.handoffPacketViewModelSummary || null;
      const manualPlatformReviewCockpitSummary = input.manualPlatformReviewCockpitSummary || null;
      const handoffAcceptanceWalkthroughSummary = input.handoffAcceptanceWalkthroughSummary || null;
      const platformRealityCheckBoardSummary = input.platformRealityCheckBoardSummary || null;
      const manualPlatformReviewViewModelSummary = input.manualPlatformReviewViewModelSummary || null;
      const userFacingManualReviewFlowSummary = input.userFacingManualReviewFlowSummary || null;
      const platformVerificationProgressTrackerSummary = input.platformVerificationProgressTrackerSummary || null;
      const safeNextActionPanelSummary = input.safeNextActionPanelSummary || null;
      const userManualReviewViewModelSummary = input.userManualReviewViewModelSummary || null; const manualPlatformVisitPreparationCenterSummary = input.manualPlatformVisitPreparationCenterSummary || null; const externalPlatformBoundaryBriefSummary = input.externalPlatformBoundaryBriefSummary || null; const finalUserSafetyChecklistSummary = input.finalUserSafetyChecklistSummary || null; const platformVisitPreparationViewModelSummary = input.platformVisitPreparationViewModelSummary || null; const externalPlatformExitRampPreviewSummary = input.externalPlatformExitRampPreviewSummary || null; const manualVisitSafetyBriefSummary = input.manualVisitSafetyBriefSummary || null; const readOnlySessionClosurePackSummary = input.readOnlySessionClosurePackSummary || null; const externalPlatformExitViewModelSummary = input.externalPlatformExitViewModelSummary || null; const readOnlyCommerceSessionRecapCenterSummary = input.readOnlyCommerceSessionRecapCenterSummary || null; const userTrustClosureSummarySummary = input.userTrustClosureSummarySummary || null; const nextFeatureReadinessGateSummary = input.nextFeatureReadinessGateSummary || null; const commerceSessionRecapViewModelSummary = input.commerceSessionRecapViewModelSummary || null; const providerLegalReviewDossierSummary = input.providerLegalReviewDossierSummary || null; const credentialVaultInterfaceStubSummary = input.credentialVaultInterfaceStubSummary || null; const sandboxAdapterContractTestbedSummary = input.sandboxAdapterContractTestbedSummary || null; const providerIntegrationPrepViewModelSummary = input.providerIntegrationPrepViewModelSummary || null; const sandboxProviderMockRuntimeSummary = input.sandboxProviderMockRuntimeSummary || null; const vaultBoundaryContractSummary = input.vaultBoundaryContractSummary || null; const legalApprovalWorkflowBoardSummary = input.legalApprovalWorkflowBoardSummary || null; const providerMockRuntimeViewModelSummary = input.providerMockRuntimeViewModelSummary || null; const mockProviderAdapterRegistryRuntimeSummary = input.mockProviderAdapterRegistryRuntimeSummary || null; const providerContractReplayHarnessSummary = input.providerContractReplayHarnessSummary || null; const providerLaunchReadinessBoardSummary = input.providerLaunchReadinessBoardSummary || null; const providerLaunchReadinessViewModelSummary = input.providerLaunchReadinessViewModelSummary || null; const humanApprovalSimulationGateSummary = input.humanApprovalSimulationGateSummary || null; const mockProviderLaunchDrillSummary = input.mockProviderLaunchDrillSummary || null; const sandboxProviderRollbackPlanSummary = input.sandboxProviderRollbackPlanSummary || null; const providerLaunchSimulationViewModelSummary = input.providerLaunchSimulationViewModelSummary || null; const providerSandboxPilotControlRoomSummary = input.providerSandboxPilotControlRoomSummary || null; const mockProviderIncidentDrillSummary = input.mockProviderIncidentDrillSummary || null; const productionBlockerMatrixSummary = input.productionBlockerMatrixSummary || null; const providerPilotControlViewModelSummary = input.providerPilotControlViewModelSummary || null; const humanControlledSandboxProviderPilotPlannerSummary = input.humanControlledSandboxProviderPilotPlannerSummary || null; const providerKillSwitchDrillSummary = input.providerKillSwitchDrillSummary || null; const complianceEvidencePackSummary = input.complianceEvidencePackSummary || null; const providerPilotGovernanceViewModelSummary = input.providerPilotGovernanceViewModelSummary || null; const providerGovernanceConsoleSummary = input.providerGovernanceConsoleSummary || null; const providerOperatorReviewLoopSummary = input.providerOperatorReviewLoopSummary || null; const providerGovernanceAuditConsoleSummary = input.providerGovernanceAuditConsoleSummary || null; const humanPilotReadinessLedgerSummary = input.humanPilotReadinessLedgerSummary || null; const sandboxProviderReleaseFreezeGateSummary = input.sandboxProviderReleaseFreezeGateSummary || null; const providerGovernanceReleaseViewModelSummary = input.providerGovernanceReleaseViewModelSummary || null; const manualGovernanceReleaseDecisionRoomSummary = input.manualGovernanceReleaseDecisionRoomSummary || null; const sandboxPilotExceptionRegisterSummary = input.sandboxPilotExceptionRegisterSummary || null; const providerReadinessSignOffPacketSummary = input.providerReadinessSignOffPacketSummary || null; const providerManualReleaseViewModelSummary = input.providerManualReleaseViewModelSummary || null;
      const legalProviderFixtureSummary = input.legalProviderFixtureSummary || null;
      const providerCredentialSafetySummary = input.providerCredentialSafetySummary || null;
      const sandboxPriceFeedSummary = input.sandboxPriceFeedSummary || null;
      const providerFixtureViewModelSummary = input.providerFixtureViewModelSummary || null;
      const sandboxProviderResponseContractSummary = input.sandboxProviderResponseContractSummary || null;
      const pricePipelineOrchestratorSummary = input.pricePipelineOrchestratorSummary || null;
      const readOnlyCandidateJourneySummary = input.readOnlyCandidateJourneySummary || null;
      const checks = [
        check("no_trading_urls", "无交易链接", failures),
        check("no_payment_order_ticketing", "无付款/下单/出票", failures),
        check("no_identity_or_credentials", "无证件/银行卡/登录凭据", failures),
        check("no_secret_or_raw_response", "无密钥或原始响应", failures),
        check("no_auto_open_or_refresh", "无自动打开或自动刷新", failures),
        check("no_final_price_claims", "无最终价或出票承诺", failures),
        check("no_export_or_file_write", "无真实导出或写文件", failures)
      ];
      const status = failures.length ? "fail" : (scan.warnings && scan.warnings.length ? "warning" : "pass");
    return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:status, checks:checks, failures:failures, warnings:scan.warnings || [], pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcReviewViewModelSummary:rcReviewViewModelSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcCopyFinalizationSummary:rcCopyFinalizationSummary, safetyDisclosureReviewSummary:safetyDisclosureReviewSummary, rcCopyReviewViewModelSummary:rcCopyReviewViewModelSummary, globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, globalShoppingReadOnlyCandidateEvidenceUnifierSummary:globalShoppingReadOnlyCandidateEvidenceUnifierSummary, globalShoppingFeeNormalizationViewSummary:globalShoppingFeeNormalizationViewSummary, globalShoppingOfficialAnchorComparisonViewSummary:globalShoppingOfficialAnchorComparisonViewSummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, externalDeepLinkSafetySummary:externalDeepLinkSafetySummary, searchParameterPrefillSummary:searchParameterPrefillSummary, jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary, sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary, platformAvailabilitySummary:platformAvailabilitySummary, partnerLinkPolicySummary:partnerLinkPolicySummary, sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary, readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary, fixtureReplayConsoleSummary:fixtureReplayConsoleSummary, normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary, realProviderSandboxGateSummary:realProviderSandboxGateSummary, providerRequestEnvelopeSummary:providerRequestEnvelopeSummary, providerCallAuditLedgerSummary:providerCallAuditLedgerSummary, providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary, providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary, firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary, providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary, providerSandboxDryRunViewModelSummary:providerSandboxDryRunViewModelSummary, offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary, providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary, providerSandboxMilestoneViewModelSummary:providerSandboxMilestoneViewModelSummary, offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary, providerSandboxReleaseCandidateViewModelSummary:providerSandboxReleaseCandidateViewModelSummary, offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, providerCertificationViewModelSummary:providerCertificationViewModelSummary, providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, providerOfflineReleaseViewModelSummary:providerOfflineReleaseViewModelSummary, offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary, providerOfflineLaunchViewModelSummary:providerOfflineLaunchViewModelSummary, offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary, providerLaunchControlViewModelSummary:providerLaunchControlViewModelSummary, providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary, offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary, providerFinalLaunchReviewViewModelSummary:providerFinalLaunchReviewViewModelSummary, finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary, providerFinalReviewConsoleViewModelSummary:providerFinalReviewConsoleViewModelSummary, providerFinalSafetySealSummary:providerFinalSafetySealSummary, offlineActivationWarRoomSummary:offlineActivationWarRoomSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary, providerFinalSafetyViewModelSummary:providerFinalSafetyViewModelSummary, offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary, providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary, providerGovernanceClosureViewModelSummary:providerGovernanceClosureViewModelSummary, offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary, providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary, providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary, offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary, providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary, providerDistributionClosureViewModelSummary:providerDistributionClosureViewModelSummary, providerPublicTrustClosureCenterSummary:providerPublicTrustClosureCenterSummary, offlineReleaseMemorySnapshotSummary:offlineReleaseMemorySnapshotSummary, noProviderExecutionFinalGuardSummary:noProviderExecutionFinalGuardSummary, userVisibleSafetyBoundaryExplainerSummary:userVisibleSafetyBoundaryExplainerSummary, providerTrustClosureViewModelSummary:providerTrustClosureViewModelSummary, providerReadOnlyPublicReleaseCenterSummary:providerReadOnlyPublicReleaseCenterSummary, trustClosureExportPreviewSummary:trustClosureExportPreviewSummary, finalNoProviderBoundaryReceiptSummary:finalNoProviderBoundaryReceiptSummary, publicSafetyStatementPreviewSummary:publicSafetyStatementPreviewSummary, providerPublicReleaseViewModelSummary:providerPublicReleaseViewModelSummary, publicReleaseEvidenceConsoleSummary:publicReleaseEvidenceConsoleSummary, noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary, offlineLaunchReadinessFinalizerSummary:offlineLaunchReadinessFinalizerSummary, userSafePublicClaimVerifierSummary:userSafePublicClaimVerifierSummary, providerLaunchReadinessFinalViewModelSummary:providerLaunchReadinessFinalViewModelSummary, globalShoppingReadOnlyPublicBetaShellSummary:globalShoppingReadOnlyPublicBetaShellSummary, providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary, userTrustLaunchBoardSummary:userTrustLaunchBoardSummary, publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary, globalShoppingPublicBetaViewModelSummary:globalShoppingPublicBetaViewModelSummary, providerAdapterRegistrySummary:providerAdapterRegistrySummary, dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary, sandboxProviderRunbookSummary:sandboxProviderRunbookSummary, providerAdapterRegistryViewModelSummary:providerAdapterRegistryViewModelSummary, readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary, sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary, sandboxPriceCandidateResultBoardSummary:sandboxPriceCandidateResultBoardSummary, sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary, readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary, redactedSearchParameterPackSummary:redactedSearchParameterPackSummary, userConfirmationChecklistSummary:userConfirmationChecklistSummary, platformHandoffSimulationViewModelSummary:platformHandoffSimulationViewModelSummary, readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary, platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary, handoffPacketViewModelSummary:handoffPacketViewModelSummary, manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary, handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary, platformRealityCheckBoardSummary:platformRealityCheckBoardSummary, manualPlatformReviewViewModelSummary:manualPlatformReviewViewModelSummary, userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary, platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary, safeNextActionPanelSummary:safeNextActionPanelSummary, userManualReviewViewModelSummary:userManualReviewViewModelSummary, manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary, externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary, platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary, externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary, manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary, readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary, externalPlatformExitViewModelSummary:externalPlatformExitViewModelSummary, readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary, userTrustClosureSummarySummary:userTrustClosureSummarySummary, nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary, commerceSessionRecapViewModelSummary:commerceSessionRecapViewModelSummary, providerLegalReviewDossierSummary:providerLegalReviewDossierSummary, credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary, providerIntegrationPrepViewModelSummary:providerIntegrationPrepViewModelSummary, sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary, providerMockRuntimeViewModelSummary:providerMockRuntimeViewModelSummary, mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, providerLaunchReadinessViewModelSummary:providerLaunchReadinessViewModelSummary, humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary, mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary, providerLaunchSimulationViewModelSummary:providerLaunchSimulationViewModelSummary, providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, providerPilotControlViewModelSummary:providerPilotControlViewModelSummary, humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, complianceEvidencePackSummary:complianceEvidencePackSummary, providerPilotGovernanceViewModelSummary:providerPilotGovernanceViewModelSummary, providerGovernanceConsoleSummary:providerGovernanceConsoleSummary, providerOperatorReviewLoopSummary:providerOperatorReviewLoopSummary, providerGovernanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary, sandboxProviderReleaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, providerGovernanceReleaseViewModelSummary:providerGovernanceReleaseViewModelSummary, manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary, providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary, providerManualReleaseViewModelSummary:providerManualReleaseViewModelSummary, legalProviderFixtureSummary:legalProviderFixtureSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, sandboxPriceFeedSummary:sandboxPriceFeedSummary, sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary, pricePipelineOrchestratorSummary:pricePipelineOrchestratorSummary, readOnlyCandidateJourneySummary:readOnlyCandidateJourneySummary, providerFixtureViewModelSummary:providerFixtureViewModelSummary, safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeReport({ sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:"failed_safe", checks:[], failures:[failure("failed_safe", "sentinel", "failed_safe")], warnings:[], safety:safety(), redacted:true });
    }
  }
  function sanitizeReport(report) {
    const safe = report && typeof report === "object" ? report : {};
    const sanitized = clone(safe) || {};
    sanitized.sentinelName = SENTINEL_NAME;
    sanitized.appVersion = FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION;
    sanitized.status = safe.status || "failed_safe";
    sanitized.checks = toArray(safe.checks).map(function (item) {
      return {
        checkId:safeText(item.checkId || ""),
        label:safeText(item.label || ""),
        status:item.status === "fail" ? "fail" : "pass",
        message:safeText(item.message || ""),
        redacted:true
      };
    });
    sanitized.failures = toArray(safe.failures).map(function (item) {
      return failure(item.checkId || "failure", item.field || "", item.riskType || "risk");
    });
    sanitized.warnings = toArray(safe.warnings).map(function (item) {
      return {
        warningId:safeText(item.warningId || "warning"),
        message:safeText(item.message || ""),
        redacted:true
      };
    });
    sanitized.safety = Object.assign(safety(), safe.safety || {});
    sanitized.bookingUrl = null;
    sanitized.checkoutUrl = null;
    sanitized.paymentUrl = null;
    sanitized.orderUrl = null;
    sanitized.autoOpen = false;
    sanitized.autoRefresh = false;
    sanitized.payment = false;
    sanitized.order = false;
    sanitized.ticketing = false;
    sanitized.identityUpload = false;
    sanitized.credentialInput = false;
    sanitized.rawResponseStored = false;
    sanitized.rawUserTextStored = false;
    sanitized.secretStored = false;
    sanitized.fileWrite = false;
    sanitized.download = false;
    sanitized.redacted = true;
    return clone(sanitized);
  }
  function runFlightWorkflowSafetyRegressionSentinel(input) { return buildFlightWorkflowSafetyRegressionReport(input); }
  function buildFlightWorkflowSafetyRegressionSentinelAuditDraft(input) { const report = buildFlightWorkflowSafetyRegressionReport(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_AUDIT_DRAFT", sentinelName:SENTINEL_NAME, appVersion:FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, status:report.status, failureCount:report.failures.length, warningCount:report.warnings.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowSafetyRegressionSentinel = { FLIGHT_WORKFLOW_SAFETY_REGRESSION_SENTINEL_VERSION, SENTINEL_NAME, runFlightWorkflowSafetyRegressionSentinel, scanFlightWorkflowSafetyObject, buildFlightWorkflowSafetyRegressionReport, buildFlightWorkflowSafetyRegressionSentinelAuditDraft };
})();
