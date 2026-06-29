const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionManager.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js",
    "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js",
    "apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcCandidateReviewConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcEvidenceReviewChecklist.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcReviewViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionAuditPack.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyReleaseRiskLedger.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcUserFacingCopyFinalization.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyDisclosureReviewBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcCopyReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalCharter.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstReadOnlyProviderAdapterShell.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingDryRunProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRunbookBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistryViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstSandboxProviderConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageDashboard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySourceTrustScore.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxIntegrationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateSession.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateResultBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingLegalProviderFixtureAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCredentialSafetyReview.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceFeedGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFixtureViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformHandoffPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateJourneyBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js"
  ]);
  const manager = windowRef.WeishanReadOnlyQuoteSessionManager;
  const api = windowRef.WeishanReadOnlyQuoteSessionReportCenter;
  assert.equal(api.READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION, "2.2.8");
  const empty = api.buildReadOnlyQuoteSessionReportCenter({});
  assert.equal(empty.status, "empty");
  const session = manager.updateReadOnlyQuoteSession(manager.createReadOnlyQuoteSession({ route:"上海 → 成都", departureDate:"2026-07-15" }), { type:"DRY_RUN_COMPLETED", result:{ runId:"r1", dryRunTopCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980, bookingUrl:"https://blocked.example" }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980, token:"abc" } } });
  const summary = manager.buildReadOnlyQuoteSessionSummary(session);
  const ready = api.buildReadOnlyQuoteSessionReportCenter({ workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sessionSummary:summary, topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980 }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980 }, runHistorySummary:{ totalRunCount:1 }, quoteDeltaSummary:{ status:"not_enough_history" }, replaySummary:{ status:"unavailable" } });
  assert.equal(ready.appVersion, "2.2.8");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "候选报价证据摘要");
  assert.ok(ready.userFacingSummary.labels.includes("只读候选价"));
  assert.ok(ready.userFacingSummary.labels.includes("平台最终为准"));
  assert.ok(ready.userFacingSummary.labels.includes("未锁价"));
  assert.ok(ready.userFacingSummary.labels.includes("不代表可出票"));
  assert.equal(ready.userFacingSummary.canClaimLowestAcrossWeb, false);
  assert.equal(ready.userFacingSummary.canClaimFinalBookablePrice, false);
  assert.equal(ready.userFacingSummary.canReplaceMainResultCard, false);
  assert.equal(ready.safetyReport.rawResponseStored, false);
  assert.equal(ready.userFacingSummary.workflowStateSummary.status, "evidence_ready");
  assert.equal(ready.safetyReport.clarificationSummary.status, "complete");
  assert.equal(ready.safetyReport.workflowStepList[0].label, "生成候选证据");
  assert.equal(ready.safetyReport.workflowUserMessage, "候选证据已生成，平台最终为准。");
  assert.equal(ready.safetyReport.secretStored, false);
  assert.equal(ready.safetyReport.bookingUrl, null);
  assert.equal(ready.safetyReport.payment, false);
  assert.equal(ready.safetyReport.order, false);
  assert.equal(ready.safetyReport.identityUpload, false);
  assert.equal(ready.safetyReport.auditReviewSummary.userFacingSummary.title, "本次机票工作流审计");
  assert.equal(ready.safetyReport.safeSessionExportPreview.canWriteFile, false);
  assert.ok(ready.safetyReport.riskBadgeSummary.line.includes("只读安全"));
  assert.ok(ready.safetyReport.riskBadgeSummary.line.includes("交易动作已阻断"));
  assert.equal(ready.safetyReport.readOnlyConsentSummary, null);
  const rcReady = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, rcCandidateReviewSummary:{ status:"ready_for_review", reviewDecision:{ label:"可以开始 RC 复核" }, userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true }, safeToStartRcReview:true, redacted:true }, rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, redacted:true }, rcReviewViewModelSummary:{ status:"ready_for_review", title:"只读 RC 候选复核", caveat:"该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true });
  assert.equal(rcReady.safetyReport.rcReviewStatus, "ready_for_review");
  assert.equal(rcReady.safetyReport.rcEvidenceStatus, "complete");
  assert.equal(rcReady.userFacingSummary.safeToStartRcReview, true);
  const rcRegressionReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    rcRegressionAuditSummary:{ status:"passed", userFacingSummary:{ resultLabel:"RC 回归审计通过", redacted:true }, redacted:true },
    releaseRiskLedgerSummary:{ status:"clear", userFacingSummary:{ resultLabel:"暂无阻断风险", redacted:true }, riskSummary:{ safeToContinueReleaseCandidate:true }, redacted:true },
    rcRegressionViewModelSummary:{ status:"clear", title:"只读 RC 回归审计", caveat:"该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true },
    rcRegressionStatus:"passed",
    releaseRiskStatus:"clear",
    safeToContinueReleaseCandidate:true
  });
  assert.equal(rcRegressionReady.safetyReport.rcRegressionStatus, "passed");
  assert.equal(rcRegressionReady.safetyReport.releaseRiskStatus, "clear");
  assert.equal(rcRegressionReady.safetyReport.rcRegressionViewModelSummary.title, "只读 RC 回归审计");
  assert.equal(rcRegressionReady.userFacingSummary.safeToContinueReleaseCandidate, true);
  const rcCopyReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    rcCopyFinalizationSummary:{ status:"finalized", userFacingSummary:{ resultLabel:"文案可以定稿", redacted:true }, redacted:true },
    safetyDisclosureReviewSummary:{ status:"approved", userFacingSummary:{ resultLabel:"安全披露通过", redacted:true }, redacted:true },
    rcCopyReviewViewModelSummary:{ status:"approved", title:"只读 RC 文案定稿与安全披露", caveat:"该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true },
    rcCopyReviewStatus:"finalized",
    safetyDisclosureStatus:"approved",
    safeToFinalizeUserFacingCopy:true
  });
  assert.equal(rcCopyReady.safetyReport.rcCopyReviewStatus, "finalized");
  assert.equal(rcCopyReady.safetyReport.safetyDisclosureStatus, "approved");
  assert.equal(rcCopyReady.safetyReport.rcCopyReviewViewModelSummary.title, "只读 RC 文案定稿与安全披露");
  assert.equal(rcCopyReady.userFacingSummary.safeToFinalizeUserFacingCopy, true);
  const globalGoal = windowRef.WeishanGlobalShoppingProductGoalCharter.buildGlobalShoppingProductGoalCharter();
  const jumpBoundary = windowRef.WeishanGlobalShoppingJumpToPlatformBoundary.buildGlobalShoppingJumpToPlatformBoundary();
  const legalProviderFixture = windowRef.WeishanGlobalShoppingLegalProviderFixtureAdapter.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } });
  const credentialSafety = windowRef.WeishanGlobalShoppingProviderCredentialSafetyReview.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture" });
  const sandboxPriceFeed = windowRef.WeishanGlobalShoppingSandboxPriceFeedGate.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, normalizedSourceInputs:legalProviderFixture.normalizedSourceInputs });
  const responseContract = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract.buildGlobalShoppingSandboxProviderResponseContract({ providerFixture:legalProviderFixture, credentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, normalizedSourceInputs:legalProviderFixture.normalizedSourceInputs, officialFixturePrice:{ title:"SHA-CTU", basePrice:900 }, partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }] });
  const providerFixtureVm = windowRef.WeishanGlobalShoppingProviderFixtureViewModel.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed });
  const goalView = windowRef.WeishanGlobalShoppingProductGoalViewModel.buildGlobalShoppingProductGoalViewModel({ globalShoppingProductGoalSummary:globalGoal, jumpToPlatformBoundarySummary:jumpBoundary });
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({ providerFixture:legalProviderFixture, providerCredentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, providerResponseContract:responseContract, connectorMode:"fixture", fixturePayload:{ providerId:"provider_1", providerName:"Fixture Provider", redacted:true } });
  const replay = windowRef.WeishanGlobalShoppingFixtureReplayConsole.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"fixture_replay_report_center", replayMode:"fixture", providerId:"provider_1", providerName:"Fixture Provider", redacted:true } });
  const normalizer = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer();
  const sameItemMatcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ priceSourceNormalizationSummary:normalizer });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:sameItemMatcher });
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ priceSourceNormalizationSummary:normalizer });
  const coveredBoard = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const deepLink = windowRef.WeishanGlobalShoppingExternalDeepLinkSafetyGate.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", sourceName:"Sandbox Platform", disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。" });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const partner = windowRef.WeishanGlobalShoppingPartnerLinkPolicy.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  const availability = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:partner });
  const sandbox = windowRef.WeishanGlobalShoppingSandboxDeepLinkCandidate.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability });
  const preview = windowRef.WeishanGlobalShoppingJumpToPlatformHandoffPreview.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill, sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  const sandboxVm = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel.buildGlobalShoppingSandboxHandoffViewModel({ sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  const manualPlatformReviewCockpit = { status:"ready", userFacingSummary:{ title:"手动平台复核驾驶舱", resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true };
  const handoffAcceptanceWalkthrough = { status:"ready", userFacingSummary:{ title:"交接包接受演练", resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true };
  const platformRealityCheckBoard = { status:"ready", userFacingSummary:{ title:"平台真实页面复核清单", resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true };
  const manualPlatformReviewViewModel = { status:"ready", title:"手动平台复核与现实检查", userFacingSummary:{ title:"手动平台复核与现实检查", resultLabel:"手动平台复核与现实检查已准备", redacted:true }, redacted:true };
  const pipeline = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator.buildGlobalShoppingPricePipelineOrchestrator({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, sandboxProviderResponseContract:responseContract, readOnlyProviderSandboxConnector:connector, fixtureReplayConsole:replay, priceSourceNormalizer:normalizer, officialPriceAnchorSlot:anchor, sameItemMatcher:sameItemMatcher, duplicateCandidateMerger:merger, coveredLowestCandidateBoard:coveredBoard, sandboxHandoffViewModel:sandboxVm });
  const journey = windowRef.WeishanGlobalShoppingReadOnlyCandidateJourneyBoard.buildGlobalShoppingReadOnlyCandidateJourneyBoard({ pricePipelineOrchestratorSummary:pipeline, legalProviderFixtureSummary:legalProviderFixture, coveredLowestCandidateBoardSummary:coveredBoard, sandboxHandoffViewModelSummary:sandboxVm });
  const realSandboxGate = windowRef.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate.buildGlobalShoppingReadOnlyRealProviderSandboxGate({ readOnlyProviderSandboxConnectorSummary:connector, fixtureReplayConsoleSummary:replay, normalizedPriceCandidateBoardSummary:{ status:"ready", title:"归一化价格候选板", redacted:true }, providerResponseContractSummary:responseContract, pricePipelineOrchestratorSummary:pipeline, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed });
  const requestEnvelope = windowRef.WeishanGlobalShoppingProviderRequestEnvelopeBuilder.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", providerName:"Fixture Provider", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1, userRegion:"CN" });
  const callAudit = windowRef.WeishanGlobalShoppingProviderCallAuditLedger.buildGlobalShoppingProviderCallAuditLedger({ providerId:"provider_1", auditEntries:[{ auditId:"audit_1", providerId:"provider_1", requestMode:"sandbox_ready", callStatus:"dry_run", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }] });
  const readiness = windowRef.WeishanGlobalShoppingProviderSandboxReadinessViewModel.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:realSandboxGate, providerRequestEnvelopeSummary:requestEnvelope, providerCallAuditLedgerSummary:callAudit });
  const killSwitch = windowRef.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch.buildGlobalShoppingProviderSandboxSafetyKillSwitch({});
  const adapterShell = windowRef.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({ providerId:"provider_1", providerName:"Fixture Provider", adapterMode:"dry_run", providerType:"fixture" });
  const dryRunHarness = windowRef.WeishanGlobalShoppingProviderSandboxDryRunHarness.buildGlobalShoppingProviderSandboxDryRunHarness({ providerRequestEnvelopeSummary:requestEnvelope, realProviderSandboxGateSummary:realSandboxGate, providerCallAuditLedgerSummary:callAudit, providerSandboxSafetyKillSwitchSummary:killSwitch, firstReadOnlyProviderAdapterShellSummary:adapterShell });
  const dryRunVm = windowRef.WeishanGlobalShoppingProviderSandboxDryRunViewModel.buildGlobalShoppingProviderSandboxDryRunViewModel({ providerSandboxDryRunHarnessSummary:dryRunHarness, firstReadOnlyProviderAdapterShellSummary:adapterShell, providerSandboxSafetyKillSwitchSummary:killSwitch });
  const adapterRegistry = windowRef.WeishanGlobalShoppingProviderAdapterRegistry.buildGlobalShoppingProviderAdapterRegistry({ registryMode:"dry_run", adapterShells:[{ adapterId:"global_fixture_provider_dry_run", providerId:"provider_1", providerName:"Fixture Provider", providerType:"fixture", adapterMode:"dry_run", readOnly:true, sandboxOnly:true, productionDisabled:true, redactedOutputOnly:true }] });
  const responseNormalizer = windowRef.WeishanGlobalShoppingDryRunProviderResponseNormalizer.buildGlobalShoppingDryRunProviderResponseNormalizer({ adapterRegistry:adapterRegistry, dryRunHarness:dryRunHarness, responseMode:"dry_run", redactedResponseSummary:{ responseMode:"dry_run", providerId:"provider_1", providerName:"Fixture Provider", redacted:true }, fixturePrices:[{ title:"SHA-CTU", basePrice:900, taxAmount:120, currency:"CNY" }] });
  const runbookBoard = windowRef.WeishanGlobalShoppingSandboxProviderRunbookBoard.buildGlobalShoppingSandboxProviderRunbookBoard({ providerAdapterRegistrySummary:adapterRegistry, providerSandboxDryRunHarnessSummary:dryRunHarness, firstReadOnlyProviderAdapterShellSummary:adapterShell, providerSandboxSafetyKillSwitchSummary:killSwitch, providerRequestEnvelopeSummary:requestEnvelope, providerCallAuditLedgerSummary:callAudit, sandboxProviderResponseContractSummary:responseContract, dryRunProviderResponseNormalizerSummary:responseNormalizer });
  const adapterRegistryView = windowRef.WeishanGlobalShoppingProviderAdapterRegistryViewModel.buildGlobalShoppingProviderAdapterRegistryViewModel({ providerAdapterRegistrySummary:adapterRegistry, dryRunProviderResponseNormalizerSummary:responseNormalizer, sandboxProviderRunbookSummary:runbookBoard, safeToProceedWithFirstSandboxProviderConnectorImplementation:true });
  const firstSandboxConnector = windowRef.WeishanGlobalShoppingFirstSandboxProviderConnector.buildGlobalShoppingFirstSandboxProviderConnector({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"fixture", itemType:"flight", connectorMode:"dry_run", adapterRegistry:adapterRegistry, adapterShell:adapterShell, dryRunHarness:dryRunHarness, safetyKillSwitch:killSwitch, requestEnvelope:requestEnvelope, providerRunbook:runbookBoard, dryRunResponseNormalizer:responseNormalizer, normalizedSourceInputs:responseNormalizer.normalizedSourceInputs });
  const coverageDashboard = windowRef.WeishanGlobalShoppingProviderCoverageDashboard.buildGlobalShoppingProviderCoverageDashboard({ adapterRegistrySummary:adapterRegistry, firstSandboxProviderConnectorSummary:firstSandboxConnector, normalizedSourceInputs:responseNormalizer.normalizedSourceInputs });
  const sourceTrust = windowRef.WeishanGlobalShoppingReadOnlySourceTrustScore.buildGlobalShoppingReadOnlySourceTrustScore({ dryRunProviderResponseNormalizerSummary:responseNormalizer });
  const coverageViewModel = windowRef.WeishanGlobalShoppingProviderCoverageViewModel.buildGlobalShoppingProviderCoverageViewModel({ firstSandboxProviderConnectorSummary:firstSandboxConnector, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true });
  const integrationGate = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed, firstSandboxProviderConnectorSummary:firstSandboxConnector, providerAdapterRegistrySummary:adapterRegistry, providerSandboxDryRunHarnessSummary:dryRunHarness, providerSandboxSafetyKillSwitchSummary:killSwitch, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, pricePipelineOrchestratorSummary:{ status:"ready", redacted:true }, jumpToPlatformHandoffPreviewSummary:preview });
  const sandboxSession = windowRef.WeishanGlobalShoppingSandboxPriceCandidateSession.buildGlobalShoppingSandboxPriceCandidateSession({ readOnlyProviderSandboxIntegrationGateSummary:integrationGate, firstSandboxProviderConnectorSummary:firstSandboxConnector, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, pricePipelineOrchestratorSummary:{ status:"ready", officialPriceAnchorSummary:anchor, coveredLowestCandidateBoardSummary:coveredBoard, redacted:true }, coveredLowestCandidateBoardSummary:coveredBoard, jumpToPlatformHandoffPreviewSummary:preview, officialPriceAnchorSummary:anchor });
  const sandboxResultBoard = windowRef.WeishanGlobalShoppingSandboxPriceCandidateResultBoard.buildGlobalShoppingSandboxPriceCandidateResultBoard({ sandboxPriceCandidateSessionSummary:sandboxSession, officialPriceAnchorSummary:anchor, coveredLowestCandidateBoardSummary:coveredBoard, readOnlySourceTrustScoreSummary:sourceTrust, jumpToPlatformHandoffPreviewSummary:preview, pricePipelineOrchestratorSummary:pipeline });
  const globalReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    globalShoppingProductGoalSummary:globalGoal,
    jumpToPlatformBoundarySummary:jumpBoundary,
    globalShoppingProductGoalViewModelSummary:goalView,
    readOnlyProviderSandboxConnectorSummary:connector,
    fixtureReplayConsoleSummary:replay,
    normalizedPriceCandidateBoardSummary:{ status:"ready", title:"归一化价格候选板", redacted:true },
    realProviderSandboxGateSummary:realSandboxGate,
    providerRequestEnvelopeSummary:requestEnvelope,
    providerCallAuditLedgerSummary:callAudit,
    providerSandboxReadinessViewModelSummary:readiness,
    providerSandboxDryRunHarnessSummary:dryRunHarness,
    firstReadOnlyProviderAdapterShellSummary:adapterShell,
    providerSandboxSafetyKillSwitchSummary:killSwitch,
    providerSandboxDryRunViewModelSummary:dryRunVm,
    providerAdapterRegistrySummary:adapterRegistry,
    dryRunProviderResponseNormalizerSummary:responseNormalizer,
    sandboxProviderRunbookSummary:runbookBoard,
    providerAdapterRegistryViewModelSummary:adapterRegistryView,
    firstSandboxProviderConnectorSummary:firstSandboxConnector,
    providerCoverageDashboardSummary:coverageDashboard,
    readOnlySourceTrustScoreSummary:sourceTrust,
    providerCoverageViewModelSummary:coverageViewModel,
    readOnlyProviderSandboxIntegrationGateSummary:integrationGate,
    sandboxPriceCandidateSessionSummary:sandboxSession,
    sandboxPriceCandidateResultBoardSummary:sandboxResultBoard,
    legalProviderFixtureSummary:legalProviderFixture,
    providerCredentialSafetySummary:credentialSafety,
    sandboxPriceFeedSummary:sandboxPriceFeed,
    sandboxProviderResponseContractSummary:responseContract,
    pricePipelineOrchestratorSummary:pipeline,
    readOnlyCandidateJourneySummary:journey,
    providerFixtureViewModelSummary:providerFixtureVm,
    priceSourceNormalizationSummary:normalizer,
    officialPriceAnchorSummary:anchor,
    sameItemMatcherSummary:sameItemMatcher,
    duplicateCandidateMergerSummary:merger,
    coveredLowestCandidateBoardSummary:coveredBoard,
    externalDeepLinkSafetySummary:deepLink,
    searchParameterPrefillSummary:prefill,
    jumpToPlatformHandoffPreviewSummary:preview,
    sandboxDeepLinkCandidateSummary:sandbox,
    platformAvailabilitySummary:availability,
    partnerLinkPolicySummary:partner,
    sandboxHandoffViewModelSummary:sandboxVm,
    manualPlatformReviewCockpitSummary:manualPlatformReviewCockpit,
    handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthrough,
    platformRealityCheckBoardSummary:platformRealityCheckBoard,
    manualPlatformReviewViewModelSummary:manualPlatformReviewViewModel,
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ title:"用户手动复核流程", resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ title:"平台核对进度追踪", resultLabel:"平台核对进度已准备", redacted:true }, redacted:true },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ title:"安全下一步", resultLabel:"安全下一步已准备", redacted:true }, redacted:true },
    userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", userFacingSummary:{ title:"用户手动复核与安全下一步", resultLabel:"用户手动复核与安全下一步已准备", redacted:true }, redacted:true },
    globalShoppingGoalStatus:"aligned",
    jumpBoundaryStatus:"safe",
    legalProviderFixtureStatus:"ready",
    providerCredentialSafetyStatus:"ready",
    sandboxPriceFeedStatus:"ready",
    sandboxProviderResponseContractStatus:"ready",
    pricePipelineStatus:"ready",
    readOnlyCandidateJourneyStatus:"ready",
    readOnlyProviderSandboxConnectorStatus:"ready",
    fixtureReplayStatus:"ready",
    normalizedPriceCandidateBoardStatus:"ready",
    realProviderSandboxGateStatus:"ready",
    providerRequestEnvelopeStatus:"ready",
    providerCallAuditLedgerStatus:"ready",
    providerSandboxReadinessStatus:"ready",
    providerSandboxDryRunStatus:"ready",
    providerAdapterShellStatus:"ready",
    providerKillSwitchStatus:"clear",
    providerSandboxDryRunViewModelStatus:"ready",
    providerAdapterRegistryStatus:"ready",
    dryRunResponseNormalizerStatus:"ready",
    sandboxProviderRunbookStatus:"ready",
    providerAdapterRegistryViewModelStatus:"ready",
    firstSandboxProviderConnectorStatus:"ready",
    providerCoverageStatus:"ready",
    sourceTrustStatus:"ready",
    providerCoverageViewModelStatus:"ready",
    providerSandboxIntegrationGateStatus:"ready",
    sandboxPriceCandidateSessionStatus:"ready",
    sandboxPriceCandidateResultBoardStatus:"ready",
    safeToProceedWithReadOnlyPriceProviderSandbox:true,
    safeToProceedWithFirstRealReadOnlyProviderSandbox:true,
    safeToProceedWithFirstReadOnlySandboxDryRun:true,
    safeToProceedWithFirstProviderSandboxFixtureDryRun:true,
    safeToProceedWithFirstSandboxProviderConnectorImplementation:true,
    safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true,
    safeToProceedWithSandboxCandidateUserPreview:true,
    safeToProceedWithRealReadOnlyProviderSandbox:true,
    safeToProceedWithJumpToPlatformMvp:true,
    safeToProceedWithDeepLinkSafetyGate:true,
    externalDeepLinkSafetyStatus:"safe",
    searchPrefillStatus:"safe",
    handoffPreviewStatus:"ready",
    sandboxDeepLinkStatus:"ready",
    platformAvailabilityStatus:"available",
    partnerLinkPolicyStatus:"compliant",
    sandboxHandoffStatus:"ready",
    manualPlatformReviewCockpitStatus:"ready",
    handoffAcceptanceWalkthroughStatus:"ready",
    platformRealityCheckStatus:"ready",
    manualPlatformReviewViewModelStatus:"ready",
    safeToProceedWithSandboxDeepLinkCandidate:true,
    safeToProceedWithPartnerFixtureAdapter:true,
    safeToProceedWithManualPlatformUserEducation:true,
    userFacingManualReviewFlowStatus:"ready",
    platformVerificationProgressStatus:"ready",
    safeNextActionPanelStatus:"ready",
    userManualReviewViewModelStatus:"ready",
    safeToProceedWithManualExternalPlatformVisitEducation:true
  });
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalSummary.title, "全球购产品目标");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformBoundarySummary.title, "跳转至平台自行下单边界");
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalViewModelSummary.title, "全球购产品目标与跳转边界");
  assert.equal(globalReady.userFacingSummary.legalProviderFixtureSummary.title, "合法 Provider Fixture 适配器");
  assert.equal(globalReady.userFacingSummary.providerCredentialSafetySummary.title, "Provider 凭据安全复核");
  assert.equal(globalReady.userFacingSummary.sandboxPriceFeedSummary.title, "Sandbox 价格 Feed 闸门");
  assert.equal(globalReady.userFacingSummary.sandboxProviderResponseContractSummary.title, "Sandbox Provider 响应合同");
  assert.equal(globalReady.userFacingSummary.pricePipelineOrchestratorSummary.title, "全球购只读价格流水线");
  assert.equal(globalReady.userFacingSummary.readOnlyCandidateJourneySummary.title, "全球购只读候选旅程");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunHarnessSummary.title, "Provider Sandbox 干跑框架");
  assert.equal(globalReady.userFacingSummary.firstReadOnlyProviderAdapterShellSummary.title, "第一个只读 Provider Adapter 外壳");
  assert.equal(globalReady.userFacingSummary.providerSandboxSafetyKillSwitchSummary.title, "Provider Sandbox 安全熔断器");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunViewModelSummary.title, "Provider Sandbox 干跑准备");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistrySummary.title, "Provider Adapter 注册表");
  assert.equal(globalReady.userFacingSummary.dryRunProviderResponseNormalizerSummary.title, "Dry-Run Provider 响应归一化器");
  assert.equal(globalReady.userFacingSummary.sandboxProviderRunbookSummary.title, "Sandbox Provider 接入运行手册");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryViewModelSummary.title, "Provider Adapter 注册与接入手册");
  assert.equal(globalReady.userFacingSummary.firstSandboxProviderConnectorSummary.title, "第一个 Sandbox Provider Connector");
  assert.equal(globalReady.userFacingSummary.providerCoverageDashboardSummary.title, "Provider 覆盖看板");
  assert.equal(globalReady.userFacingSummary.readOnlySourceTrustScoreSummary.title, "只读来源可信度评分");
  assert.equal(globalReady.userFacingSummary.providerCoverageViewModelSummary.title, "Provider 覆盖与来源可信度");
  assert.equal(globalReady.userFacingSummary.readOnlyProviderSandboxIntegrationGateSummary.title, "只读 Provider Sandbox 接入闸门");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateSessionSummary.title, "Sandbox 价格候选会话");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateResultBoardSummary.title, "Sandbox 价格候选结果");
  assert.equal(globalReady.userFacingSummary.providerFixtureViewModelSummary.title, "合法 Provider Fixture 与 Sandbox 价格 Feed");
  assert.equal(globalReady.userFacingSummary.sameItemMatcherSummary.title, "同款候选识别");
  assert.equal(globalReady.userFacingSummary.duplicateCandidateMergerSummary.title, "重复候选合并");
  assert.equal(globalReady.userFacingSummary.coveredLowestCandidateBoardSummary.title, "已覆盖来源候选价合并");
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetySummary.title, "外部平台跳转安全闸门");
  assert.equal(globalReady.userFacingSummary.searchParameterPrefillSummary.title, "搜索参数预填闸门");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformHandoffPreviewSummary.title, "跳转至平台查看");
  assert.equal(globalReady.userFacingSummary.sandboxDeepLinkCandidateSummary.title, "Sandbox 跳转候选");
  assert.equal(globalReady.userFacingSummary.platformAvailabilitySummary.title, "平台可用性");
  assert.equal(globalReady.userFacingSummary.partnerLinkPolicySummary.title, "合作/联盟链接政策");
  assert.equal(globalReady.userFacingSummary.sandboxHandoffViewModelSummary.title, "Sandbox 跳转候选与平台可用性");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewCockpitSummary.title, "手动平台复核驾驶舱");
  assert.equal(globalReady.userFacingSummary.handoffAcceptanceWalkthroughSummary.title, "交接包接受演练");
  assert.equal(globalReady.userFacingSummary.platformRealityCheckBoardSummary.title, "平台真实页面复核清单");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewViewModelSummary.title, "手动平台复核与现实检查");
  assert.equal(globalReady.userFacingSummary.userFacingManualReviewFlowSummary.title, "用户手动复核流程");
  assert.equal(globalReady.userFacingSummary.platformVerificationProgressTrackerSummary.title, "平台核对进度追踪");
  assert.equal(globalReady.userFacingSummary.safeNextActionPanelSummary.title, "安全下一步");
  assert.equal(globalReady.userFacingSummary.userManualReviewViewModelSummary.title, "用户手动复核与安全下一步");
  assert.equal(globalReady.userFacingSummary.globalShoppingGoalStatus, "aligned");
  assert.equal(globalReady.userFacingSummary.jumpBoundaryStatus, "safe");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithJumpToPlatformMvp, true);
  assert.equal(globalReady.userFacingSummary.legalProviderFixtureStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCredentialSafetyStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryStatus, "ready");
  assert.equal(globalReady.userFacingSummary.dryRunResponseNormalizerStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxProviderRunbookStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.firstSandboxProviderConnectorStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCoverageStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sourceTrustStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCoverageViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerSandboxIntegrationGateStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateSessionStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateResultBoardStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithSandboxCandidateUserPreview, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstSandboxProviderConnectorImplementation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstReadOnlyProviderSandboxIntegration, true);
  assert.equal(globalReady.userFacingSummary.sandboxPriceFeedStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxProviderResponseContractStatus, "ready");
  assert.equal(globalReady.userFacingSummary.pricePipelineStatus, "ready");
  assert.equal(globalReady.userFacingSummary.readOnlyCandidateJourneyStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterShellStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerKillSwitchStatus, "clear");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithReadOnlyPriceProviderSandbox, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithRealReadOnlyProviderSandbox, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstProviderSandboxFixtureDryRun, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithDeepLinkSafetyGate, true);
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetyStatus, "safe");
  assert.equal(globalReady.userFacingSummary.searchPrefillStatus, "safe");
  assert.equal(globalReady.userFacingSummary.handoffPreviewStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxDeepLinkStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformAvailabilityStatus, "available");
  assert.equal(globalReady.userFacingSummary.partnerLinkPolicyStatus, "compliant");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewCockpitStatus, "ready");
  assert.equal(globalReady.userFacingSummary.handoffAcceptanceWalkthroughStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformRealityCheckStatus, "ready");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.userFacingManualReviewFlowStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformVerificationProgressStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeNextActionPanelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.userManualReviewViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithSandboxDeepLinkCandidate, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithPartnerFixtureAdapter, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithManualPlatformUserEducation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithManualExternalPlatformVisitEducation, true);
  const decisionReviewReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox 候选对比工作台", resultLabel:"候选对比已准备", caveat:"当前仅比较脱敏 sandbox 候选。", redacted:true }, redacted:true },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Provider 证据对比矩阵", resultLabel:"证据矩阵已准备", caveat:"当前矩阵只展示脱敏 sandbox 证据摘要。", redacted:true }, redacted:true },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready", userFacingSummary:{ title:"只读跳转交接演练", resultLabel:"交接演练已准备", caveat:"当前只演练非敏感搜索参数准备度。", redacted:true }, redacted:true },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核", caveat:"当前仅用于复核 sandbox 候选，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。", redacted:true },
    sandboxCandidateComparisonWorkbenchStatus:"ready",
    providerEvidenceComparisonMatrixStatus:"ready",
    readOnlyHandoffReadinessDrillStatus:"ready",
    sandboxDecisionReviewStatus:"ready",
    safeToProceedWithSandboxDecisionReview:true
  });
  assert.equal(decisionReviewReady.safetyReport.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary.title, "Sandbox 候选对比工作台");
  assert.equal(decisionReviewReady.safetyReport.providerEvidenceComparisonMatrixSummary.userFacingSummary.title, "Provider 证据对比矩阵");
  assert.equal(decisionReviewReady.safetyReport.readOnlyHandoffReadinessDrillSummary.userFacingSummary.title, "只读跳转交接演练");
  assert.equal(decisionReviewReady.safetyReport.sandboxDecisionReviewViewModelSummary.title, "Sandbox 候选决策复核");
  assert.equal(decisionReviewReady.userFacingSummary.sandboxDecisionReviewStatus, "ready");
  assert.equal(decisionReviewReady.userFacingSummary.safeToProceedWithSandboxDecisionReview, true);
  const withOnboarding = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, pilotOnboardingSummary:{ status:"allowed", redacted:true }, readOnlyConsentSummary:{ status:"accepted", redacted:true }, pilotEntryStatus:"allowed", canEnterReadOnlyPilot:true, pilotConsentRequired:false });
  assert.equal(withOnboarding.safetyReport.pilotEntryStatus, "allowed");
  assert.equal(withOnboarding.safetyReport.canEnterReadOnlyPilot, true);
  assert.equal(ready.actions.providerConfirmationRequiresUserConfirm, true);
  assert.equal(ready.actions.canPayHere, false);
  assert.equal(ready.actions.canOrderHere, false);
  assert.equal(ready.actions.canUploadIdentityHere, false);
  const reportWithLedger = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, eventLedgerSummary:{ lastActionId:"select_candidate", lastActionStatus:"executed_local", lastActionMessage:"动作已执行" } });
  assert.equal(reportWithLedger.userFacingSummary.lastActionId, "select_candidate");
  assert.equal(reportWithLedger.safetyReport.lastActionMessage, "动作已执行");
  assert.ok(ready.userFacingSummary.decisionAssistantSummary);
  assert.ok(ready.userFacingSummary.candidateComparisonSummary);
  assert.ok(ready.safetyReport.decisionAssistantSummary);
  assert.ok(ready.safetyReport.candidateComparisonSummary);
  assert.ok(Array.isArray(ready.safetyReport.decisionSafetyWarnings));
  const withPilotOps = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, pilotOpsSummary:{ status:"healthy", primaryRisk:{ riskId:"none", label:"无主要风险" } }, nextCohortDecisionSummary:{ status:"advance", decision:{ decisionId:"advance_next_cohort", label:"可以进入下一批只读测试" } }, pilotOpsStatus:"healthy", nextCohortDecisionStatus:"advance", pilotOpsPrimaryRisk:{ riskId:"none", label:"无主要风险" } });
  assert.equal(withPilotOps.status, "ready");
  const userFacing = JSON.stringify(ready.userFacingSummary);
  const userFacingValues = userFacing.replace(/"[^"]+":/g, "");
  assert.equal(/rawResponse|token|key|secret|bookingUrl|paymentUrl|orderUrl/i.test(userFacingValues), false);
  assert.equal(/全网最低|已锁价|可以出票|可直接出票|真实最终价/.test(userFacing), false);
  const malformed = api.buildReadOnlyQuoteSessionReportCenter({ session:null });
  assert.equal(malformed.status, "failed_safe");
  const audit = api.buildReadOnlyQuoteSessionReportCenterAuditDraft({ sessionSummary:summary });
  assert.equal(audit.providerConfirmationRequiresUserConfirm, true);
  console.log("READ_ONLY_QUOTE_SESSION_REPORT_CENTER PASS");
}
main();
