const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstSandboxProviderConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageDashboard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySourceTrustScore.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxIntegrationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateSession.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateResultBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxSessionReplayCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceTrace.js",
    "apps/desktop/src/renderer/core/globalShoppingCandidateConfidenceExplainer.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxReplayViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxCandidateComparisonWorkbench.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceComparisonMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffReadinessDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDecisionReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPlatformHandoffSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js",
    "apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffPacketPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformPreflightSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingUserActionBoundaryReceipt.js",
    "apps/desktop/src/renderer/core/globalShoppingHandoffPacketViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingUserFacingManualReviewFlow.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVerificationProgressTracker.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeNextActionPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingUserManualReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformHandoffSimulationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformVisitPreparationCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformBoundaryBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalUserSafetyChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js",
    "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js",
    "apps/desktop/src/renderer/core/globalShoppingCommerceSessionRecapViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySandboxProviderIntegrationBlueprint.js",
    "apps/desktop/src/renderer/core/globalShoppingCredentialIsolationReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractSelectionBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderPlanningViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js",
    "apps/desktop/src/renderer/core/globalShoppingCredentialVaultInterfaceStub.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntegrationPrepViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchSimulationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator;
  assert.equal(api.GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION, "3.7.0");

  const responseContract = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    officialFixturePrice:{ title:"Official Fixture", basePrice:920 },
    partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }]
  });
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:responseContract
  });
  const replay = windowRef.WeishanGlobalShoppingFixtureReplayConsole.buildGlobalShoppingFixtureReplayConsole({
    connectorSummary:connector,
    replayPayload:{
      replayId:"fixture_replay_pipeline",
      replayMode:"fixture",
      providerId:"fixture_provider",
      providerName:"Fixture Provider",
      redacted:true
    }
  });
  const normalization = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer({});
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:normalization.normalizedCandidates });
  const matcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:normalization.normalizedCandidates });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:matcher });
  const covered = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const normalizedBoard = windowRef.WeishanGlobalShoppingNormalizedPriceCandidateBoard.buildGlobalShoppingNormalizedPriceCandidateBoard({
    readOnlyProviderSandboxConnectorSummary:connector,
    fixtureReplayConsoleSummary:replay,
    pricePipelineOrchestratorSummary:{ status:"ready", redacted:true }
  });
  const handoff = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel.buildGlobalShoppingSandboxHandoffViewModel({
    sandboxDeepLinkCandidateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 跳转候选已准备", redacted:true } },
    platformAvailabilitySummary:{ status:"available", userFacingSummary:{ resultLabel:"平台候选可展示", redacted:true } },
    partnerLinkPolicySummary:{ status:"compliant", userFacingSummary:{ resultLabel:"合作链接政策合规", redacted:true } },
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } }
  });
  const dryRunHarness = { status:"ready", userFacingSummary:{ title:"Provider Sandbox 干跑框架", resultLabel:"干跑框架已准备", redacted:true }, redacted:true };
  const adapterShell = { status:"ready", userFacingSummary:{ title:"第一个只读 Provider Adapter 外壳", resultLabel:"Adapter 外壳已准备", redacted:true }, redacted:true };
  const killSwitch = { status:"clear", userFacingSummary:{ title:"Provider Sandbox 安全熔断器", resultLabel:"安全熔断器未触发", redacted:true }, redacted:true };
  const dryRunViewModel = { status:"ready", title:"Provider Sandbox 干跑准备", redacted:true };
  const manualPlatformReviewCockpit = { status:"ready", userFacingSummary:{ title:"手动平台复核驾驶舱", resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true };
  const handoffAcceptanceWalkthrough = { status:"ready", userFacingSummary:{ title:"交接包接受演练", resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true };
  const platformRealityCheckBoard = { status:"ready", userFacingSummary:{ title:"平台真实页面复核清单", resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true };
  const manualPlatformReviewViewModel = { status:"ready", title:"手动平台复核与现实检查", userFacingSummary:{ title:"手动平台复核与现实检查", resultLabel:"手动平台复核与现实检查已准备", redacted:true }, redacted:true };
  const userFacingManualReviewFlow = { status:"ready", userFacingSummary:{ title:"用户手动复核流程", resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true };
  const platformVerificationProgressTracker = { status:"ready", userFacingSummary:{ title:"平台核对进度追踪", resultLabel:"平台核对进度已准备", redacted:true }, redacted:true };
  const safeNextActionPanel = { status:"ready", userFacingSummary:{ title:"安全下一步", resultLabel:"安全下一步已准备", redacted:true }, redacted:true };
  const userManualReviewViewModel = { status:"ready", title:"用户手动复核与安全下一步", userFacingSummary:{ title:"用户手动复核与安全下一步", resultLabel:"用户手动复核与安全下一步已准备", redacted:true }, redacted:true };
  const sandboxProviderMockRuntimeSummary = { status:"ready", userFacingSummary:{ title:"Sandbox Provider Mock Runtime", resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, safeToProceedWithMockAdapterRuntimeHardening:true, redacted:true };
  const vaultBoundaryContractSummary = { status:"ready", userFacingSummary:{ title:"Vault Boundary Contract", resultLabel:"Vault 边界合同已准备", redacted:true }, redacted:true };
  const legalApprovalWorkflowBoardSummary = { status:"ready", userFacingSummary:{ title:"法务审批流程板", resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true };
  const providerMockRuntimeViewModelSummary = { status:"ready", title:"Provider Mock Runtime 与审批准备", userFacingSummary:{ title:"Provider Mock Runtime 与审批准备", resultLabel:"Provider Mock Runtime 与审批准备已准备", redacted:true }, redacted:true };
  const mockProviderAdapterRegistryRuntimeSummary = { status:"ready", userFacingSummary:{ title:"Mock Provider Adapter 注册运行时", resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, redacted:true };
  const providerContractReplayHarnessSummary = { status:"ready", userFacingSummary:{ title:"Provider 合同回放器", resultLabel:"Provider 合同回放器已准备", redacted:true }, redacted:true };
  const providerLaunchReadinessBoardSummary = { status:"ready", userFacingSummary:{ title:"Provider 启动准备总闸门", resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, redacted:true };
  const providerLaunchReadinessViewModelSummary = { status:"ready", title:"Provider 启动准备与合同回放", redacted:true };
  const providerSandboxPilotControlRoomSummary = { status:"ready", userFacingSummary:{ title:"Provider Sandbox Pilot 控制室", resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true };
  const mockProviderIncidentDrillSummary = { status:"ready", userFacingSummary:{ title:"Mock Provider 事故演练", resultLabel:"Mock 事故演练已准备", redacted:true }, redacted:true };
  const productionBlockerMatrixSummary = { status:"ready", userFacingSummary:{ title:"Production 阻断矩阵", resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true };
  const providerPilotControlViewModelSummary = { status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true };
  const firstSandboxConnector = windowRef.WeishanGlobalShoppingFirstSandboxProviderConnector.buildGlobalShoppingFirstSandboxProviderConnector({ providerId:"fixture_provider", providerName:"Fixture Provider", providerType:"fixture", itemType:"flight", connectorMode:"dry_run", adapterRegistry:{ status:"ready", adapters:[{ providerType:"official", itemType:"flight", region:"CN", redacted:true }], redacted:true }, adapterShell:adapterShell, dryRunHarness:dryRunHarness, safetyKillSwitch:killSwitch, requestEnvelope:{ status:"ready", requestEnvelope:{ requestMeta:{ providerId:"fixture_provider", providerName:"Fixture Provider", itemType:"flight" } }, redacted:true }, providerRunbook:{ status:"ready", redacted:true }, normalizedSourceInputs:[{ sourceId:"official_fixture_1", sourceName:"Official Fixture", sourceType:"official", itemType:"flight", redacted:true }] });
  const coverageDashboard = windowRef.WeishanGlobalShoppingProviderCoverageDashboard.buildGlobalShoppingProviderCoverageDashboard({ adapterRegistrySummary:{ adapters:[{ providerType:"official", itemType:"flight", region:"CN", redacted:true }] }, firstSandboxProviderConnectorSummary:firstSandboxConnector, normalizedSourceInputs:[{ sourceId:"official_fixture_1", sourceName:"Official Fixture", sourceType:"official", itemType:"flight", redacted:true }] });
  const sourceTrust = windowRef.WeishanGlobalShoppingReadOnlySourceTrustScore.buildGlobalShoppingReadOnlySourceTrustScore({ sources:[{ sourceId:"official_fixture_1", sourceName:"Official Fixture", sourceType:"official", basePrice:920, currency:"CNY", lastCheckedAt:"redacted_now", redacted:true }] });
  const coverageViewModel = windowRef.WeishanGlobalShoppingProviderCoverageViewModel.buildGlobalShoppingProviderCoverageViewModel({ firstSandboxProviderConnectorSummary:firstSandboxConnector, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true });

  const ready = api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetyReview:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedGate:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff,
    providerSandboxDryRunHarnessSummary:dryRunHarness,
    firstReadOnlyProviderAdapterShellSummary:adapterShell,
    providerSandboxSafetyKillSwitchSummary:killSwitch,
    providerSandboxDryRunViewModelSummary:dryRunViewModel,
    firstSandboxProviderConnectorSummary:firstSandboxConnector,
    providerCoverageDashboardSummary:coverageDashboard,
    readOnlySourceTrustScoreSummary:sourceTrust,
    providerCoverageViewModelSummary:coverageViewModel,
    sandboxCandidateComparisonWorkbenchSummary:{
      status:"ready",
      userFacingSummary:{ title:"Sandbox 候选对比工作台", resultLabel:"候选对比已准备", redacted:true },
      candidateRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", confidenceLabel:"high", recommendationLabel:"review_first", caveat:"该候选只表示当前 sandbox 证据下优先复核顺序，不代表最低价保证或交易能力。", redacted:true }],
      recommendationSummary:{ recommendedCandidateId:"candidate_a", recommendationLabel:"review_first", reason:"Official Fixture 在当前 sandbox 证据下更适合先复核。", redacted:true },
      redacted:true
    },
    providerEvidenceComparisonMatrixSummary:{
      status:"ready",
      userFacingSummary:{ title:"Provider 证据对比矩阵", resultLabel:"证据矩阵已准备", redacted:true },
      matrixRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", completenessLabel:"完整", caveat:"当前矩阵只展示脱敏 sandbox 证据摘要。", redacted:true }],
      redacted:true
    },
    readOnlyHandoffReadinessDrillSummary:{
      status:"ready",
      userFacingSummary:{ title:"只读跳转交接演练", resultLabel:"交接演练已准备", redacted:true },
      rows:[{ rowId:"allowed_parameters", label:"允许参数", value:"origin, destination, date", status:"pass", redacted:true }],
      redacted:true
    },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核", redacted:true },
    manualPlatformReviewCockpitSummary:manualPlatformReviewCockpit,
    handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthrough,
    platformRealityCheckBoardSummary:platformRealityCheckBoard,
    manualPlatformReviewViewModelSummary:manualPlatformReviewViewModel,
    userFacingManualReviewFlowSummary:userFacingManualReviewFlow,
    platformVerificationProgressTrackerSummary:platformVerificationProgressTracker,
    safeNextActionPanelSummary:safeNextActionPanel,
    userManualReviewViewModelSummary:userManualReviewViewModel,
    sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary,
    vaultBoundaryContractSummary:vaultBoundaryContractSummary,
    legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary,
    providerMockRuntimeViewModelSummary:providerMockRuntimeViewModelSummary,
    mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
    providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
    providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
    providerLaunchReadinessViewModelSummary:providerLaunchReadinessViewModelSummary,
    providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
    mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
    productionBlockerMatrixSummary:productionBlockerMatrixSummary,
    providerPilotControlViewModelSummary:providerPilotControlViewModelSummary
  });
  assert.equal(ready.appVersion, "3.7.0");
  assert.equal(ready.status, "needs_review");
  assert.equal(ready.userFacingSummary.resultLabel, "只读价格流水线仍需复核");
  assert.equal(ready.pipelineStages.length, 83);
  assert.equal(ready.readyOutputs.canShowFixtureCandidatePrices, true);
  assert.equal(ready.readyOutputs.canShowFixtureReplay, true);
  assert.equal(ready.readyOutputs.canShowOfficialAnchor, true);
  assert.equal(ready.readyOutputs.canShowCoveredLowestCandidate, true);
  assert.equal(ready.readyOutputs.canProceedToReadOnlyProviderSandbox, true);
  assert.equal(ready.readyOutputs.safeToProceedWithFirstRealReadOnlyProviderSandbox, true);
  assert.equal(ready.readyOutputs.canShowProviderSandboxDryRun, true);
  assert.equal(ready.readyOutputs.safeToProceedWithFirstProviderSandboxFixtureDryRun, true);
  assert.equal(ready.providerSandboxDryRunHarnessSummary.userFacingSummary.title, "Provider Sandbox 干跑框架");
  assert.equal(ready.firstReadOnlyProviderAdapterShellSummary.userFacingSummary.title, "第一个只读 Provider Adapter 外壳");
  assert.equal(ready.providerSandboxSafetyKillSwitchSummary.userFacingSummary.title, "Provider Sandbox 安全熔断器");
  assert.equal(ready.providerSandboxDryRunViewModelSummary.title, "Provider Sandbox 干跑准备");
  assert.equal(ready.providerLegalReviewDossierSummary.userFacingSummary.title, "Provider 法务审查档案");
  assert.equal(ready.credentialVaultInterfaceStubSummary.userFacingSummary.title, "凭证保险箱接口桩");
  assert.equal(ready.sandboxAdapterContractTestbedSummary.userFacingSummary.title, "Sandbox Adapter 合同测试台");
  assert.equal(ready.providerIntegrationPrepViewModelSummary.title, "Provider 接入前准备");
  assert.equal(ready.firstSandboxProviderConnectorSummary.userFacingSummary.title, "第一个 Sandbox Provider Connector");
  assert.equal(ready.providerCoverageDashboardSummary.userFacingSummary.title, "Provider 覆盖看板");
  assert.equal(ready.readOnlySourceTrustScoreSummary.userFacingSummary.title, "只读来源可信度评分");
  assert.equal(ready.providerCoverageViewModelSummary.title, "Provider 覆盖与来源可信度");
  assert.equal(ready.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary.title, "只读 Provider Sandbox 接入闸门");
  assert.equal(ready.sandboxPriceCandidateSessionSummary.userFacingSummary.title, "Sandbox 价格候选会话");
  assert.equal(ready.sandboxPriceCandidateResultBoardSummary.title, "Sandbox 价格候选结果");
  assert.equal(ready.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary.title, "Sandbox 候选对比工作台");
  assert.equal(ready.providerEvidenceComparisonMatrixSummary.userFacingSummary.title, "Provider 证据对比矩阵");
  assert.equal(ready.readOnlyHandoffReadinessDrillSummary.userFacingSummary.title, "只读跳转交接演练");
  assert.equal(ready.sandboxDecisionReviewViewModelSummary.title, "Sandbox 候选决策复核");
  assert.equal(ready.readOnlyPlatformHandoffSimulatorSummary.userFacingSummary.title, "只读平台交接模拟器");
  assert.equal(ready.redactedSearchParameterPackSummary.userFacingSummary.title, "脱敏搜索参数包");
  assert.equal(ready.userConfirmationChecklistSummary.userFacingSummary.title, "用户确认清单");
  assert.equal(ready.platformHandoffSimulationViewModelSummary.title, "只读平台交接模拟");
  assert.equal(ready.readOnlyHandoffPacketPreviewSummary.userFacingSummary.title, "只读交接包预览");
  assert.equal(ready.platformPreflightSafetyGateSummary.userFacingSummary.title, "平台跳转前安全预检");
  assert.equal(ready.userActionBoundaryReceiptSummary.userFacingSummary.title, "用户行动边界回执");
  assert.equal(ready.handoffPacketViewModelSummary.title, "只读交接包与安全预检");
  assert.equal(ready.manualPlatformReviewCockpitSummary.userFacingSummary.title, "手动平台复核驾驶舱");
  assert.equal(ready.handoffAcceptanceWalkthroughSummary.userFacingSummary.title, "交接包接受演练");
  assert.equal(ready.platformRealityCheckBoardSummary.userFacingSummary.title, "平台真实页面复核清单");
  assert.equal(ready.manualPlatformReviewViewModelSummary.title, "手动平台复核与现实检查");
  assert.equal(ready.userFacingManualReviewFlowSummary.userFacingSummary.title, "用户手动复核流程");
  assert.equal(ready.platformVerificationProgressTrackerSummary.userFacingSummary.title, "平台核对进度追踪");
  assert.equal(ready.safeNextActionPanelSummary.userFacingSummary.title, "安全下一步");
  assert.equal(ready.userManualReviewViewModelSummary.title, "用户手动复核与安全下一步");
  assert.equal(ready.externalPlatformExitRampPreviewSummary.userFacingSummary.title, "外部平台退出坡道预览");
  assert.equal(ready.manualVisitSafetyBriefSummary.userFacingSummary.title, "手动访问安全简报");
  assert.equal(ready.readOnlySessionClosurePackSummary.userFacingSummary.title, "只读会话关闭包");
  assert.equal(ready.externalPlatformExitViewModelSummary.title, "外部平台手动访问前最终说明");
  assert.equal(ready.readOnlyCommerceSessionRecapCenterSummary.userFacingSummary.title, "只读全球购会话总结");
  assert.equal(ready.userTrustClosureSummarySummary.userFacingSummary.title, "用户信任闭环摘要");
  assert.equal(ready.nextFeatureReadinessGateSummary.userFacingSummary.title, "下一功能准备闸门");
  assert.equal(ready.commerceSessionRecapViewModelSummary.title, "只读全球购会话总结与下一步准备");
  assert.equal(ready.readOnlySandboxProviderIntegrationBlueprintSummary.userFacingSummary.title, "只读 Sandbox Provider 接入蓝图");
  assert.equal(ready.credentialIsolationReadinessBoardSummary.userFacingSummary.title, "凭证隔离准备度");
  assert.equal(ready.providerContractSelectionBoardSummary.userFacingSummary.title, "Provider 合同/授权选择板");
  assert.equal(ready.sandboxProviderPlanningViewModelSummary.title, "只读 Sandbox Provider 接入规划");
  assert.equal(ready.sandboxProviderMockRuntimeSummary.userFacingSummary.title, "Sandbox Provider Mock Runtime");
  assert.equal(ready.vaultBoundaryContractSummary.userFacingSummary.title, "Vault Boundary Contract");
  assert.equal(ready.legalApprovalWorkflowBoardSummary.userFacingSummary.title, "法务审批流程板");
  assert.equal(ready.providerMockRuntimeViewModelSummary.title, "Provider Mock Runtime 与审批准备");
  assert.equal(ready.mockProviderAdapterRegistryRuntimeSummary.userFacingSummary.title, "Mock Provider Adapter 注册运行时");
  assert.equal(ready.providerContractReplayHarnessSummary.userFacingSummary.title, "Provider 合同回放器");
  assert.equal(ready.providerLaunchReadinessBoardSummary.userFacingSummary.title, "Provider 启动准备总闸门");
  assert.equal(ready.providerLaunchReadinessViewModelSummary.title, "Provider 启动准备与合同回放");
  assert.equal(ready.providerSandboxPilotControlRoomSummary.userFacingSummary.title, "Provider Sandbox Pilot 控制室");
  assert.equal(ready.mockProviderIncidentDrillSummary.userFacingSummary.title, "Mock Provider 事故演练");
  assert.equal(ready.productionBlockerMatrixSummary.userFacingSummary.title, "Production 阻断矩阵");
  assert.equal(ready.providerPilotControlViewModelSummary.title, "Provider Sandbox Pilot 控制与阻断");
  assert.equal(ready.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilotPlan, true);
  assert.equal(ready.humanApprovalSimulationGateSummary.userFacingSummary.title, "人工审批模拟闸门");
  assert.equal(ready.mockProviderLaunchDrillSummary.userFacingSummary.title, "Mock Provider 启动演练");
  assert.equal(ready.sandboxProviderRollbackPlanSummary.userFacingSummary.title, "Sandbox Provider 回滚预案");
  assert.equal(ready.providerLaunchSimulationViewModelSummary.title, "Provider 启动模拟与回滚预案");
  assert.equal(ready.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilot, false);
  assert.equal(ready.readyOutputs.safeToProceedWithFirstSandboxProviderConnectorImplementation, true);
  assert.equal(ready.readyOutputs.safeToProceedWithFirstReadOnlyProviderSandboxIntegration, true);
  assert.equal(ready.readyOutputs.safeToProceedWithSandboxCandidateUserPreview, false);
  assert.equal(ready.readyOutputs.safeToProceedWithReadOnlySessionClosureEducation, true);
  assert.equal(ready.readyOutputs.safeToProceedWithReadOnlyProviderSandboxPlanning, true);
  assert.equal(ready.readyOutputs.safeToProceedWithProviderLegalAndCredentialReview, true);
  assert.equal(ready.readyOutputs.safeToProceedWithProviderSandboxContractImplementation, true);
  assert.equal(ready.readyOutputs.safeToProceedWithMockAdapterRuntimeHardening, true);
  assert.equal(ready.readyOutputs.safeToProceedWithSandboxDecisionReview, true);
  assert.equal(ready.readyOutputs.safeToProceedWithUserFacingHandoffExplanation, true);
  assert.equal(ready.readyOutputs.safeToProceedWithManualPlatformReview, true);
  assert.equal(ready.readyOutputs.safeToProceedWithManualPlatformUserEducation, true);
  assert.equal(ready.readyOutputs.safeToProceedWithManualExternalPlatformVisitEducation, true);

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    priceSourceNormalizer:normalization,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  const blocked = api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff,
    networkEnabled:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(blocked);
  assert.equal(/https?:\/\/blocked|token|secret/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR PASS");
}

main();
